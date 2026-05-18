package financial

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ─── Financial entries ────────────────────────────────────────────────────────

const entryCols = `
	id, tenant_id, type, category, description, amount, payment_method,
	status, due_date::text, paid_at, reference_id::text, reference_type,
	notes, created_by::text, created_at, updated_at`

func scanEntry(row pgx.Row) (*Entry, error) {
	e := &Entry{}
	err := row.Scan(
		&e.ID, &e.TenantID, &e.Type, &e.Category, &e.Description,
		&e.Amount, &e.PaymentMethod, &e.Status, &e.DueDate, &e.PaidAt,
		&e.ReferenceID, &e.ReferenceType, &e.Notes, &e.CreatedBy,
		&e.CreatedAt, &e.UpdatedAt,
	)
	return e, err
}

func (r *Repository) ListEntries(ctx context.Context, tenantID string, f ListEntryFilter) ([]*Entry, int, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}
	i := 2

	if f.Type != "" {
		where = append(where, "type = $"+strconv.Itoa(i))
		args = append(args, f.Type)
		i++
	}
	if f.Status != "" {
		where = append(where, "status = $"+strconv.Itoa(i))
		args = append(args, f.Status)
		i++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM financial_entries WHERE "+whereStr, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if f.Limit == 0 {
		f.Limit = 50
	}
	query := "SELECT " + entryCols + " FROM financial_entries WHERE " + whereStr +
		" ORDER BY created_at DESC LIMIT $" + strconv.Itoa(i) + " OFFSET $" + strconv.Itoa(i+1)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var entries []*Entry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, 0, err
		}
		entries = append(entries, e)
	}
	return entries, total, rows.Err()
}

func (r *Repository) CreateEntry(ctx context.Context, tenantID, userID string, req *CreateEntryRequest) (*Entry, error) {
	status := req.Status
	if status == "" {
		status = "paid"
	}
	paymentMethod := req.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "other"
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO financial_entries
			(tenant_id, type, category, description, amount, payment_method, status, due_date, notes, created_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10::uuid)
		RETURNING `+entryCols,
		tenantID, req.Type, req.Category, req.Description,
		req.Amount, paymentMethod, status,
		req.DueDate, req.Notes, stringOrNil(userID),
	)
	return scanEntry(row)
}

// ─── Sales ─────────────────────────────────────────────────────────────────────

const saleCols = `
	id, tenant_id, vehicle_id::text, lead_id::text, seller_id::text,
	customer_id::text, sale_price, list_price, discount, financing_type,
	financing_amount, payment_method, status, sold_at, notes, created_at, updated_at`

func scanSale(row pgx.Row) (*Sale, error) {
	s := &Sale{}
	err := row.Scan(
		&s.ID, &s.TenantID, &s.VehicleID, &s.LeadID, &s.SellerID,
		&s.CustomerID, &s.SalePrice, &s.ListPrice, &s.Discount, &s.FinancingType,
		&s.FinancingAmount, &s.PaymentMethod, &s.Status, &s.SoldAt,
		&s.Notes, &s.CreatedAt, &s.UpdatedAt,
	)
	return s, err
}

func (r *Repository) ListSales(ctx context.Context, tenantID string, f ListSaleFilter) ([]*Sale, int, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}
	i := 2

	if f.SellerID != "" {
		where = append(where, "seller_id = $"+strconv.Itoa(i))
		args = append(args, f.SellerID)
		i++
	}
	if f.Status != "" {
		where = append(where, "status = $"+strconv.Itoa(i))
		args = append(args, f.Status)
		i++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM sales WHERE "+whereStr, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if f.Limit == 0 {
		f.Limit = 50
	}
	query := "SELECT " + saleCols + " FROM sales WHERE " + whereStr +
		" ORDER BY created_at DESC LIMIT $" + strconv.Itoa(i) + " OFFSET $" + strconv.Itoa(i+1)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sales []*Sale
	for rows.Next() {
		s, err := scanSale(rows)
		if err != nil {
			return nil, 0, err
		}
		sales = append(sales, s)
	}
	return sales, total, rows.Err()
}

func (r *Repository) GetSale(ctx context.Context, tenantID, id string) (*Sale, error) {
	row := r.pool.QueryRow(ctx,
		"SELECT "+saleCols+" FROM sales WHERE tenant_id = $1 AND id = $2",
		tenantID, id,
	)
	s, err := scanSale(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return s, err
}

func (r *Repository) CreateSale(ctx context.Context, tenantID string, req *CreateSaleRequest) (*Sale, error) {
	ft := req.FinancingType
	if ft == "" {
		ft = "none"
	}
	pm := req.PaymentMethod
	if pm == "" {
		pm = "other"
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO sales
			(tenant_id, vehicle_id, lead_id, seller_id, customer_id,
			 sale_price, list_price, discount, financing_type, financing_amount,
			 payment_method, status)
		VALUES ($1,$2::uuid,$3::uuid,$4::uuid,$5::uuid,$6,$7,$8,$9,$10,$11,'pending')
		RETURNING `+saleCols,
		tenantID, req.VehicleID, req.LeadID, req.SellerID, req.CustomerID,
		req.SalePrice, req.ListPrice, req.Discount, ft, req.FinancingAmount, pm,
	)
	return scanSale(row)
}

