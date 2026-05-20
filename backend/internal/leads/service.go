package leads

import (
	"context"

	"revendaclick/backend/internal/analytics"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, tenantID string, f ListFilter) ([]*Lead, int, error) {
	return s.repo.List(ctx, tenantID, f)
}

func (s *Service) GetByID(ctx context.Context, tenantID, id string) (*Lead, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *Service) Create(ctx context.Context, tenantID string, req *CreateRequest, remoteIP string) (*Lead, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	if req.Source == "" {
		req.Source = "marketplace"
	}
	lead, err := s.repo.Create(ctx, tenantID, req, remoteIP)
	if err != nil {
		return nil, err
	}
	go analytics.InvalidateSummary(tenantID)
	return lead, nil
}

func (s *Service) Update(ctx context.Context, tenantID, id, userRole, sellerUserID string, req *UpdateRequest) (*Lead, error) {
	existing, err := s.repo.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}

	if userRole == "seller" && existing.SellerID != nil && *existing.SellerID != sellerUserID {
		return nil, ErrForbidden
	}

	lead, err := s.repo.Update(ctx, tenantID, id, req)
	if err != nil {
		return nil, err
	}
	go analytics.InvalidateSummary(tenantID)
	return lead, nil
}

func (s *Service) Delete(ctx context.Context, tenantID, id string) error {
	if err := s.repo.Delete(ctx, tenantID, id); err != nil {
		return err
	}
	go analytics.InvalidateSummary(tenantID)
	return nil
}

func (s *Service) AddActivity(ctx context.Context, tenantID, leadID, userID string, req *AddActivityRequest) (*Activity, error) {
	if req.Type == "" || req.Description == "" {
		return nil, validationErr("type and description are required")
	}
	return s.repo.AddActivity(ctx, tenantID, leadID, userID, req)
}

func (s *Service) ListActivities(ctx context.Context, tenantID, leadID string) ([]*Activity, error) {
	return s.repo.ListActivities(ctx, tenantID, leadID)
}

func (s *Service) ListFollowUps(ctx context.Context, tenantID, sellerID string) ([]*Lead, error) {
	return s.repo.ListFollowUps(ctx, tenantID, sellerID)
}
