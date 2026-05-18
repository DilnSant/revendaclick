package customers

import (
	"context"
	"errors"
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

const cols = `id, tenant_id, name, email, phone, cpf_cnpj,
	address_city, address_state, notes, is_active, created_at, updated_at`

func (r *Repository) List(ctx context.Context, tenantID string, f ListFilter) ([]*Customer, int, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}
	i := 2

	if f.Search != "" {
		where = append(where, `to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(cpf_cnpj,'')) @@ plainto_tsquery('portuguese', $`+itoa(i)+`)`)
		args = append(args, f.Search)
		i++
	}
	if f.State != "" {
		where = append(where, "address_state = $"+itoa(i))
		args = append(args, f.State)
		i++
	}
	if f.IsActive != nil {
		where = append(where, "is_active = $"+itoa(i))
		args = append(args, *f.IsActive)
		i++
	}

	w := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM customers WHERE "+w, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if f.Limit == 0 {
		f.Limit = 20
	}

	rows, err := r.pool.Query(ctx,
		"SELECT "+cols+" FROM customers WHERE "+w+
			" ORDER BY name ASC LIMIT $"+itoa(i)+" OFFSET $"+itoa(i+1),
		append(args, f.Limit, f.Offset)...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*Customer
	for rows.Next() {
		c, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, c)
	}
	return list, total, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, tenantID, id string) (*Customer, error) {
	row := r.pool.QueryRow(ctx,
		"SELECT "+cols+" FROM customers WHERE id = $1 AND tenant_id = $2", id, tenantID)
	return scan(row)
}

func (r *Repository) Create(ctx context.Context, tenantID string, req *CreateRequest) (*Customer, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO customers (tenant_id, name, email, phone, cpf_cnpj, address_city, address_state, notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING `+cols,
		tenantID, req.Name, req.Email, req.Phone, req.CpfCnpj,
		req.AddressCity, req.AddressState, req.Notes,
	)
	return scan(row)
}

func (r *Repository) Update(ctx context.Context, tenantID, id string, req *UpdateRequest) (*Customer, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE customers SET
			name          = COALESCE($3, name),
			email         = COALESCE($4, email),
			phone         = COALESCE($5, phone),
			cpf_cnpj      = COALESCE($6, cpf_cnpj),
			address_city  = COALESCE($7, address_city),
			address_state = COALESCE($8, address_state),
			notes         = COALESCE($9, notes),
			is_active     = COALESCE($10, is_active)
		WHERE id = $1 AND tenant_id = $2
		RETURNING `+cols,
		id, tenantID,
		req.Name, req.Email, req.Phone, req.CpfCnpj,
		req.AddressCity, req.AddressState, req.Notes, req.IsActive,
	)
	c, err := scan(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

func (r *Repository) Delete(ctx context.Context, tenantID, id string) error {
	tag, err := r.pool.Exec(ctx,
		"DELETE FROM customers WHERE id = $1 AND tenant_id = $2", id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scan(row pgx.Row) (*Customer, error) {
	c := &Customer{}
	err := row.Scan(
		&c.ID, &c.TenantID, &c.Name, &c.Email, &c.Phone, &c.CpfCnpj,
		&c.AddressCity, &c.AddressState, &c.Notes, &c.IsActive,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

func itoa(i int) string { return strconv.Itoa(i) }
