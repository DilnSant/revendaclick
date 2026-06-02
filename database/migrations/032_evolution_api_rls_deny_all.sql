-- Migration 032: Enable RLS (deny-all) on all Evolution API tables
--
-- Rationale: These tables belong to Evolution API v2 (Prisma schema).
-- Evolution API uses a direct PostgreSQL connection (postgres role) which
-- bypasses RLS entirely — no functional impact on Evolution API operation.
-- Enabling RLS with no policies blocks PostgREST access (anon/authenticated),
-- eliminating the Security Advisor alerts without affecting Evolution API.
--
-- Tables affected: 36 Evolution API tables (PascalCase, no tenant_id)
-- Tables NOT affected: all RevendaClick tables (snake_case, with tenant_id)

ALTER TABLE "Chat"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chatwoot"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dify"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DifySetting"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evoai"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EvoaiSetting"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EvolutionBot"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EvolutionBotSetting"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Flowise"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlowiseSetting"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Instance"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSession"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IsOnWhatsapp"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kafka"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Label"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageUpdate"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "N8n"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "N8nSetting"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Nats"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpenaiBot"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpenaiCreds"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpenaiSetting"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proxy"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pusher"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rabbitmq"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sqs"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Typebot"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TypebotSetting"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Webhook"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Websocket"            ENABLE ROW LEVEL SECURITY;
