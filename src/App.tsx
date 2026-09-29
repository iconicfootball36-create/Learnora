/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { MainDashboard } from './components/MainDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 font-serif tracking-wide">Loading Learnora...</span>
        </div>
      </div>
    );
  }

  // Not signed in: show Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onSignIn={() => {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
          }}
        />
        {authModalOpen && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => setAuthModalOpen(false)}
          />
        )}
      </>
    );
  }

  // User is signed in but hasn't finished the 6-step personalized onboarding
  if (profile && !profile.onboardingCompleted) {
    return (
      <OnboardingWizard
        onComplete={() => {
          // Handled via profile state update in AuthContext
        }}
      />
    );
  }

  // User is signed in and onboarding is completed: show main dashboard
  return <MainDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
