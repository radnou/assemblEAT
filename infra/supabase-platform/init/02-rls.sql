-- =============================================
-- AssemblEat — Row Level Security Policies
-- =============================================
-- All tables use authenticated JWT for ownership checks.
-- practitioner_comments and practitioner_goals are restricted
-- to service_role only; API routes handle authorization logic.
-- =============================================

-- =============================================
-- profiles
-- =============================================
ALTER TABLE assembleat.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users see own profile"
    ON assembleat.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================
-- subscriptions
-- =============================================
ALTER TABLE assembleat.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: users see own subscriptions"
    ON assembleat.subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- week_plans
-- =============================================
ALTER TABLE assembleat.week_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "week_plans: users see own plans"
    ON assembleat.week_plans
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- meal_feedbacks
-- =============================================
ALTER TABLE assembleat.meal_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_feedbacks: users see own feedbacks"
    ON assembleat.meal_feedbacks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- shared_links
-- =============================================
ALTER TABLE assembleat.shared_links ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own links
CREATE POLICY "shared_links: owners manage own links"
    ON assembleat.shared_links
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Anyone can SELECT a shared link by token (for public share pages)
-- The application verifies token validity and expiry
CREATE POLICY "shared_links: public read by token"
    ON assembleat.shared_links
    FOR SELECT
    USING (true);

-- =============================================
-- monthly_summaries
-- =============================================
ALTER TABLE assembleat.monthly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_summaries: users see own summaries"
    ON assembleat.monthly_summaries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- practitioner_comments — service_role only
-- API routes validate practitioner–patient relationships
-- =============================================
ALTER TABLE assembleat.practitioner_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practitioner_comments: service_role only"
    ON assembleat.practitioner_comments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- practitioner_goals — service_role only
-- API routes validate practitioner–patient relationships
-- =============================================
ALTER TABLE assembleat.practitioner_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practitioner_goals: service_role only"
    ON assembleat.practitioner_goals
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
