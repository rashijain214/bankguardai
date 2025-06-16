/*
  # UGC Creator Platform Database Schema

  1. New Tables
    - `profiles` - User profiles for creators and brands
    - `creator_profiles` - Extended creator-specific data
    - `brand_profiles` - Extended brand-specific data
    - `campaigns` - Brand campaigns/deals
    - `applications` - Creator applications to campaigns
    - `messages` - Communication between users
    - `payments` - Payment tracking
    - `subscriptions` - Premium subscription management
    - `media_uploads` - File storage tracking
    - `niches` - Content categories/niches

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Role-based access control
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('creator', 'brand', 'admin');
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'enterprise');

-- Niches table
CREATE TABLE IF NOT EXISTS niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Main profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'creator',
  subscription_tier subscription_tier DEFAULT 'free',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creator profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  location text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  follower_count integer DEFAULT 0,
  engagement_rate decimal(5,2) DEFAULT 0.0,
  rate_per_post decimal(10,2),
  portfolio_urls text[],
  voice_sample_url text,
  niches text[] DEFAULT '{}',
  total_earnings decimal(10,2) DEFAULT 0.0,
  completed_campaigns integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 5.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Brand profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  website_url text,
  description text,
  logo_url text,
  verification_status text DEFAULT 'pending',
  total_campaigns integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  budget decimal(10,2) NOT NULL,
  deadline date NOT NULL,
  target_niches text[] DEFAULT '{}',
  platform_requirements text[] DEFAULT '{}',
  deliverables text[] DEFAULT '{}',
  status campaign_status DEFAULT 'active',
  applications_count integer DEFAULT 0,
  max_creators integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  pitch_message text,
  proposed_rate decimal(10,2),
  status application_status DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  media_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_method text,
  blockchain_tx_hash text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  revenue_cat_customer_id text,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Media uploads
CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  upload_purpose text,
  created_at timestamptz DEFAULT now()
);

-- Insert sample niches
INSERT INTO niches (name, description, icon) VALUES
  ('Fashion', 'Fashion, style, and beauty content', 'Shirt'),
  ('Technology', 'Tech reviews, gadgets, and innovation', 'Smartphone'),
  ('Food & Cooking', 'Recipe content, restaurant reviews, cooking tips', 'ChefHat'),
  ('Travel', 'Travel vlogs, destination guides, adventure content', 'MapPin'),
  ('Fitness', 'Workout routines, health tips, wellness content', 'Dumbbell'),
  ('Gaming', 'Game reviews, streaming, esports content', 'Gamepad2'),
  ('Lifestyle', 'Daily life, home decor, productivity tips', 'Home'),
  ('Business', 'Entrepreneurship, career advice, business tips', 'Briefcase'),
  ('Education', 'Tutorials, courses, educational content', 'GraduationCap'),
  ('Entertainment', 'Comedy, music, pop culture content', 'Music');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Creator profiles policies
CREATE POLICY "Anyone can read creator profiles" ON creator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can update own profile" ON creator_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Creators can insert own profile" ON creator_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Brand profiles policies
CREATE POLICY "Anyone can read brand profiles" ON brand_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Brands can update own profile" ON brand_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Brands can insert own profile" ON brand_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Anyone can read active campaigns" ON campaigns FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Brands can manage own campaigns" ON campaigns FOR ALL TO authenticated USING (auth.uid() = brand_id);

-- Applications policies
CREATE POLICY "Creators can read own applications" ON applications FOR SELECT TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Brands can read applications to their campaigns" ON applications FOR SELECT TO authenticated USING (
  auth.uid() IN (SELECT brand_id FROM campaigns WHERE id = campaign_id)
);
CREATE POLICY "Creators can create applications" ON applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Brands can update application status" ON applications FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT brand_id FROM campaigns WHERE id = campaign_id)
);

-- Messages policies
CREATE POLICY "Users can read their messages" ON messages FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Payments policies
CREATE POLICY "Users can read their payments" ON payments FOR SELECT TO authenticated USING (
  auth.uid() = creator_id OR auth.uid() = brand_id
);
CREATE POLICY "System can manage payments" ON payments FOR ALL TO authenticated USING (true);

-- Subscriptions policies
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Media uploads policies
CREATE POLICY "Users can read own uploads" ON media_uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upload files" ON media_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Niches policies
CREATE POLICY "Anyone can read niches" ON niches FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_applications_creator_id ON applications(creator_id);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_payments_creator_id ON payments(creator_id);
CREATE INDEX idx_payments_brand_id ON payments(brand_id);