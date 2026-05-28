package storecontact

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Get(ctx context.Context, tenantID string) (*StoreContact, error) {
	return s.repo.GetByTenantID(ctx, tenantID)
}

func (s *Service) Upsert(ctx context.Context, tenantID string, req *UpsertRequest) (*StoreContact, error) {
	return s.repo.Upsert(ctx, tenantID, req)
}
