package leads

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

const selectCols = `
	id, tenant_id, vehicle_id, seller_id, name, phone, email, message,
	status, source, notes, utm_source, utm_medium, utm_campaign,
	kanban_position, contacted_at, closed_at, follow_up_at, follow_up_note,
	created_at, updated_at`

func (r *Repository) List(ctx context.Context, tenantID string, f ListFilter) ([]*Lead, int, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}
	i := 2

	if f.Status != "" {
		where = append(where, "status = $"+strconv.Itoa(i))
		args = append(args, f.Status)
		i++
	}
	if f.SellerID != "" {
		where = append(where, "seller_id = $"+strconv.Itoa(i))
		args = append(args, f.SellerID)
		i++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM leads WHERE "+whereStr, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if f.Limit == 0 {
		f.Limit = 20
	}
	query := "SELECT " + selectCols + " FROM leads WHERE " + whereStr +
		" ORDER BY kanban_position ASC, created_at DESC" +
		" LIMIT $" + strconv.Itoa(i) + " OFFSET $" + strconv.Itoa(i+1)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*Lead
	for rows.Next() {
		l, err := scanLead(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, l)
	}
	return list, total, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, tenantID, id string) (*Lead, error) {
	row := r.pool.QueryRow(ctx,
		"SELECT "+selectCols+" FROM leads WHERE id = $1 AND tenant_id = $2", id, tenantID)
	return scanLead(row)
}

func (r *Repository) Create(ctx context.Context, tenantID string, req *CreateRequest, ip string) (*Lead, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO leads (
			tenant_id, vehicle_id, seller_id, name, phone, email,
			message, source, utm_source, utm_medium, utm_campaign, ip_address
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING `+selectCols,
		tenantID, req.VehicleID, req.SellerID, req.Name, req.Phone,
		req.Email, req.Message, req.Source,
		req.UTMSource, req.UTMMedium, req.UTMCampaign, nilIfEmpty(ip),
	)
	l, err := scanLead(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return l, err
}

func (r *Repository) Update(ctx context.Context, tenantID, id string, req *UpdateRequest) (*Lead, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE leads SET
			seller_id       = COALESCE($3, seller_id),
			status          = COALESCE($4, status),
			notes           = COALESCE($5, notes),
			kanban_position = COALESCE($6, kanban_position),
			follow_up_at    = CASE WHEN $7::timestamptz IS NOT NULL THEN $7 ELSE follow_up_at END,
			follow_up_note  = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE follow_up_note END,
			contacted_at    = CASE WHEN $4 = 'in_progress' AND contacted_at IS NULL THEN NOW() ELSE contacted_at END,
			closed_at       = CASE WHEN $4 IN ('closed_won','closed_lost') AND closed_at IS NULL THEN NOW() ELSE closed_at END
		WHERE id = $1 AND tenant_id = $2
		RETURNING `+selectCols,
		id, tenantID, req.SellerID, req.Status, req.Notes, req.KanbanPosition,
		req.FollowUpAt, req.FollowUpNote,
	)

	l, err := scanLead(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return l, err
}

func (r *Repository) Delete(ctx context.Context, tenantID, id string) error {
	tag, err := r.pool.Exec(ctx,
		"DELETE FROM leads WHERE id = $1 AND tenant_id = $2", id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) ListFollowUps(ctx context.Context, tenantID, sellerID string) ([]*Lead, error) {
	query := "SELECT " + selectCols + ` FROM leads
		WHERE tenant_id = $1
		  AND follow_up_at IS NOT NULL
		  AND follow_up_at <= NOW() + INTERVAL '24 hours'
		  AND status NOT IN ('closed_won','closed_lost')`
	args := []any{tenantID}

	if sellerID != "" {
		query += " AND seller_id = $2"
		args = append(args, sellerID)
	}
	query += " ORDER BY follow_up_at ASC LIMIT 50"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Lead
	for rows.Next() {
		l, err := scanLead(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, rows.Err()
}

func (r *Repository) AddActivity(ctx context.Context, tenantID, leadID, userID string, req *AddActivityRequest) (*Activity, error) {
	a := &Activity{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO lead_activities (tenant_id, lead_id, user_id, type, description)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, tenant_id, lead_id, user_id, type, description, created_at`,
		tenantID, leadID, nilIfEmpty(userID), req.Type, req.Description,
	).Scan(&a.ID, &a.TenantID, &a.LeadID, &a.UserID, &a.Type, &a.Description, &a.CreatedAt)
	return a, err
}

func (r *Repository) ListActivities(ctx context.Context, tenantID, leadID string) ([]*Activity, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, lead_id, user_id, type, description, created_at
		FROM lead_activities
		WHERE lead_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC`,
		leadID, tenantID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Activity
	for rows.Next() {
		a := &Activity{}
		if err := rows.Scan(&a.ID, &a.TenantID, &a.LeadID, &a.UserID, &a.Type, &a.Description, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func scanLead(row pgx.Row) (*Lead, error) {
	l := &Lead{}
	err := row.Scan(
		&l.ID, &l.TenantID, &l.VehicleID, &l.SellerID,
		&l.Name, &l.Phone, &l.Email, &l.Message,
		&l.Status, &l.Source, &l.Notes,
		&l.UTMSource, &l.UTMMedium, &l.UTMCampaign,
		&l.KanbanPosition, &l.ContactedAt, &l.ClosedAt,
		&l.FollowUpAt, &l.FollowUpNote,
		&l.CreatedAt, &l.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return l, err
}

func nilIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
