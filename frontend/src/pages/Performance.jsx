import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';
import { 
  Award, ShieldAlert, Info, Activity, TrendingUp, 
  CheckCircle2, RefreshCw, Zap, Trophy, Flame, Layers
} from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../components/ThemeContext';
import { SkeletonLoader, ErrorState } from '../components/LoadingStates';
import { SpotlightCard } from '../components/SpotlightCard';
import { AnimatedCounter } from '../components/AnimatedCounter';

const BAR_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#6366f1', 
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', 
  '#eab308', '#ef4444'
];

export const Performance = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetric, setActiveMetric] = useState('r2');

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getModelPerformance();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch model performance metrics:', err);
      setError('Unable to load model performance metrics. Make sure backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader type="stats" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPerformanceData} />;
  }

  const modelList = data?.models || [];
  const bestModel = data?.best_model || (modelList.length > 0 ? modelList[0] : null);
  const evaluation = data?.evaluation || {};

  return (
    <div className="space-y-10 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy size={14} />
            <span>Multi-Model AI Benchmark</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Model Performance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare the predictive performance of all trained NIFTY50 regression models.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchPerformanceData}
          className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Recalculate Benchmark</span>
        </motion.button>
      </div>

      {/* BEST PERFORMING MODEL HERO CARD */}
      {bestModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 md:p-8 rounded-3xl glass-panel border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10 space-y-6"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl glow-green shrink-0 shadow-lg">
                <Trophy size={36} />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-1.5">
                  <Flame size={14} />
                  <span>#1 BEST PERFORMING MODEL</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{bestModel.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Top performing regression model evaluated on holdout test set.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-start md:self-auto">
              <div className="px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider">Top R² Score</div>
                <div className="text-xl font-black font-mono">{(bestModel.r2 * 100).toFixed(3)}%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 relative z-10">
            <div className="p-4 rounded-2xl glass-card space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">R² Score</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                <AnimatedCounter value={bestModel.r2} decimals={6} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Variance Fit</span>
            </div>

            <div className="p-4 rounded-2xl glass-card space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RMSE</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                <AnimatedCounter value={bestModel.rmse} prefix="₹" decimals={2} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Root Mean Squared Error</span>
            </div>

            <div className="p-4 rounded-2xl glass-card space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RSS</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {(bestModel.rss / 1e6).toFixed(2)}M
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Residual Sum of Squares</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* INTERACTIVE COMPARISON CHARTS SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-8 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Model Comparative Analysis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive visualization comparing all 10 trained regression models across key metrics.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveMetric('r2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'r2' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              R² Score
            </button>
            <button
              onClick={() => setActiveMetric('rmse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'rmse' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              RMSE (₹)
            </button>
            <button
              onClick={() => setActiveMetric('rss')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMetric === 'rss' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              RSS Scale
            </button>
          </div>
        </div>

        <div className="h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={modelList} 
              margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"} />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                interval={0}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', angle: -25, textAnchor: 'end' }}
              />
              <YAxis 
                domain={activeMetric === 'r2' ? [0, 1] : ['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                  fontSize: '12px'
                }}
                formatter={(val, name, item) => {
                  if (activeMetric === 'r2') return [Number(val).toFixed(6), 'R² Score'];
                  if (activeMetric === 'rmse') return [`₹${Number(val).toFixed(2)}`, 'RMSE'];
                  return [`${(Number(val) / 1e6).toFixed(2)}M`, 'RSS'];
                }}
              />
              <Bar 
                dataKey={activeMetric} 
                radius={[8, 8, 0, 0]}
              >
                {modelList.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* FULL MODEL COMPARISON TABLE */}
      <SpotlightCard className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Full Model Comparison Table</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete statistical breakdown for all 10 trained regression models.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-slate-800">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase select-none bg-slate-100/50 dark:bg-slate-900/50">
                <th className="py-4 px-4 text-center">Rank</th>
                <th className="py-4 px-4">Model Name</th>
                <th className="py-4 px-4 text-right">R² Score</th>
                <th className="py-4 px-4 text-right">R² %</th>
                <th className="py-4 px-4 text-right">RMSE (₹)</th>
                <th className="py-4 px-4 text-right">RSS</th>
                <th className="py-4 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {modelList.map((m) => {
                const isWinner = m.rank === 1;
                return (
                  <tr 
                    key={m.id} 
                    className={`transition ${
                      isWinner 
                        ? 'bg-emerald-500/10 font-semibold' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-black">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        m.rank === 1 ? 'bg-amber-500 text-white shadow-md' :
                        m.rank === 2 ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white' :
                        m.rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 dark:bg-slate-900 text-slate-500'
                      }`}>
                        #{m.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{m.name}</span>
                        {isWinner && <Trophy size={14} className="text-amber-500 shrink-0" />}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {m.r2.toFixed(6)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-500">
                      {(m.r2 * 100).toFixed(3)}%
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                      ₹{m.rmse.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      {m.rss > 1e8 ? `${(m.rss / 1e9).toFixed(2)}B` : `${(m.rss / 1e6).toFixed(2)}M`}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 size={10} />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* EVALUATION METHODOLOGY CARD */}
      <SpotlightCard className="p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
          <Info size={20} />
          <h4 className="font-bold text-base text-slate-900 dark:text-white">Evaluation Methodology</h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          All 10 regression models are evaluated under identical data conditions on <span className="font-semibold text-slate-800 dark:text-slate-200">new_data.csv</span> ({evaluation.total_samples || 4603} total trading records).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium pt-2">
          <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Data Split</span>
            <span className="font-bold text-slate-900 dark:text-white">80% Train / 20% Test</span>
            <span className="text-[10px] text-slate-400 block">random_state=42</span>
          </div>
          <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Test Samples</span>
            <span className="font-bold text-blue-500">{evaluation.test_samples || 921} Sessions</span>
            <span className="text-[10px] text-slate-400 block">Holdout evaluation</span>
          </div>
          <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Input Features</span>
            <span className="font-mono text-slate-900 dark:text-white">open, low, high, close</span>
            <span className="text-[10px] text-slate-400 block">Dynamic column order</span>
          </div>
          <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Variable</span>
            <span className="font-bold text-emerald-500">Tomorrow_Close</span>
            <span className="text-[10px] text-slate-400 block">Next-day closing price</span>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};

export default Performance;
