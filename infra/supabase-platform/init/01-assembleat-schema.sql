-- =============================================
-- AssemblEat — Application Schema
-- =============================================
-- Multi-SaaS instance: all AssemblEat tables live in the
-- "assembleat" schema for clean isolation from other projects.
--
-- Add future micro-SaaS schemas here:
--   CREATE SCHEMA IF NOT EXISTS saas2;
-- =============================================

CREATE SCHEMA IF NOT EXISTS assembleat;

-- Allow PostgREST roles to use the schema
GRANT USAGE ON SCHEMA assembleat TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assembleat
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assembleat
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =============================================
-- profiles
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    full_name    TEXT,
    avatar_url   TEXT,
    role         TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'practitioner', 'admin')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    plan                 TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro')),
    status               TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    stripe_subscription_id TEXT,
    stripe_customer_id   TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON assembleat.subscriptions(user_id);

-- =============================================
-- week_plans
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.week_plans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    week_start   DATE NOT NULL,
    data         JSONB NOT NULL DEFAULT '{}',
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT week_plans_user_week_unique UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS week_plans_user_id_idx    ON assembleat.week_plans(user_id);
CREATE INDEX IF NOT EXISTS week_plans_week_start_idx ON assembleat.week_plans(week_start);
-- GIN index for efficient JSONB querying
CREATE INDEX IF NOT EXISTS week_plans_data_gin_idx   ON assembleat.week_plans USING GIN (data);

-- =============================================
-- meal_feedbacks
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.meal_feedbacks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    week_plan_id UUID NOT NULL REFERENCES assembleat.week_plans(id) ON DELETE CASCADE,
    meal_key     TEXT NOT NULL,            -- e.g. "monday_lunch"
    rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
    notes        TEXT,
    eaten        BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meal_feedbacks_user_id_idx     ON assembleat.meal_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS meal_feedbacks_week_plan_id_idx ON assembleat.meal_feedbacks(week_plan_id);

-- =============================================
-- shared_links
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.shared_links (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    week_plan_id UUID NOT NULL REFERENCES assembleat.week_plans(id) ON DELETE CASCADE,
    token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
    expires_at   TIMESTAMPTZ,
    view_count   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_links_user_id_idx ON assembleat.shared_links(user_id);
CREATE INDEX IF NOT EXISTS shared_links_token_idx   ON assembleat.shared_links(token);

-- =============================================
-- practitioner_comments
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.practitioner_comments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id  UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    patient_id       UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    week_plan_id     UUID REFERENCES assembleat.week_plans(id) ON DELETE SET NULL,
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practitioner_comments_practitioner_id_idx ON assembleat.practitioner_comments(practitioner_id);
CREATE INDEX IF NOT EXISTS practitioner_comments_patient_id_idx      ON assembleat.practitioner_comments(patient_id);

-- =============================================
-- practitioner_goals
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.practitioner_goals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practitioner_id  UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    patient_id       UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    target_date      DATE,
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused', 'canceled')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practitioner_goals_practitioner_id_idx ON assembleat.practitioner_goals(practitioner_id);
CREATE INDEX IF NOT EXISTS practitioner_goals_patient_id_idx      ON assembleat.practitioner_goals(patient_id);

-- =============================================
-- monthly_summaries
-- =============================================
CREATE TABLE IF NOT EXISTS assembleat.monthly_summaries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES assembleat.profiles(id) ON DELETE CASCADE,
    year         SMALLINT NOT NULL,
    month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    data         JSONB NOT NULL DEFAULT '{}',     -- aggregated stats
    ai_insights  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT monthly_summaries_user_year_month_unique UNIQUE (user_id, year, month)
);

CREATE INDEX IF NOT EXISTS monthly_summaries_user_id_idx ON assembleat.monthly_summaries(user_id);
