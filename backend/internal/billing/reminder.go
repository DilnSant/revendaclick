package billing

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

const resendAPIURL = "https://api.resend.com/emails"

// StartDueReminderWorker polls daily for invoices due in 7 days and sends a
// payment reminder e-mail via Resend to the tenant's registered e-mail.
// Call as: go billing.StartDueReminderWorker(pool, cfg.ResendAPIKey, cfg.ResendFromEmail, logger)
func StartDueReminderWorker(pool *pgxpool.Pool, resendAPIKey, fromEmail string, logger *zap.Logger) {
	if resendAPIKey == "" {
		logger.Warn("billing: RESEND_API_KEY not set, due-date reminder worker disabled")
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}

	sendDueReminders(pool, client, resendAPIKey, fromEmail, logger)
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		sendDueReminders(pool, client, resendAPIKey, fromEmail, logger)
	}
}

type dueInvoice struct {
	invoiceID   string
	tenantEmail string
	tenantName  string
	value       float64
	dueDate     string
	paymentURL  string
}

func sendDueReminders(pool *pgxpool.Pool, client *http.Client, resendAPIKey, fromEmail string, logger *zap.Logger) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := pool.Query(ctx, `
		SELECT bi.id, t.email, t.name, bi.value, bi.due_date::text,
		       COALESCE(bi.invoice_url, bi.bank_slip_url, '')
		FROM billing_invoices bi
		JOIN tenants t ON t.id = bi.tenant_id
		WHERE bi.status = 'pending'
		  AND bi.due_date = (CURRENT_DATE + INTERVAL '7 days')::date
		  AND bi.reminder_sent_at IS NULL
	`)
	if err != nil {
		logger.Warn("billing: due reminder query failed", zap.Error(err))
		return
	}
	defer rows.Close()

	var due []dueInvoice
	for rows.Next() {
		var d dueInvoice
		if err := rows.Scan(&d.invoiceID, &d.tenantEmail, &d.tenantName, &d.value, &d.dueDate, &d.paymentURL); err == nil {
			due = append(due, d)
		}
	}

	for _, d := range due {
		if err := sendReminderEmail(ctx, client, resendAPIKey, fromEmail, d); err != nil {
			logger.Warn("billing: failed to send due reminder", zap.String("invoice_id", d.invoiceID), zap.Error(err))
			continue
		}
		if _, err := pool.Exec(ctx,
			`UPDATE billing_invoices SET reminder_sent_at = NOW() WHERE id = $1`,
			d.invoiceID,
		); err != nil {
			logger.Warn("billing: failed to mark reminder sent", zap.String("invoice_id", d.invoiceID), zap.Error(err))
		}
	}
}

func sendReminderEmail(ctx context.Context, client *http.Client, resendAPIKey, fromEmail string, d dueInvoice) error {
	subject := fmt.Sprintf("Sua fatura RevendaClick vence em 7 dias (%s)", d.dueDate)

	paymentLine := ""
	if d.paymentURL != "" {
		paymentLine = fmt.Sprintf(`<p><a href="%s">Clique aqui para pagar</a></p>`, html.EscapeString(d.paymentURL))
	}

	emailHTML := fmt.Sprintf(`
		<p>Olá, %s!</p>
		<p>Sua fatura da assinatura RevendaClick no valor de R$ %.2f vence em <strong>%s</strong> (daqui a 7 dias).</p>
		%s
		<p>Se o pagamento já foi feito, desconsidere este aviso.</p>
	`, html.EscapeString(d.tenantName), d.value, html.EscapeString(d.dueDate), paymentLine)

	payload := map[string]any{
		"from":    fromEmail,
		"to":      []string{d.tenantEmail},
		"subject": subject,
		"html":    emailHTML,
	}
	reqBody, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resendAPIURL, bytes.NewReader(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+resendAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("resend api returned status %d", resp.StatusCode)
	}
	return nil
}
