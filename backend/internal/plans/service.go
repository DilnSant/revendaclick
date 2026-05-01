package plans

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListPlans(ctx context.Context) ([]*Plan, error) {
	return s.repo.ListPlans(ctx)
}

func (s *Service) GetUsage(ctx context.Context, tenantID string) (*Usage, error) {
	return s.repo.GetUsage(ctx, tenantID)
}
