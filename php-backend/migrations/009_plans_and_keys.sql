-- 009_plans_and_keys.sql

ALTER TABLE school_subscriptions MODIFY COLUMN billing_cycle ENUM('MONTHLY','ANNUAL','LIFETIME') NOT NULL DEFAULT 'MONTHLY';

UPDATE subscription_plans SET name='Pro + AI' WHERE slug='pro';

-- We will update configs manually in App.php or recreate plans if they are messed up, but let's just do a JSON_SET
UPDATE subscription_plan_versions SET config = JSON_SET(config, '$.billing.annualKobo', 1500000) WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug='starter');
UPDATE subscription_plan_versions SET config = JSON_SET(config, '$.billing.lifetimeKobo', 2500000) WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug='lifetime');
UPDATE subscription_plan_versions SET config = JSON_SET(config, '$.billing.lifetimeKobo', 3500000) WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug='pro');

UPDATE subscription_plan_versions SET config = JSON_SET(config, '$.trialDays', 7) WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug='trial');
