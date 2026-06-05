package tenant

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("tenant not found")

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Tenant, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, name, email, phone_whatsapp, cpf_cnpj,
		       logo_url, description, address, social_links,
		       custom_domain, seo_title, seo_description, theme,
		       is_active, created_at, updated_at
		FROM tenants WHERE id = $1`, id)

	return scanTenant(row)
}

func (r *Repository) GetBySlug(ctx context.Context, slug string) (*Tenant, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, name, email, phone_whatsapp, cpf_cnpj,
		       logo_url, description, address, social_links,
		       custom_domain, seo_title, seo_description, theme,
		       is_active, created_at, updated_at
		FROM tenants WHERE slug = $1 AND is_active = TRUE`, slug)

	return scanTenant(row)
}

func (r *Repository) Create(ctx context.Context, req *CreateRequest) (*Tenant, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO tenants (slug, name, email, phone_whatsapp)
		VALUES ($1, $2, $3, $4)
		RETURNING id, slug, name, email, phone_whatsapp, cpf_cnpj,
		          logo_url, description, address, social_links,
		          custom_domain, seo_title, seo_description, theme,
		          is_active, created_at, updated_at`,
		req.Slug, req.Name, req.Email, req.PhoneWhatsApp,
	)
	return scanTenant(row)
}

func (r *Repository) Update(ctx context.Context, id string, req *UpdateRequest) (*Tenant, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE tenants SET
			name            = COALESCE($2, name),
			phone_whatsapp  = COALESCE($3, phone_whatsapp),
			cpf_cnpj        = COALESCE($4, cpf_cnpj),
			logo_url        = COALESCE($5, logo_url),
			description     = COALESCE($6, description),
			address         = COALESCE($7, address),
			social_links    = COALESCE($8, social_links),
			custom_domain   = COALESCE($9, custom_domain),
			seo_title       = COALESCE($10, seo_title),
			seo_description = COALESCE($11, seo_description),
			theme           = COALESCE($12, theme)
		WHERE id = $1
		RETURNING id, slug, name, email, phone_whatsapp, cpf_cnpj,
		          logo_url, description, address, social_links,
		          custom_domain, seo_title, seo_description, theme,
		          is_active, created_at, updated_at`,
		id, req.Name, req.PhoneWhatsApp, req.CPFOrCNPJ, req.LogoURL, req.Description,
		req.Address, req.SocialLinks, req.CustomDomain,
		req.SEOTitle, req.SEODescription, req.Theme,
	)
	return scanTenant(row)
}

func scanTenant(row pgx.Row) (*Tenant, error) {
	t := &Tenant{}
	err := row.Scan(
		&t.ID, &t.Slug, &t.Name, &t.Email, &t.PhoneWhatsApp, &t.CPFOrCNPJ,
		&t.LogoURL, &t.Description, &t.Address, &t.SocialLinks,
		&t.CustomDomain, &t.SEOTitle, &t.SEODescription, &t.Theme,
		&t.IsActive, &t.CreatedAt, &t.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return t, err
}
