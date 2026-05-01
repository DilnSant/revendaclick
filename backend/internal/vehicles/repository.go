package vehicles

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
	id, tenant_id, seller_id, title, brand, model, version,
	year_model, year_manufacture, color, mileage, fuel, transmission,
	doors, engine, horsepower, features, price, price_negotiable,
	fipe_price, status, condition, is_featured, images, thumbnail_url,
	video_url, slug, description, plate_last_digits,
	views_count, leads_count, created_at, updated_at`

func (r *Repository) List(ctx context.Context, tenantID string, f ListFilter) ([]*Vehicle, int, error) {
	args := []any{tenantID}
	where := []string{"tenant_id = $1"}
	i := 2

	if f.Status != "" {
		where = append(where, "status = $"+itoa(i))
		args = append(args, f.Status)
		i++
	}
	if f.Brand != "" {
		where = append(where, "brand ILIKE $"+itoa(i))
		args = append(args, "%"+f.Brand+"%")
		i++
	}
	if f.MinPrice != nil {
		where = append(where, "price >= $"+itoa(i))
		args = append(args, *f.MinPrice)
		i++
	}
	if f.MaxPrice != nil {
		where = append(where, "price <= $"+itoa(i))
		args = append(args, *f.MaxPrice)
		i++
	}
	if f.Condition != "" {
		where = append(where, "condition = $"+itoa(i))
		args = append(args, f.Condition)
		i++
	}

	whereStr := strings.Join(where, " AND ")

	var total int
	err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM vehicles WHERE "+whereStr, args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	if f.Limit == 0 {
		f.Limit = 20
	}

	query := "SELECT " + selectCols + " FROM vehicles WHERE " + whereStr +
		" ORDER BY is_featured DESC, created_at DESC" +
		" LIMIT $" + itoa(i) + " OFFSET $" + itoa(i+1)
	args = append(args, f.Limit, f.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*Vehicle
	for rows.Next() {
		v, err := scanVehicle(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, v)
	}
	return list, total, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, tenantID, id string) (*Vehicle, error) {
	row := r.pool.QueryRow(ctx,
		"SELECT "+selectCols+" FROM vehicles WHERE id = $1 AND tenant_id = $2",
		id, tenantID)
	return scanVehicle(row)
}

func (r *Repository) GetBySlug(ctx context.Context, tenantID, slug string) (*Vehicle, error) {
	row := r.pool.QueryRow(ctx,
		"SELECT "+selectCols+" FROM vehicles WHERE slug = $1 AND tenant_id = $2",
		slug, tenantID)
	return scanVehicle(row)
}

func (r *Repository) Create(ctx context.Context, tenantID string, req *CreateRequest) (*Vehicle, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO vehicles (
			tenant_id, seller_id, title, brand, model, version,
			year_model, year_manufacture, color, mileage, fuel, transmission,
			doors, engine, horsepower, features, price, price_negotiable,
			fipe_price, condition, images, thumbnail_url, video_url,
			slug, description, plate_last_digits
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
			$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
		) RETURNING `+selectCols,
		tenantID, req.SellerID, req.Title, req.Brand, req.Model, req.Version,
		req.YearModel, req.YearManufacture, req.Color, req.Mileage, req.Fuel, req.Transmission,
		req.Doors, req.Engine, req.Horsepower, req.Features, req.Price, req.PriceNegotiable,
		req.FipePrice, req.Condition, req.Images, req.ThumbnailURL, req.VideoURL,
		req.Slug, req.Description, req.PlateLastDigits,
	)

	v, err := scanVehicle(row)
	if err != nil && isPlanLimitError(err) {
		return nil, ErrLimitReached
	}
	return v, err
}

func (r *Repository) Update(ctx context.Context, tenantID, id string, req *UpdateRequest) (*Vehicle, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE vehicles SET
			seller_id       = COALESCE($3, seller_id),
			title           = COALESCE($4, title),
			brand           = COALESCE($5, brand),
			model           = COALESCE($6, model),
			version         = COALESCE($7, version),
			year_model      = COALESCE($8, year_model),
			year_manufacture= COALESCE($9, year_manufacture),
			color           = COALESCE($10, color),
			mileage         = COALESCE($11, mileage),
			fuel            = COALESCE($12, fuel),
			transmission    = COALESCE($13, transmission),
			doors           = COALESCE($14, doors),
			engine          = COALESCE($15, engine),
			horsepower      = COALESCE($16, horsepower),
			features        = COALESCE($17, features),
			price           = COALESCE($18, price),
			price_negotiable= COALESCE($19, price_negotiable),
			fipe_price      = COALESCE($20, fipe_price),
			status          = COALESCE($21, status),
			is_featured     = COALESCE($22, is_featured),
			images          = COALESCE($23, images),
			thumbnail_url   = COALESCE($24, thumbnail_url),
			video_url       = COALESCE($25, video_url),
			description     = COALESCE($26, description)
		WHERE id = $1 AND tenant_id = $2
		RETURNING `+selectCols,
		id, tenantID,
		req.SellerID, req.Title, req.Brand, req.Model, req.Version,
		req.YearModel, req.YearManufacture, req.Color, req.Mileage,
		req.Fuel, req.Transmission, req.Doors, req.Engine, req.Horsepower,
		req.Features, req.Price, req.PriceNegotiable, req.FipePrice,
		req.Status, req.IsFeatured, req.Images, req.ThumbnailURL,
		req.VideoURL, req.Description,
	)

	v, err := scanVehicle(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return v, err
}

func (r *Repository) Delete(ctx context.Context, tenantID, id string) error {
	tag, err := r.pool.Exec(ctx,
		"DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2", id, tenantID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) IncrementViews(ctx context.Context, id string) {
	_, _ = r.pool.Exec(ctx,
		"UPDATE vehicles SET views_count = views_count + 1 WHERE id = $1", id)
}

func scanVehicle(row pgx.Row) (*Vehicle, error) {
	v := &Vehicle{}
	err := row.Scan(
		&v.ID, &v.TenantID, &v.SellerID, &v.Title, &v.Brand, &v.Model, &v.Version,
		&v.YearModel, &v.YearManufacture, &v.Color, &v.Mileage, &v.Fuel, &v.Transmission,
		&v.Doors, &v.Engine, &v.Horsepower, &v.Features, &v.Price, &v.PriceNegotiable,
		&v.FipePrice, &v.Status, &v.Condition, &v.IsFeatured, &v.Images, &v.ThumbnailURL,
		&v.VideoURL, &v.Slug, &v.Description, &v.PlateLastDigits,
		&v.ViewsCount, &v.LeadsCount, &v.CreatedAt, &v.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return v, err
}

// isPlanLimitError checks for the DB trigger exception code P0001 with our marker.
func isPlanLimitError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "vehicle_limit_reached")
}

func itoa(i int) string { return strconv.Itoa(i) }
