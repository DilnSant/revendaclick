-- Adiciona rastreamento de envio do e-mail de aviso de vencimento (7 dias antes do due_date),
-- evitando reenvio diário do mesmo lembrete para a mesma fatura.
-- Aplicado diretamente em produção (projeto ibgaywezfcbbiiziaoac) em 2026-07-31.

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_reminder
  ON public.billing_invoices (due_date, status)
  WHERE reminder_sent_at IS NULL;
