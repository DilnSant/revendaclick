-- =============================================================================
-- RevendaClick — Development Seed Data
-- Run AFTER schema.sql
-- =============================================================================

-- NOTE: Disable triggers temporarily to insert seed data freely
SET session_replication_role = 'replica';

-- =============================================================================
-- TENANTS
-- =============================================================================

INSERT INTO tenants (id, slug, name, email, phone_whatsapp, description, theme) VALUES
    ('11111111-0000-0000-0000-000000000001',
     'autoshow-sp',
     'AutoShow SP',
     'contato@autoshow-sp.com',
     '5511999990001',
     'Os melhores seminovos de São Paulo.',
     '{"primary_color": "#E53935", "font": "inter"}'),

    ('11111111-0000-0000-0000-000000000002',
     'carros-bh',
     'Carros BH',
     'contato@carrosbh.com',
     '5531999990002',
     'Revenda premium em Belo Horizonte.',
     '{"primary_color": "#1565C0", "font": "inter"}');

-- =============================================================================
-- SUBSCRIPTIONS (skip triggers — seed manually)
-- =============================================================================

INSERT INTO subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end, trial_ends_at)
SELECT
    '11111111-0000-0000-0000-000000000001',
    id, 'active', 'monthly', NOW(), NOW() + INTERVAL '30 days', NULL
FROM plans WHERE name = 'pro';

INSERT INTO subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end, trial_ends_at)
SELECT
    '11111111-0000-0000-0000-000000000002',
    id, 'trialing', 'monthly', NOW(), NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days'
FROM plans WHERE name = 'starter';

-- =============================================================================
-- VEHICLES (AutoShow SP)
-- =============================================================================

INSERT INTO vehicles (
    tenant_id, title, brand, model, version,
    year_model, year_manufacture, color, mileage,
    fuel, transmission, doors, price, price_negotiable,
    status, condition, slug, description,
    images, thumbnail_url
) VALUES
    (
        '11111111-0000-0000-0000-000000000001',
        'Honda Civic EXL 2.0 2022',
        'Honda', 'Civic', 'EXL 2.0',
        2022, 2022, 'Branco Perolado', 18500,
        'flex', 'automatic', 4, 129900.00, TRUE,
        'available', 'used',
        'honda-civic-exl-2022',
        'Civic em excelente estado, único dono, revisões em dia na concessionária.',
        ARRAY['https://placeholder.com/civic1.jpg', 'https://placeholder.com/civic2.jpg'],
        'https://placeholder.com/civic1.jpg'
    ),
    (
        '11111111-0000-0000-0000-000000000001',
        'Toyota Corolla XEI 2.0 2021',
        'Toyota', 'Corolla', 'XEI 2.0',
        2021, 2021, 'Prata', 32000,
        'flex', 'automatic', 4, 118500.00, TRUE,
        'available', 'used',
        'toyota-corolla-xei-2021',
        'Corolla XEI completo, sem detalhes.',
        ARRAY['https://placeholder.com/corolla1.jpg'],
        'https://placeholder.com/corolla1.jpg'
    ),
    (
        '11111111-0000-0000-0000-000000000001',
        'Volkswagen T-Cross Highline 1.4 TSI 2023',
        'Volkswagen', 'T-Cross', 'Highline 1.4 TSI',
        2023, 2023, 'Cinza', 8200,
        'flex', 'automatic', 4, 149800.00, FALSE,
        'available', 'used',
        'vw-tcross-highline-2023',
        'SUV compacto com todos os opcionais de fábrica.',
        ARRAY['https://placeholder.com/tcross1.jpg'],
        'https://placeholder.com/tcross1.jpg'
    );

-- =============================================================================
-- ONBOARDING CHECKLISTS
-- =============================================================================

INSERT INTO onboarding_checklists (tenant_id, added_vehicle, configured_whatsapp, published_store, added_seller)
VALUES
    ('11111111-0000-0000-0000-000000000001', TRUE, TRUE, TRUE, FALSE),
    ('11111111-0000-0000-0000-000000000002', FALSE, FALSE, FALSE, FALSE);

-- Re-enable triggers
SET session_replication_role = 'DEFAULT';
