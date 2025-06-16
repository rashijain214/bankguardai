import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'creator' | 'brand' | 'admin';
  subscription_tier: 'free' | 'premium' | 'enterprise';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  bio?: string;
  location?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  follower_count: number;
  engagement_rate: number;
  rate_per_post?: number;
  portfolio_urls: string[];
  voice_sample_url?: string;
  niches: string[];
  total_earnings: number;
  completed_campaigns: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface BrandProfile {
  id: string;
  company_name: string;
  industry?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  verification_status: string;
  total_campaigns: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  requirements: string;
  budget: number;
  deadline: string;
  target_niches: string[];
  platform_requirements: string[];
  deliverables: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  applications_count: number;
  max_creators: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch_message?: string;
  proposed_rate?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  submitted_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  campaign_id?: string;
  content: string;
  message_type: string;
  media_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Niche {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}