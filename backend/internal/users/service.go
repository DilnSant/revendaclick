package users

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, tenantID string) ([]*User, error) {
	return s.repo.List(ctx, tenantID)
}

func (s *Service) GetByID(ctx context.Context, tenantID, id string) (*User, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *Service) Create(ctx context.Context, tenantID string, req *CreateRequest) (*User, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, tenantID, req)
}

func (s *Service) Update(ctx context.Context, tenantID, id, callerRole, callerID string, req *UpdateRequest) (*User, error) {
	// Only owners can promote to admin/owner
	if req.Role != nil && (*req.Role == "owner" || *req.Role == "admin") && callerRole != "owner" {
		return nil, ErrForbidden
	}
	// Users can update their own profile but not their role
	if id == callerID && req.Role != nil && callerRole != "owner" && callerRole != "admin" {
		req.Role = nil
	}
	return s.repo.Update(ctx, tenantID, id, req)
}

func (s *Service) Delete(ctx context.Context, tenantID, id, callerID string) error {
	if id == callerID {
		return validationErr("cannot deactivate your own account")
	}
	return s.repo.Delete(ctx, tenantID, id)
}

func (s *Service) ListSellers(ctx context.Context, tenantID string) ([]*Seller, error) {
	return s.repo.ListSellers(ctx, tenantID)
}
