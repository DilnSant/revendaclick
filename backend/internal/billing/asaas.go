package billing

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	asaasProdURL    = "https://www.asaas.com/api/v3"
	asaasSandboxURL = "https://sandbox.asaas.com/api/v3"
)

type asaasClient struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func newAsaasClient(apiKey, env string) *asaasClient {
	base := asaasProdURL
	if env != "production" {
		base = asaasSandboxURL
	}
	return &asaasClient{
		baseURL: base,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 20 * time.Second},
	}
}

func (c *asaasClient) do(method, path string, body any, out any) error {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("asaas marshal: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, c.baseURL+path, bodyReader)
	if err != nil {
		return fmt.Errorf("asaas request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("access_token", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("asaas call: %w", err)
	}
	defer resp.Body.Close()

	b, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return fmt.Errorf("asaas HTTP %d: %s", resp.StatusCode, string(b))
	}
	if out != nil {
		return json.Unmarshal(b, out)
	}
	return nil
}

func (c *asaasClient) createCustomer(name, email, phone, cpfCnpj, externalRef string) (*asaasCustomerResp, error) {
	req := asaasCustomerReq{
		Name:        name,
		Email:       email,
		Phone:       phone,
		CPFOrCNPJ:   cpfCnpj,
		ExternalRef: externalRef,
	}
	var resp asaasCustomerResp
	if err := c.do("POST", "/customers", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *asaasClient) createSubscription(customerID string, value float64, cycle, billingType, description, externalRef string) (*asaasSubscriptionResp, error) {
	// First payment due tomorrow (trial-first flow)
	nextDue := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
	req := asaasSubscriptionReq{
		Customer:    customerID,
		BillingType: billingType,
		Value:       value,
		NextDueDate: nextDue,
		Cycle:       cycle,
		Description: description,
		ExternalRef: externalRef,
	}
	var resp asaasSubscriptionResp
	if err := c.do("POST", "/subscriptions", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *asaasClient) cancelSubscription(subscriptionID string) error {
	return c.do("DELETE", "/subscriptions/"+subscriptionID, nil, nil)
}

func (c *asaasClient) getSubscriptionPayments(subscriptionID string) (string, error) {
	type paymentResp struct {
		Data []struct {
			InvoiceURL string `json:"invoiceUrl"`
			Status     string `json:"status"`
		} `json:"data"`
	}
	var out paymentResp
	if err := c.do("GET", "/payments?subscription="+subscriptionID+"&status=PENDING&limit=1", nil, &out); err != nil {
		return "", err
	}
	if len(out.Data) > 0 {
		return out.Data[0].InvoiceURL, nil
	}
	return "", nil
}
