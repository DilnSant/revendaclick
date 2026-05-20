package analytics

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetSummary(ctx context.Context, tenantID string) (*Summary, error) {
	if cached, ok := globalCache.get(tenantID); ok {
		return cached, nil
	}
	summary, err := s.repo.GetSummary(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	globalCache.set(tenantID, summary)
	return summary, nil
}

// InvalidateSummary clears the analytics cache for a tenant.
// Call after mutations that affect the summary (leads, sales, vehicles).
func InvalidateSummary(tenantID string) {
	globalCache.invalidate(tenantID)
}
