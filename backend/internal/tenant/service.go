package tenant

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetByID(ctx context.Context, id string) (*Tenant, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (*Tenant, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *Service) Create(ctx context.Context, req *CreateRequest) (*Tenant, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, req)
}

func (s *Service) Update(ctx context.Context, id string, req *UpdateRequest) (*Tenant, error) {
	return s.repo.Update(ctx, id, req)
}
