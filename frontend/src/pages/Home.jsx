import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Cpu, Table, ArrowRight, BarChart3, 
  Layers, ShieldAlert, Sparkles, ChevronRight, Activity 
} from 'lucide-react';
import { apiService } from '../services/api';
import { SkeletonLoader } from '../components/LoadingStates';

export const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("📍 [Home Page]: Component mounted. Triggering fetchPreviewStats()...");
    let isMounted = true;

    const fetchPreviewStats = async () => {
      try {
        const data = await apiService.getStatistics();
        console.log("✅ [Home Page]: Statistics preview data received:", data);
        if (isMounted) {
          setStats(data);
          setError(false);
        }
      } catch (err) {
        console.error('❌ [Home Page]: Failed to fetch stats preview for homepage:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) {
          console.log("🏁 [Home Page]: Clearing loading state.");
          setLoading(false);
        }
      }
    };

    fetchPreviewStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="flex-1 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles size={14} />
            <span>Nifty 50 Predictive Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
            Predict Next-Day <br />
            <span className="text-gradient">Stock Closings</span> <br />
            With AI Precision
          </h1>

          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
            Harness the power of machine learning to predict stock price trends. Our pre-trained linear regression model evaluates day-level features to guide your analytics.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/predict"
              className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/25 group"
            >
              <span>Start Prediction</span>
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dataset"
              className="flex items-center space-x-2 px-6 py-3.5 bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900/90 text-slate-850 dark:text-slate-200 font-bold rounded-2xl transition duration-200 cursor-pointer border border-slate-300/40 dark:border-slate-800/40"
            >
              <span>Explore Dataset</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="flex-1 w-full max-w-md lg:max-w-none grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 hover:-translate-y-1 transition duration-300">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Linear Regression</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">Uses optimized mathematical weights trained on multi-year historical Nifty 50 trends.</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 hover:-translate-y-1 transition duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Premium UI</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">Clean financial dashboard inspired by Zerodha Kite, TradingView, and Groww.</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 hover:-translate-y-1 transition duration-300">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <Table size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Dataset Explorer</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">Filter, search, sort, and export the entire stock dataset directly to CSV.</p>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/20 dark:border-slate-800 hover:-translate-y-1 transition duration-300">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Deep Analytics</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400">Interactive trends, area ranges, and volume breakdowns built on top-tier charts.</p>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Summary Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dataset Summary</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Direct indicators computed from your uploaded `new_data.csv` historical dataset.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center space-x-1 hover:underline">
            <span>View Full Dashboard</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader type="stats" />
        ) : error ? (
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-center space-x-3.5">
            <ShieldAlert size={20} className="shrink-0" />
            <span className="text-sm font-semibold">Backend offline. Please start FastAPI to display real historical stock stats.</span>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Records */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-550">
                <span className="text-sm font-semibold">Total Records</span>
                <Activity size={18} className="text-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {stats?.total_records?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-emerald-500 font-bold">100% Data Verified</div>
              </div>
            </motion.div>

            {/* Highest Close */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-550">
                <span className="text-sm font-semibold">Highest Close</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  ₹{stats?.highest_close?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Record High Price</div>
              </div>
            </motion.div>

            {/* Lowest Close */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-550">
                <span className="text-sm font-semibold">Lowest Close</span>
                <TrendingUp size={18} className="text-rose-500 rotate-180" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  ₹{stats?.lowest_close?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Record Floor Price</div>
              </div>
            </motion.div>

            {/* Average Close */}
            <motion.div variants={itemVariants} className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36">
              <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
                <span className="text-sm font-semibold">Average Close</span>
                <Layers size={18} className="text-violet-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  ₹{stats?.average_close?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Mean Value Across Years</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 dark:text-slate-500 gap-4">
        <div>
          Powered by React 19, Vite, Tailwind CSS, & FastAPI.
        </div>
        <div className="flex space-x-6">
          <Link to="/about" className="hover:underline">Documentation</Link>
          <Link to="/predict" className="hover:underline">Predictor Tool</Link>
          <Link to="/dataset" className="hover:underline font-semibold text-blue-500">Dataset File</Link>
        </div>
      </footer>
    </div>
  );
};
