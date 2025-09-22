-- SaaS User Management Schema Migration
-- This migration adds all necessary tables for multi-tenant SaaS functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles with subscription and preferences
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  query_count INTEGER DEFAULT 0,
  query_limit INTEGER DEFAULT 10,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{
    "theme": "dark",
    "defaultSources": ["trading-economics", "investing11"],
    "notificationSettings": {
      "emailAlerts": true,
      "queryLimitWarnings": true
    }
  }',
  custom_dashboards JSONB DEFAULT '[]'
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Detailed usage tracking for billing and analytics
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  query_type TEXT NOT NULL, -- 'llm', 'news', 'calendar', 'analysis'
  query_subtype TEXT, -- 'market-overview', 'interpret-event', 'earnings-analysis'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tokens_used INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 1,
  cost DECIMAL(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}' -- Store additional context like query params
);

-- Enable RLS on user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_usage
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_usage.user_id));

-- Usage summary table for quick quota checks
CREATE TABLE user_usage_summary (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_queries INTEGER DEFAULT 0,
  llm_queries INTEGER DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  period_end DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_usage_summary
ALTER TABLE user_usage_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_usage_summary
CREATE POLICY "Users can view own usage summary" ON user_usage_summary
  FOR SELECT USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_usage_summary.user_id));

-- Create trigger for user_usage_summary
CREATE TRIGGER update_user_usage_summary_updated_at 
    BEFORE UPDATE ON user_usage_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User session tracking for behavior analysis
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER DEFAULT 0, -- in seconds
  user_actions JSONB DEFAULT '[]',
  current_context JSONB DEFAULT '{
    "recentQueries": [],
    "favoriteSectors": [],
    "preferredSources": [],
    "searchHistory": [],
    "currentWorkflow": null,
    "lastViewedFeatures": [],
    "personalizationScore": 0
  }',
  device_info JSONB DEFAULT '{}',
  ip_address INET
);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_sessions.user_id));

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_sessions.user_id));

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_sessions.user_id));

-- User behavior analytics
CREATE TABLE user_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  feature_usage JSONB DEFAULT '{}', -- Count of feature usage
  query_patterns JSONB DEFAULT '{}', -- Analysis of query types
  session_count INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  most_used_features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_behavior_analytics
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_behavior_analytics
CREATE POLICY "Users can view own behavior analytics" ON user_behavior_analytics
  FOR SELECT USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_behavior_analytics.user_id));

-- User custom dashboards
CREATE TABLE user_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '{}',
  widgets JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_dashboards
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_dashboards
CREATE POLICY "Users can manage own dashboards" ON user_dashboards
  FOR ALL USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_dashboards.user_id));

-- Create trigger for user_dashboards
CREATE TRIGGER update_user_dashboards_updated_at 
    BEFORE UPDATE ON user_dashboards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User saved queries and analyses
CREATE TABLE user_saved_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_saved_queries
ALTER TABLE user_saved_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_saved_queries
CREATE POLICY "Users can manage own saved queries" ON user_saved_queries
  FOR ALL USING (auth.uid() = (SELECT auth.users.id FROM user_profiles WHERE user_profiles.id = user_saved_queries.user_id));

-- Helper Functions

-- Function to increment user query count
CREATE OR REPLACE FUNCTION increment_user_query_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles 
  SET query_count = query_count + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Function to check user quota
CREATE OR REPLACE FUNCTION check_user_quota(user_id UUID)
RETURNS TABLE (
  can_proceed BOOLEAN,
  remaining_queries INTEGER,
  current_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (up.query_count < up.query_limit) as can_proceed,
    GREATEST(0, up.query_limit - up.query_count) as remaining_queries,
    up.subscription_tier as current_tier
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$;

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_usage_summary 
  SET total_queries = 0,
      llm_queries = 0,
      period_start = CURRENT_DATE,
      period_end = CURRENT_DATE + INTERVAL '1 month',
      updated_at = NOW();
END;
$$;

-- Function to get user tier limits
CREATE OR REPLACE FUNCTION get_user_tier_limits(user_tier TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE user_tier
    WHEN 'free' THEN RETURN 10;
    WHEN 'pro' THEN RETURN 500;
    WHEN 'enterprise' THEN RETURN 999999; -- Unlimited
    ELSE RETURN 10;
  END CASE;
END;
$$;

-- Indexes for Performance

-- User profiles indexes
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Usage tracking indexes
CREATE INDEX idx_user_usage_user_id_timestamp ON user_usage(user_id, timestamp);
CREATE INDEX idx_user_usage_query_type ON user_usage(query_type);
CREATE INDEX idx_user_usage_timestamp ON user_usage(timestamp);

-- Session tracking indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_session_start ON user_sessions(session_start);

-- Behavior analytics indexes
CREATE INDEX idx_user_behavior_analytics_user_date ON user_behavior_analytics(user_id, date);

-- Dashboard indexes
CREATE INDEX idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX idx_user_dashboards_is_default ON user_dashboards(user_id, is_default);

-- Saved queries indexes
CREATE INDEX idx_user_saved_queries_user_id ON user_saved_queries(user_id, last_used);
CREATE INDEX idx_user_saved_queries_query_type ON user_saved_queries(query_type);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.user_usage_summary (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default data for existing users (if any)
-- This will be handled by the trigger for new users, but we might need to run this manually for existing users
-- INSERT INTO user_usage_summary (user_id) 
-- SELECT id FROM user_profiles 
-- WHERE id NOT IN (SELECT user_id FROM user_usage_summary);
