package analytics

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetSummary(ctx context.Context, tenantID string) (*Summary, error) {
	return s.repo.GetSummary(ctx, tenantID)
}