func (r *Repository) UpdateSale(ctx context.Context, tenantID, id string, req *UpdateSaleRequest) (*Sale, error) {
	sets := []string{"updated_at = NOW()"}
	args := []any{tenantID, id}
	i := 3

	if req.Status != nil {
		sets = append(sets, "status = $"+strconv.Itoa(i))
		args = append(args, *req.Status)
		i++
	}
	if req.SalePrice != nil {
		sets = append(sets, "sale_price = $"+strconv.Itoa(i))
		args = append(args, *req.SalePrice)
		i++
	}
	if req.PaymentMethod != nil {
		sets = append(sets, "payment_method = $"+strconv.Itoa(i))
		args = append(args, *req.PaymentMethod)
		i++
	}
	if req.Notes != nil {
		sets = append(sets, "notes = $"+strconv.Itoa(i))
		args = append(args, *req.Notes)
		i++
	}

	row := r.pool.QueryRow(ctx,
		"UPDATE sales SET "+strings.Join(sets, ", ")+" WHERE tenant_id = $1 AND id = $2 RETURNING "+saleCols,
		args...,
	)
	s, err := scanSale(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return s, err
}

// ─── Commissions ─────────────────────────────────────────────────────────────

const commissionCols = `
	id, tenant_id, sale_id::text, seller_id::text, type,
	rate, amount, status, paid_at, notes, created_at, updated_at`

func (r *Repository) ListCommissions(ctx context.Context, tenantID, sellerID string) ([]*Commission, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}

	if sellerID != "" {
		where = append(where, "seller_id = $2")
		args = append(args, sellerID)
	}

	rows, err := r.pool.Query(ctx,
		"SELECT "+commissionCols+" FROM commissions WHERE "+strings.Join(where, " AND ")+" ORDER BY created_at DESC",
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Commission
	for rows.Next() {
		c := &Commission{}
		if err := rows.Scan(
			&c.ID, &c.TenantID, &c.SaleID, &c.SellerID, &c.Type,
			&c.Rate, &c.Amount, &c.Status, &c.PaidAt, &c.Notes,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

// ─── Cash flow ────────────────────────────────────────────────────────────────

func (r *Repository) GetCashFlow(ctx context.Context, tenantID string, months int) ([]*CashFlowMonth, error) {
	if months == 0 {
		months = 12
	}
	rows, err := r.pool.Query(ctx, `
		SELECT month::text, total_income, total_expense, net_balance
		FROM v_cash_flow_monthly
		WHERE tenant_id = $1 AND month >= DATE_TRUNC('month', NOW() - ($2::int * INTERVAL '1 month'))
		ORDER BY month ASC`,
		tenantID, months,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*CashFlowMonth
	for rows.Next() {
		c := &CashFlowMonth{}
		if err := rows.Scan(&c.Month, &c.TotalIncome, &c.TotalExpense, &c.NetBalance); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *Repository) PayCommission(ctx context.Context, tenantID, commissionID string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE commissions SET status = 'paid', paid_at = NOW(), updated_at = NOW()
		 WHERE id = $1 AND tenant_id = $2 AND status != 'paid'`,
		commissionID, tenantID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("comissão não encontrada ou já paga")
	}
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func stringOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
