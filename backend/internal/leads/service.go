package leads

import "context"

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
	return s.repo.Create(ctx, tenantID, req, remoteIP)
}

func (s *Service) Update(ctx context.Context, tenantID, id, userRole, sellerUserID string, req *UpdateRequest) (*Lead, error) {
	existing, err := s.repo.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}

	if userRole == "seller" && existing.SellerID != nil && *existing.SellerID != sellerUserID {
		return nil, ErrForbidden
	}

	return s.repo.Update(ctx, tenantID, id, req)
}

func (s *Service) Delete(ctx context.Context, tenantID, id string) error {
	return s.repo.Delete(ctx, tenantID, id)
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
