package financial

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListEntries(ctx context.Context, tenantID string, f ListEntryFilter) ([]*Entry, int, error) {
	return s.repo.ListEntries(ctx, tenantID, f)
}

func (s *Service) CreateEntry(ctx context.Context, tenantID, userID string, req *CreateEntryRequest) (*Entry, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	return s.repo.CreateEntry(ctx, tenantID, userID, req)
}

func (s *Service) ListSales(ctx context.Context, tenantID string, f ListSaleFilter) ([]*Sale, int, error) {
	return s.repo.ListSales(ctx, tenantID, f)
}

func (s *Service) GetSale(ctx context.Context, tenantID, id string) (*Sale, error) {
	return s.repo.GetSale(ctx, tenantID, id)
}

func (s *Service) CreateSale(ctx context.Context, tenantID string, req *CreateSaleRequest) (*Sale, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	return s.repo.CreateSale(ctx, tenantID, req)
}

func (s *Service) CompleteSale(ctx context.Context, tenantID, id string) (*Sale, error) {
	status := "completed"
	return s.repo.UpdateSale(ctx, tenantID, id, &UpdateSaleRequest{Status: &status})
}

func (s *Service) CancelSale(ctx context.Context, tenantID, id string) (*Sale, error) {
	status := "canceled"
	return s.repo.UpdateSale(ctx, tenantID, id, &UpdateSaleRequest{Status: &status})
}

func (s *Service) UpdateSale(ctx context.Context, tenantID, id string, req *UpdateSaleRequest) (*Sale, error) {
	return s.repo.UpdateSale(ctx, tenantID, id, req)
}

func (s *Service) ListCommissions(ctx context.Context, tenantID, sellerID string) ([]*Commission, error) {
	return s.repo.ListCommissions(ctx, tenantID, sellerID)
}

func (s *Service) PayCommission(ctx context.Context, tenantID, commissionID string) error {
	return s.repo.PayCommission(ctx, tenantID, commissionID)
}

func (s *Service) GetCashFlow(ctx context.Context, tenantID string, months int) ([]*CashFlowMonth, error) {
	return s.repo.GetCashFlow(ctx, tenantID, months)
}
