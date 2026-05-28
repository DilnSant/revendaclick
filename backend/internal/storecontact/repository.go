package storecontact

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("store contact not found")

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetByTenantID(ctx context.Context, tenantID string) (*StoreContact, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, public_whatsapp, public_phone, public_email,
		       instagram, groups_link, location, created_at, updated_at
		FROM tenant_public_contacts WHERE tenant_id = $1`, tenantID)
	return scanStoreContact(row)
}

func (r *Repository) Upsert(ctx context.Context, tenantID string, req *UpsertRequest) (*StoreContact, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO tenant_public_contacts
		  (tenant_id, public_whatsapp, public_phone, public_email, instagram, groups_link, location)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tenant_id) DO UPDATE SET
		  public_whatsapp = EXCLUDED.public_whatsapp,
		  public_phone    = EXCLUDED.public_phone,
		  public_email    = EXCLUDED.public_email,
		  instagram       = EXCLUDED.instagram,
		  groups_link     = EXCLUDED.groups_link,
		  location        = EXCLUDED.location,
		  updated_at      = NOW()
		RETURNING id, tenant_id, public_whatsapp, public_phone, public_email,
		          instagram, groups_link, location, created_at, updated_at`,
		tenantID, req.PublicWhatsApp, req.PublicPhone, req.PublicEmail,
		req.Instagram, req.GroupsLink, req.Location,
	)
	return scanStoreContact(row)
}

func scanStoreContact(row pgx.Row) (*StoreContact, error) {
	sc := &StoreContact{}
	err := row.Scan(
		&sc.ID, &sc.TenantID, &sc.PublicWhatsApp, &sc.PublicPhone, &sc.PublicEmail,
		&sc.Instagram, &sc.GroupsLink, &sc.Location, &sc.CreatedAt, &sc.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return sc, err
}
