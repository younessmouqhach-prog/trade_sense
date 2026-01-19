import React, { useState, useEffect } from 'react';
import Navbar from './src/components/Navbar';
import Hero from './src/components/Hero';
import AIIntegration from './src/components/AIIntegration';
import HowItWorks from './src/components/HowItWorks';
import Pricing from './src/components/Pricing';
import Features from './src/components/Features';
import DashboardPreview from './src/components/DashboardPreview';
import FAQ from './src/components/FAQ';
import Footer from './src/components/Footer';
import { TradingDashboard } from './src/components/TradingDashboard';
import { Market } from './src/components/Market';
import Leaderboard from './src/components/Leaderboard';
import NewsHub from './src/components/NewsHub';
import MasterClass from './src/components/MasterClass';
import { AuthProvider, useAuth } from './src/AuthContext';
import { AuthModal } from './src/AuthModal';
import { ProfileModal } from './src/ProfileModal';

const AppContent: React.FC = () => {
  // Check system preference or localStorage
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [route, setRoute] = useState<'home' | 'dashboard' | 'market' | 'leaderboard' | 'news' | 'masterclass'>('home');
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        onAuthClick={() => setAuthModalOpen(true)}
        onDashboardClick={() => setRoute('dashboard')}
        onMarketClick={() => setRoute('market')}
        onLeaderboardClick={() => setRoute('leaderboard')}
        onNewsClick={() => setRoute('news')}
        onMasterClassClick={() => setRoute('masterclass')}
        user={user}
        onLogout={logout}
        onProfileClick={() => setProfileModalOpen(true)}
        inDashboard={route === 'dashboard'}
        onCloseDashboard={() => setRoute('home')}
      />
      {route === 'home' ? (
        <>
          <main>
            <Hero onAuthClick={() => setAuthModalOpen(true)} user={user} />
            <AIIntegration />
            <HowItWorks />
            <Pricing user={user} onAuthClick={() => setAuthModalOpen(true)} />
            <DashboardPreview />
            <Features />
            <FAQ />
          </main>
          <Footer />
        </>
      ) : route === 'dashboard' ? (
        <main>
          <TradingDashboard
            onClose={() => setRoute('home')}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </main>
      ) : route === 'market' ? (
        <main>
          <Market
            onClose={() => setRoute('home')}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </main>
      ) : route === 'leaderboard' ? (
        <main>
          <Leaderboard />
        </main>
      ) : route === 'news' ? (
        <main>
          <NewsHub />
        </main>
      ) : (
        <main>
          <MasterClass />
        </main>
      )}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
