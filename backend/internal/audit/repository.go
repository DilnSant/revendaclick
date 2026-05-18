package audit

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Write(ctx context.Context, tenantID string, req WriteRequest) {
	oldJSON, _ := json.Marshal(req.OldData)
	newJSON, _ := json.Marshal(req.NewData)

	// Fire-and-forget — audit failures must never break the main flow
	_, _ = r.pool.Exec(ctx, `
		INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet)`,
		tenantID, nilIfEmpty(req.UserID), req.Action, req.EntityType,
		nilIfEmpty(req.EntityID), oldJSON, newJSON, nilIfEmpty(req.IPAddress),
	)
}

func (r *Repository) List(ctx context.Context, tenantID string, limit, offset int) ([]*Log, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, created_at
		FROM audit_logs
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`,
		tenantID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*Log
	for rows.Next() {
		l := &Log{}
		var oldRaw, newRaw []byte
		if err := rows.Scan(
			&l.ID, &l.TenantID, &l.UserID, &l.Action,
			&l.EntityType, &l.EntityID, &oldRaw, &newRaw, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(oldRaw, &l.OldData)
		_ = json.Unmarshal(newRaw, &l.NewData)
		list = append(list, l)
	}
	return list, rows.Err()
}

func nilIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
