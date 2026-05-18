package vehicles

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, tenantID string, f ListFilter) ([]*Vehicle, int, error) {
	return s.repo.List(ctx, tenantID, f)
}

func (s *Service) GetByID(ctx context.Context, tenantID, id string) (*Vehicle, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *Service) GetBySlug(ctx context.Context, tenantID, slug string) (*Vehicle, error) {
	v, err := s.repo.GetBySlug(ctx, tenantID, slug)
	if err == nil {
		go s.repo.IncrementViews(ctx, v.ID)
	}
	return v, err
}

func (s *Service) Create(ctx context.Context, tenantID string, req *CreateRequest) (*Vehicle, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, tenantID, req)
}

func (s *Service) Update(ctx context.Context, tenantID, id, userRole string, sellerUserID string, req *UpdateRequest) (*Vehicle, error) {
	existing, err := s.repo.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}

	// Sellers can only edit their own vehicles
	if userRole == "seller" && (existing.SellerID == nil || *existing.SellerID != sellerUserID) {
		return nil, ErrForbidden
	}

	return s.repo.Update(ctx, tenantID, id, req)
}

func (s *Service) Delete(ctx context.Context, tenantID, id string) error {
	return s.repo.Delete(ctx, tenantID, id)
}
