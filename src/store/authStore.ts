import { create } from 'zustand';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'creator' | 'brand') => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      set({ user: data.user });
      await get().fetchProfile();
    }
  },

  signUp: async (email: string, password: string, fullName: string, role: 'creator' | 'brand') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        });
      
      if (profileError) throw profileError;
      
      // Create role-specific profile
      if (role === 'creator') {
        await supabase
          .from('creator_profiles')
          .insert({
            id: data.user.id,
          });
      } else if (role === 'brand') {
        await supabase
          .from('brand_profiles')
          .insert({
            id: data.user.id,
            company_name: fullName,
          });
      }
      
      set({ user: data.user });
      await get().fetchProfile();
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      set({ user, profile, loading: false });
    } else {
      set({ user: null, profile: null, loading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    set({ profile: data });
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    useAuthStore.getState().fetchProfile();
  } else {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  }
});