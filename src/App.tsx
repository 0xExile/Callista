import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Layout, MessageSquare, Menu, X, User, Home as HomeIcon, Gem, LogIn, LogOut } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Home } from './pages/Home';
import { CallistaAIPage } from './pages/CallistaAIPage';
import { StudySpacePage } from './pages/StudySpacePage';
import { InteractiveHubPage } from './pages/InteractiveHubPage';
import { AccountPage } from './pages/AccountPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { SupportPage } from './pages/SupportPage';
import { ContactPage } from './pages/ContactPage';
import { ReviewPage } from './pages/ReviewPage';
import { AllReviewsPage } from './pages/AllReviewsPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ScrollToTop } from './components/ScrollToTop';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { useGems } from './contexts/GemsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cn } from './lib/utils';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { gems, user, loading } = useGems();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/' },
    { id: 'ai', label: 'Callista AI', icon: MessageSquare, path: '/ai' },
    { id: 'study', label: 'Study Space', icon: Layout, path: '/study' },
    { id: 'hub', label: 'Interactive Hub', icon: Brain, path: '/hub' },
    { id: 'account', label: 'My Account', icon: User, path: '/account' },
  ];

  const Logo = () => (
    <Link to="/" className="flex items-center gap-4 group cursor-pointer">
      <div className="relative flex items-center">
        <div className="flex flex-col -space-y-2">
          <Star4 className="w-4 h-4 text-beige-400 mb-1 ml-2" />
          <Star4 className="w-10 h-10 text-beige-500" />
        </div>
        <h1 className="text-4xl font-serif tracking-[0.1em] text-beige-800 sheen-text ml-4 uppercase">
          Callista
        </h1>
      </div>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/20 backdrop-blur-md border-b border-beige-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-24 items-center">
          <Logo />

          {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm tracking-wide",
                  location.pathname === item.path 
                    ? "bg-beige-800 text-white shadow-lg shadow-beige-900/20" 
                    : "text-beige-600 hover:text-beige-800 hover:bg-beige-100/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            <div className="ml-4 px-4 py-2 bg-beige-100 rounded-xl flex items-center gap-2 text-beige-800 font-bold text-sm">
              <Gem className="w-4 h-4 text-beige-500" />
              {gems}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-beige-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-beige-50 border-t border-beige-200 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-left",
                    location.pathname === item.path 
                      ? "bg-beige-800 text-white" 
                      : "text-beige-600"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              
              {user ? (
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-left text-beige-600"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <div className="px-4 py-2 text-xs font-bold text-beige-400 uppercase tracking-widest text-center">
                  Sign in via Account page
                </div>
              )}

              <div className="px-4 py-4 bg-beige-100 rounded-xl flex items-center gap-2 text-beige-800 font-bold">
                <Gem className="w-5 h-5 text-beige-500" />
                {gems} Gems
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function App() {
  const { user, loading, recordActivity } = useGems();

  useEffect(() => {
    recordActivity();
  }, [user]);

  return (
    <div className="min-h-screen soft-bg-gradient font-sans text-beige-900 selection:bg-beige-200 selection:text-beige-900">
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading" />}
      </AnimatePresence>
      <ScrollToTop />

      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai" element={<CallistaAIPage />} />
            <Route path="/study" element={<StudySpacePage />} />
            <Route path="/hub" element={<InteractiveHubPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/reviews" element={<ReviewPage />} />
            <Route path="/all-reviews" element={<AllReviewsPage />} />
            <Route path="/refund" element={<RefundPolicyPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-beige-200 py-16 px-4 bg-beige-100/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="relative flex items-center">
              <div className="flex flex-col -space-y-2">
                <Star4 className="w-4 h-4 text-beige-400 mb-1 ml-2" />
                <Star4 className="w-10 h-10 text-beige-500" />
              </div>
              <h1 className="text-4xl font-serif tracking-[0.1em] text-beige-800 sheen-text ml-4 uppercase">
                Callista
              </h1>
            </div>
          </Link>
          <div className="flex gap-10 text-sm text-beige-500 font-bold uppercase tracking-widest">
            <Link to="/privacy" className="hover:text-beige-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-beige-900 transition-colors">Terms</Link>
            <Link to="/support" className="hover:text-beige-900 transition-colors">Support</Link>
            <Link to="/contact" className="hover:text-beige-900 transition-colors">Contact</Link>
            <Link to="/reviews" className="hover:text-beige-900 transition-colors">Reviews</Link>
            <Link to="/refund" className="hover:text-beige-900 transition-colors">Refund</Link>
          </div>
          <p className="text-xs text-beige-400 font-medium">
            © 2026 Callista Learning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
