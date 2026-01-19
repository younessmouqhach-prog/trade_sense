import React, { useState, useEffect } from 'react';
import { Menu, X, BarChart3, Sun, Moon, Globe, ChevronDown, User, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserType } from '../api';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  onAuthClick: () => void;
  onDashboardClick: () => void;
  onMarketClick?: () => void;
  onLeaderboardClick?: () => void;
  onNewsClick?: () => void;
  onMasterClassClick?: () => void;
  user: UserType | null;
  onLogout: () => void;
  onProfileClick?: () => void;
  inDashboard?: boolean;
  onCloseDashboard?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme, onAuthClick, onDashboardClick, onMarketClick, onLeaderboardClick, onNewsClick, onMasterClassClick, user, onLogout, onProfileClick, inDashboard, onCloseDashboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('EN');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const full = user?.full_name || '';
  const parts = full.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const initials = ((parts[0] || '').charAt(0) + (parts[1] || '').charAt(0)).toUpperCase();

  return (
    <nav 
      className={`fixed w-full z-[60] ${scrolled ? 'glass-panel border-b border-slate-200 dark:border-white/5 py-4 shadow-sm scrolled transition-all duration-300' : 'navbar-top py-6'}`} 
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <button
            onClick={() => {
              if (inDashboard) { onCloseDashboard && onCloseDashboard(); }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20"
              style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
            >
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span
              className="text-xl font-bold tracking-tight text-transparent bg-clip-text"
              style={{
                background: 'linear-gradient(to right, #06b6d4, #10b981)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              TradeSense
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.label} 
                href={item.href} 
                className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center space-x-1 text-slate-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-24 glass-panel rounded-lg shadow-xl overflow-hidden py-1 border border-slate-200 dark:border-white/10"
                  >
                    {['EN', 'FR', 'AR'].map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        {l}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* CTA */}
            {user ? (
              <div className="flex items-center space-x-3">
                {inDashboard ? (
                  <button
                    onClick={() => { onCloseDashboard && onCloseDashboard(); }}
                    className="flex items-center space-x-2 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 border border-transparent dark:border-white/10 text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                    <span>Close Dashboard</span>
                  </button>
                ) : (
                  <button
                    onClick={onDashboardClick}
                    className="text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                  >
                    Dashboard
                  </button>
                )}
                <button
                  onClick={() => onMarketClick && onMarketClick()}
                  className="text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                >
                  Market
                </button>
                <button
                  onClick={() => onLeaderboardClick && onLeaderboardClick()}
                  className="text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }}
                >
                  🏆 Leaderboard
                </button>
                <button
                  onClick={() => onNewsClick && onNewsClick()}
                  className="text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #1d4ed8)' }}
                >
                  📰 News
                </button>
                <button
                  onClick={() => onMasterClassClick && onMasterClassClick()}
                  className="text-white px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}
                >
                  🎓 MasterClass
                </button>
                <button
                  onClick={() => onProfileClick && onProfileClick()}
                  className="group flex items-center space-x-2 cursor-pointer bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-2 hover:border-cyan-400/40 hover:bg-white/70 dark:hover:bg-white/10"
                >
                  <div
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                  >
                    {initials || 'U'}
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-slate-700 dark:text-gray-300">
                    <span className="font-semibold">{firstName}</span>
                    <span>{lastName}</span>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 text-white px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 shadow-md hover:opacity-90"
                style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-900 dark:text-gray-300 hover:text-cyan-500"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-panel border-b border-slate-200 dark:border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 flex items-center justify-between px-3">
                 <span className="text-sm text-slate-500 dark:text-gray-400">Language</span>
                 <div className="flex space-x-2">
                   {['EN', 'FR', 'AR'].map(l => (
                     <button key={l} onClick={() => setLang(l)} className={`text-xs p-1 rounded ${lang === l ? 'bg-cyan-500 text-white' : 'text-gray-500'}`}>{l}</button>
                   ))}
                 </div>
              </div>
               {user ? (
                 <div className="w-full mt-4 space-y-2">
                  {inDashboard ? (
                    <button
                      onClick={() => { setIsOpen(false); onCloseDashboard && onCloseDashboard(); }}
                      className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Close Dashboard</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setIsOpen(false); onDashboardClick(); }}
                      className="w-full text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                      style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                    >
                      Trading Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { setIsOpen(false); onMarketClick && onMarketClick(); }}
                    className="w-full text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                    style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); onLeaderboardClick && onLeaderboardClick(); }}
                    className="w-full text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                    style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }}
                  >
                    🏆 Leaderboard
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); onNewsClick && onNewsClick(); }}
                    className="w-full text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                    style={{ background: 'linear-gradient(to right, #3b82f6, #1d4ed8)' }}
                  >
                    📰 News Hub
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); onMasterClassClick && onMasterClassClick(); }}
                    className="w-full text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg mb-2"
                    style={{ background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}
                  >
                    🎓 MasterClass
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); onProfileClick && onProfileClick(); }}
                    className="w-full flex items-center justify-center space-x-2 cursor-pointer bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-3 hover:border-cyan-400/40 hover:bg-white/70 dark:hover:bg-white/10"
                  >
                    <div
                      className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                      style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                    >
                      {initials || 'U'}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-slate-700 dark:text-gray-300">
                      <span className="font-semibold">{firstName}</span>
                      <span>{lastName}</span>
                    </div>
                  </button>
                   <button
                     onClick={() => { setIsOpen(false); onLogout(); }}
                     className="w-full flex items-center justify-center space-x-2 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                     style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                   >
                     <LogOut className="w-4 h-4" />
                     <span>Logout</span>
                   </button>
                 </div>
               ) : (
                 <button
                   onClick={() => { setIsOpen(false); onAuthClick(); }}
                   className="w-full mt-4 text-white px-5 py-3 rounded-lg text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                   style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                 >
                   Sign In
                 </button>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
