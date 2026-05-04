package financial

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"revendaclick/backend/internal/middleware"
	"revendaclick/backend/internal/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/financial/entries
func (h *Handler) ListEntries(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	f := ListEntryFilter{
		Type:   c.Query("type"),
		Status: c.Query("status"),
		Limit:  queryInt(c.Query("limit"), 50),
		Offset: queryInt(c.Query("offset"), 0),
	}
	list, total, err := h.svc.ListEntries(c.Request.Context(), tenantID, f)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSONWithMeta(c, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// POST /api/financial/entries
func (h *Handler) CreateEntry(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userID := middleware.UserIDFromGin(c)

	var req CreateEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	e, err := h.svc.CreateEntry(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, e)
}

// GET /api/financial/cash-flow
func (h *Handler) GetCashFlow(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	months := queryInt(c.Query("months"), 12)

	list, err := h.svc.GetCashFlow(c.Request.Context(), tenantID, months)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

// GET /api/sales
func (h *Handler) ListSales(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userRole := middleware.UserRoleFromGin(c)
	userID := middleware.UserIDFromGin(c)

	f := ListSaleFilter{
		Status: c.Query("status"),
		Limit:  queryInt(c.Query("limit"), 50),
		Offset: queryInt(c.Query("offset"), 0),
	}
	if userRole == "seller" {
		f.SellerID = userID
	}

	list, total, err := h.svc.ListSales(c.Request.Context(), tenantID, f)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSONWithMeta(c, http.StatusOK, list, &response.Meta{Total: total, Limit: f.Limit, Offset: f.Offset})
}

// POST /api/sales
func (h *Handler) CreateSale(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)

	var req CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	s, err := h.svc.CreateSale(c.Request.Context(), tenantID, &req)
	if err != nil {
		var valErr validationErr
		if errors.As(err, &valErr) {
			response.BadRequest(c, valErr.Error())
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusCreated, s)
}

// GET /api/sales/:id
func (h *Handler) GetSale(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	s, err := h.svc.GetSale(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, s)
}

// POST /api/sales/:id/complete
func (h *Handler) CompleteSale(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	s, err := h.svc.CompleteSale(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, s)
}

// POST /api/sales/:id/cancel
func (h *Handler) CancelSale(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	s, err := h.svc.CancelSale(c.Request.Context(), tenantID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.NotFound(c)
			return
		}
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, s)
}

// GET /api/commissions
func (h *Handler) ListCommissions(c *gin.Context) {
	tenantID := middleware.TenantIDFromGin(c)
	userRole := middleware.UserRoleFromGin(c)
	userID := middleware.UserIDFromGin(c)

	sellerID := c.Query("seller_id")
	if userRole == "seller" {
		sellerID = userID
	}

	list, err := h.svc.ListCommissions(c.Request.Context(), tenantID, sellerID)
	if err != nil {
		response.InternalError(c)
		return
	}
	response.JSON(c, http.StatusOK, list)
}

func queryInt(s string, fallback int) int {
	if v, err := strconv.Atoi(s); err == nil && v > 0 {
		return v
	}
	return fallback
}
