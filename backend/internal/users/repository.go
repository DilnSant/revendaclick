package users

import (
	"context"
	"errors"
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

func (r *Repository) List(ctx context.Context, tenantID string) ([]*User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, role, name, email, phone, avatar_url,
		       is_active, last_seen_at, created_at, updated_at
		FROM users WHERE tenant_id = $1 ORDER BY created_at ASC`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, tenantID, id string) (*User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, role, name, email, phone, avatar_url,
		       is_active, last_seen_at, created_at, updated_at
		FROM users WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	return scanUser(row)
}

func (r *Repository) Create(ctx context.Context, tenantID string, req *CreateRequest) (*User, error) {
	role := req.Role
	if role == "" {
		role = "seller"
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO users (id, tenant_id, role, name, email, phone)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, tenant_id, role, name, email, phone, avatar_url,
		          is_active, last_seen_at, created_at, updated_at`,
		req.ID, tenantID, role, req.Name, req.Email, req.Phone,
	)

	u, err := scanUser(row)
	if err != nil && isUserLimitError(err) {
		return nil, ErrLimitReached
	}
	return u, err
}

func (r *Repository) Update(ctx context.Context, tenantID, id string, req *UpdateRequest) (*User, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE users SET
			role       = COALESCE($3, role),
			name       = COALESCE($4, name),
			phone      = COALESCE($5, phone),
			avatar_url = COALESCE($6, avatar_url),
			is_active  = COALESCE($7, is_active)
		WHERE id = $1 AND tenant_id = $2
		RETURNING id, tenant_id, role, name, email, phone, avatar_url,
		          is_active, last_seen_at, created_at, updated_at`,
		id, tenantID, req.Role, req.Name, req.Phone, req.AvatarURL, req.IsActive,
	)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

func (r *Repository) Delete(ctx context.Context, tenantID, id string) error {
	tag, err := r.pool.Exec(ctx,
		"UPDATE users SET is_active = FALSE WHERE id = $1 AND tenant_id = $2", id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) ListSellers(ctx context.Context, tenantID string) ([]*Seller, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, user_id, display_name, phone_whatsapp,
		       bio, photo_url, is_active, created_at, updated_at
		FROM sellers WHERE tenant_id = $1 AND is_active = TRUE
		ORDER BY display_name ASC`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Seller
	for rows.Next() {
		s := &Seller{}
		if err := rows.Scan(&s.ID, &s.TenantID, &s.UserID, &s.DisplayName, &s.PhoneWhatsApp,
			&s.Bio, &s.PhotoURL, &s.IsActive, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func scanUser(row pgx.Row) (*User, error) {
	u := &User{}
	err := row.Scan(
		&u.ID, &u.TenantID, &u.Role, &u.Name, &u.Email,
		&u.Phone, &u.AvatarURL, &u.IsActive, &u.LastSeenAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

func isUserLimitError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "user_limit_reached")
}
