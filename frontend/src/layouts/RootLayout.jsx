import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Sun, Moon, Home, LayoutDashboard, 
  LineChart, Database, Cpu, Compass, Info, Award,
  ArrowUp, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { apiService } from '../services/api';
import { BackgroundCanvas } from '../components/BackgroundCanvas';
import { pageTransition } from '../utils/animationVariants';

// Global toast trigger
let addToastTrigger = () => {};

export const showToast = (message, type = 'info') => {
  addToastTrigger(message, type);
};

export const RootLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [apiOnline, setApiOnline] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Primary Sidebar Navigation Config
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Predictor', path: '/predict', icon: Cpu },
    { name: 'Performance', path: '/performance', icon: Award },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Dataset', path: '/dataset', icon: Database },
    { name: 'About', path: '/about', icon: Info },
  ];

  useEffect(() => {
    addToastTrigger = (message, type) => {
      const id = Date.now() + Math.random().toString(36).substr(2, 5);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const checkHealth = async () => {
      try {
        const data = await apiService.getHealth();
        if (isMounted) {
          const isOnline = data && data.status === 'online';
          setApiOnline(isOnline);
          timerId = setTimeout(checkHealth, isOnline ? 10000 : 2000);
        }
      } catch (err) {
        if (isMounted) {
          setApiOnline(false);
          timerId = setTimeout(checkHealth, 2000);
        }
      }
    };
    
    checkHealth();
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return ['Nifty 50 AI', 'Home'];
    const item = navItems.find(i => i.path === path);
    return ['Nifty 50 AI', item ? item.name : 'Page View'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen gradient-bg text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300 relative">
      {/* Ambient Glowing Background Canvas */}
      <BackgroundCanvas />

      <div className="flex flex-1 z-10">
        {/* Desktop Sidebar (Restored Layout) */}
        <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/50 h-screen sticky top-0 shadow-xl">
          {/* Brand Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 flex items-center space-x-3 border-b border-slate-200/40 dark:border-slate-800/40"
          >
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-emerald-500 text-white rounded-xl shadow-md glow-blue">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight tracking-wide text-slate-900 dark:text-white">
                NIFTY50 <span className="text-emerald-500">AI</span>
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-widest uppercase">Fintech Engine</span>
            </div>
          </motion.div>

          {/* Navigation Items with Framer Motion Active Pill */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-white font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className="relative z-10" />
                  <span className="relative z-10">{item.name}</span>

                  {/* Sliding Active Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/25 glow-blue"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Connection Status Indicator & Sidebar Footer */}
          <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">FastAPI API</span>
              <div className="flex items-center space-x-1.5">
                {apiOnline === null ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                  </span>
                ) : apiOnline ? (
                  <>
                    <Wifi size={12} className="text-emerald-500 animate-pulse" />
                    <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-red-500" />
                    <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">Offline</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Nifty50 AI. Production Ready.
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top Header */}
          <header className={`sticky top-0 z-30 transition-all duration-300 px-6 ${
            isScrolled 
              ? 'py-3 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl' 
              : 'py-5 bg-transparent border-b border-slate-200/30 dark:border-slate-800/30 backdrop-blur-md'
          } flex items-center justify-between`}>
            <div className="flex items-center space-x-4">
              {/* Mobile Drawer Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Breadcrumbs for desktop */}
              <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>{breadcrumbs[0]}</span>
                <span>/</span>
                <span className="text-blue-600 dark:text-emerald-400 font-bold">{breadcrumbs[1]}</span>
              </div>
              <div className="sm:hidden font-extrabold text-md text-slate-900 dark:text-white">
                NIFTY50 <span className="text-emerald-500">AI</span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3.5">
              {/* Mobile API Online Indicator */}
              <div className="lg:hidden flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] font-semibold">
                {apiOnline ? (
                  <>
                    <Wifi size={10} className="text-emerald-500" />
                    <span className="text-emerald-500">API</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={10} className="text-red-500" />
                    <span className="text-red-500">API</span>
                  </>
                )}
              </div>

              {/* Theme Toggle Button with Rotate / Scale Animation */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer border border-slate-200/60 dark:border-slate-800 shadow-sm"
                title="Toggle Light / Dark Theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: -10, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 10, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? (
                      <Sun size={18} className="text-amber-400" />
                    ) : (
                      <Moon size={18} className="text-indigo-600" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
              <aside className="relative flex flex-col w-64 max-w-xs bg-slate-50 dark:bg-slate-950 h-full p-6 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center space-x-3">
                    <Compass className="text-blue-500" size={24} />
                    <span className="font-extrabold text-lg">NIFTY50 <span className="text-emerald-500">AI</span></span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-900/50 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex-1 py-6 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                <div className="text-[10px] text-center text-slate-400 dark:text-slate-600 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  © {new Date().getFullYear()} Nifty50 AI. All rights reserved.
                </div>
              </aside>
            </div>
          )}

          {/* Main Layout Viewport */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageTransition}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl cursor-pointer transition-all duration-300 z-40 glow-blue"
          title="Scroll to Top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}

      {/* Toast Notification Stack */}
      <div className="fixed bottom-6 left-6 flex flex-col space-y-2.5 max-w-md w-full z-50 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl border flex items-start space-x-3 shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-auto max-w-sm ${
              t.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : t.type === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-800 dark:text-red-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-800 dark:text-blue-300'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={18} />}
            {t.type === 'error' && <XCircle className="text-red-500 mt-0.5 shrink-0" size={18} />}
            {t.type === 'info' && <AlertCircle className="text-blue-500 mt-0.5 shrink-0" size={18} />}
            <div className="text-sm font-semibold leading-normal">{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RootLayout;
