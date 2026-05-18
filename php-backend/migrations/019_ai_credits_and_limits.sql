-- Migration 019: AI Credits, feature gating, and staff limits
-- Run manually if needed: mysql -u user -p dbname < 019_ai_credits_and_limits.sql

ALTER TABLE school_subscriptions
  ADD COLUMN ai_credits_remaining INT NOT NULL DEFAULT 0,
  ADD COLUMN ai_credits_total INT NOT NULL DEFAULT 0;

-- Seed initial AI credits for existing subscriptions
UPDATE school_subscriptions ss
  JOIN subscription_plans sp ON sp.id = ss.plan_id
  SET
    ss.ai_credits_remaining = CASE
      WHEN sp.slug = 'pro' THEN 2000
      WHEN sp.slug = 'lifetime' THEN 200
      ELSE 0
    END,
    ss.ai_credits_total = CASE
      WHEN sp.slug = 'pro' THEN 2000
      WHEN sp.slug = 'lifetime' THEN 200
      ELSE 0
    END
  WHERE ss.ai_credits_total = 0;
