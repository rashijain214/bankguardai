import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Header } from './components/layout/Header';
import { LandingPage } from './components/landing/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import { CreatorDashboard } from './components/dashboard/CreatorDashboard';
import { BrandDashboard } from './components/dashboard/BrandDashboard';
import { CampaignMarketplace } from './components/campaigns/CampaignMarketplace';
import { MessageCenter } from './components/messaging/MessageCenter';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth/signin" />;
};

const DashboardRoute: React.FC = () => {
  const { profile } = useAuthStore();
  
  if (!profile) return <Navigate to="/auth/signin" />;
  
  return profile.role === 'creator' ? <CreatorDashboard /> : <BrandDashboard />;
};

function App() {
  const { loading } = useAuthStore();

  React.useEffect(() => {
    // Initialize auth state
    useAuthStore.getState().fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CollabConnect...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/signin" element={<AuthForm type="signin" />} />
            <Route path="/auth/signup" element={<AuthForm type="signup" />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRoute />
              </ProtectedRoute>
            } />
            
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <CampaignMarketplace />
              </ProtectedRoute>
            } />
            
            <Route path="/messages" element={
              <ProtectedRoute>
                <MessageCenter />
              </ProtectedRoute>
            } />
            
            {/* Placeholder routes for other pages */}
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Portfolio - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/earnings" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Earnings - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/my-campaigns" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">My Campaigns - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/creators" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Creators - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Analytics - Coming Soon</h1>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;