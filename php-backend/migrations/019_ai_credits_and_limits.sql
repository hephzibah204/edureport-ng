-- Migration 019: AI Credits, feature gating, and staff limits
-- Adds AI credits tracking to school_subscriptions
-- Stores feature flags per school

ALTER TABLE school_subscriptions ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER NOT NULL DEFAULT 0;
ALTER TABLE school_subscriptions ADD COLUMN IF NOT EXISTS ai_credits_total INTEGER NOT NULL DEFAULT 0;

-- Seed initial AI credits for existing schools
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
