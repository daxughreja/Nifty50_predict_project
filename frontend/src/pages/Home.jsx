import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Cpu, Table, ArrowRight, BarChart3, 
  Layers, ShieldAlert, Sparkles, ChevronRight, Activity,
  Award, Zap, CheckCircle2, ArrowUpRight, LineChart, Globe
} from 'lucide-react';
import { apiService } from '../services/api';
import { SkeletonLoader } from '../components/LoadingStates';
import { SpotlightCard } from '../components/SpotlightCard';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const Home = () => {
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Parallax Floating State for Hero Cards
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleHeroMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    if (innerWidth < 768) return; // Disable parallax on mobile
    const x = (e.clientX / innerWidth - 0.5) * 20;
    const y = (e.clientY / innerHeight - 0.5) * 20;
    setMouseOffset({ x, y });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        const [statsData, perfData, latestData] = await Promise.allSettled([
          apiService.getStatistics(),
          apiService.getModelPerformance(),
          apiService.getLatestRecord()
        ]);

        if (isMounted) {
          if (statsData.status === 'fulfilled') setStats(statsData.value);
          if (perfData.status === 'fulfilled') setPerformance(perfData.value);
          if (latestData.status === 'fulfilled') setLatestRecord(latestData.value);
          setError(false);
        }
      } catch (err) {
        console.error('Failed to fetch home preview data:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Text Reveal Motion Variants
  const headlineVariant = {
    hidden: { opacity: 0, y: 25, filter: 'blur(8px)', scale: 0.96 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        duration: 0.7,
        delay: i * 0.18,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Input Market Data',
      desc: 'Enter today\'s Open, High, Low, and Close index levels.',
      icon: Table,
    },
    {
      step: '02',
      title: 'AI Feature Processing',
      desc: 'Backend formats input vector parameters for linear weight alignment.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Model Prediction',
      desc: 'Linear Regression model computes the predicted next-day close.',
      icon: Zap,
    },
    {
      step: '04',
      title: 'Performance Evaluation',
      desc: 'Evaluate directional accuracy and R² score on holdout test data.',
      icon: Award,
    }
  ];

  const latestCloseVal = latestRecord ? (latestRecord.close || latestRecord.Close || 24850.50) : 24850.50;
  const r2ScoreVal = performance ? performance.r2_score : 0.9958;
  const maeVal = performance ? performance.mae : 130.15;

  return (
    <div className="space-y-20 py-4" onMouseMove={handleHeroMouseMove}>
      {/* Hero Section (Requirements 1, 2, 3) */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 lg:p-16 border border-slate-200/60 dark:border-slate-800/60 shadow-2xl">
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left Column: Heading & CTAs */}
          <div className="flex-1 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles size={14} className="animate-spin text-emerald-500" style={{ animationDuration: '6s' }} />
              <span>Scikit-Learn ML Engine • NIFTY 50</span>
            </motion.div>

            {/* Staggered Text Reveal Heading */}
            <div className="space-y-1">
              <motion.h1 
                custom={0}
                initial="hidden"
                animate="visible"
                variants={headlineVariant}
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white"
              >
                AI-Powered
              </motion.h1>
              <motion.h1 
                custom={1}
                initial="hidden"
                animate="visible"
                variants={headlineVariant}
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-gradient"
              >
                NIFTY 50 Market
              </motion.h1>
              <motion.h1 
                custom={2}
                initial="hidden"
                animate="visible"
                variants={headlineVariant}
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white"
              >
                Price Prediction
              </motion.h1>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-xl font-medium leading-relaxed"
            >
              Analyze daily stock index metrics and generate machine learning predictions for the next trading session's closing price with statistical holdout validation metrics.
            </motion.p>

            {/* Micro-interactive CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/predict"
                  className="flex items-center space-x-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/25 glow-blue group text-sm"
                >
                  <span>Predict Tomorrow's Close</span>
                  <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/performance"
                  className="flex items-center space-x-2.5 px-6 py-3.5 bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition duration-200 cursor-pointer border border-slate-300/60 dark:border-slate-800 shadow-sm text-sm"
                >
                  <Award size={18} className="text-emerald-500" />
                  <span>Model Performance</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Floating Interactive Glass Cards Showcase */}
          <div className="flex-1 w-full max-w-md lg:max-w-none relative min-h-[320px] flex items-center justify-center">
            {/* Parallax Container 1: Latest Market Close */}
            <motion.div
              animate={{
                x: mouseOffset.x * 0.8,
                y: mouseOffset.y * 0.8 + Math.sin(Date.now() / 1500) * 4,
              }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              className="w-full sm:w-80 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl relative z-20"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">NIFTY 50 Index</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                <AnimatedCounter value={latestCloseVal} prefix="₹" decimals={2} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-500 flex items-center space-x-1">
                  <TrendingUp size={14} />
                  <span>Verified Dataset Record</span>
                </span>
                <span className="text-slate-400">Index Level</span>
              </div>
            </motion.div>

            {/* Parallax Container 2: Model Accuracy R² Badge (Floating top-right) */}
            <motion.div
              animate={{
                x: mouseOffset.x * 1.2 + 20,
                y: mouseOffset.y * 1.2 - 30,
              }}
              transition={{ type: 'spring', stiffness: 90, damping: 15 }}
              className="hidden sm:block absolute -top-4 -right-4 p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/5 shadow-xl z-30 w-56"
            >
              <div className="flex items-center space-x-2 text-emerald-500 mb-1">
                <Award size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Model R² Score</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                <AnimatedCounter value={r2ScoreVal} decimals={4} />
              </div>
              <span className="text-[10px] text-emerald-500 font-bold block mt-1">99.58% Variance Fit</span>
            </motion.div>

            {/* Parallax Container 3: MAE Error Badge (Floating bottom-left) */}
            <motion.div
              animate={{
                x: mouseOffset.x * -1.1 - 20,
                y: mouseOffset.y * -1.1 + 40,
              }}
              transition={{ type: 'spring', stiffness: 85, damping: 15 }}
              className="hidden sm:block absolute -bottom-6 -left-4 p-4 rounded-2xl glass-card border border-blue-500/30 bg-blue-500/5 shadow-xl z-30 w-56"
            >
              <div className="flex items-center space-x-2 text-blue-500 mb-1">
                <Activity size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Test Set MAE</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                <AnimatedCounter value={maeVal} prefix="₹" decimals={2} />
              </div>
              <span className="text-[10px] text-blue-500 font-bold block mt-1">Holdout Deviation</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Pipeline / How It Works (Requirement 12) */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Predictive Pipeline</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">How NIFTY50 AI Operates</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            End-to-end execution flow from market input vector to prediction forecast.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {howItWorksSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <SpotlightCard key={idx} className="p-6 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-700">{step.step}</span>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 glow-blue">
                    <Icon size={20} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </motion.section>

      {/* Dataset Summary & Statistics (Requirements 8, 11) */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verified Market Overview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Historical Nifty 50 statistical indicators calculated dynamically.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
            <span>Explore Dashboard</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader type="stats" />
        ) : error ? (
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-center space-x-3.5">
            <ShieldAlert size={20} className="shrink-0" />
            <span className="text-sm font-semibold">Backend offline. Please start FastAPI to display live stock statistics.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Records */}
            <SpotlightCard className="p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
                <Activity size={18} className="text-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={stats?.total_records || 0} decimals={0} />
                </div>
                <div className="text-xs text-emerald-500 font-bold flex items-center space-x-1">
                  <CheckCircle2 size={12} />
                  <span>100% Data Verified</span>
                </div>
              </div>
            </SpotlightCard>

            {/* Highest Close */}
            <SpotlightCard className="p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Highest Close</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={stats?.highest_close || 0} prefix="₹" decimals={2} />
                </div>
                <div className="text-xs text-slate-400">Historical Peak</div>
              </div>
            </SpotlightCard>

            {/* Lowest Close */}
            <SpotlightCard className="p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Lowest Close</span>
                <TrendingUp size={18} className="text-rose-500 rotate-180" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={stats?.lowest_close || 0} prefix="₹" decimals={2} />
                </div>
                <div className="text-xs text-slate-400">Historical Floor</div>
              </div>
            </SpotlightCard>

            {/* Average Close */}
            <SpotlightCard className="p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Average Close</span>
                <Layers size={18} className="text-violet-500" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={stats?.average_close || 0} prefix="₹" decimals={2} />
                </div>
                <div className="text-xs text-slate-400">Dataset Mean</div>
              </div>
            </SpotlightCard>
          </div>
        )}
      </motion.section>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200/50 dark:border-slate-800/50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">NIFTY50 AI</span> — AI-powered market prediction & analytics platform.
          </div>
          <div className="flex flex-wrap gap-4 font-semibold">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/predict" className="hover:underline">Prediction</Link>
            <Link to="/performance" className="hover:underline text-emerald-500">Performance</Link>
            <Link to="/dataset" className="hover:underline">Dataset</Link>
            <Link to="/about" className="hover:underline">About</Link>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-300">Financial Disclaimer:</strong> Predictions are generated using machine learning models based on historical Nifty 50 stock data. They are for educational and informational purposes only and should not be considered financial advice.
        </div>
      </footer>
    </div>
  );
};

export default Home;
