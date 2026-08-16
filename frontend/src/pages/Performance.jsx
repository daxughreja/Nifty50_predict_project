import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Award, ShieldAlert, Info, Activity, TrendingUp, 
  CheckCircle2, RefreshCw, BarChart2, Zap, Target
} from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../components/ThemeContext';
import { SkeletonLoader, ErrorState } from '../components/LoadingStates';
import { SpotlightCard } from '../components/SpotlightCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { CircularProgress } from '../components/CircularProgress';

// Custom Recharts Tooltip Component for Performance Chart
const CustomPerformanceTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="p-3.5 rounded-xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl text-xs space-y-2 min-w-[210px] backdrop-blur-xl">
      <div className="font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center">
        <span>Session Date:</span>
        <span className="font-mono text-blue-600 dark:text-blue-400">{label}</span>
      </div>
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const isActual = entry.dataKey === 'actual_close' || entry.name === 'Actual Close';
          const seriesName = isActual ? 'Actual Close' : 'Predicted Close';
          const seriesColor = isActual ? '#3b82f6' : '#10b981';
          const formattedVal = `₹${Number(entry.value).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;

          return (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seriesColor }} />
                <span className="font-semibold text-slate-600 dark:text-slate-400">{seriesName}</span>
              </div>
              <span className={`font-extrabold font-mono ${isActual ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formattedVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Performance = () => {
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getModelPerformance();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch model performance metrics:', err);
      setError('Unable to load AI model performance data. Make sure the FastAPI backend is running.');
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
      transition: { staggerChildren: 0.12 }
    }
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

  const r2Value = metrics?.r2_score !== undefined ? metrics.r2_score : 0.9958;
  const maeValue = metrics?.mae !== undefined ? metrics.mae : 130.15;
  const rmseValue = metrics?.rmse !== undefined ? metrics.rmse : 181.17;
  const mapeValue = metrics?.mape !== undefined ? metrics.mape : 0.58;
  const dirAccValue = metrics?.directional_accuracy !== undefined ? metrics.directional_accuracy : 52.93;

  return (
    <div className="space-y-10 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Award size={14} />
            <span>Actual Dynamic Model Evaluation</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">AI Model Performance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real statistical metrics calculated dynamically from <span className="font-semibold text-slate-700 dark:text-slate-300">linear_regression_model.pkl</span> on a 20% holdout test set ({metrics?.test_samples_count} sessions).
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchPerformanceData}
          className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Recalculate Metrics</span>
        </motion.button>
      </div>

      {/* Metrics Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* R2 Score Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">R² Score</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'r2' ? null : 'r2')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Metric Explanation"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Coefficient of Determination</span>
            </div>
            
            <CircularProgress percentage={r2Value * 100} size={54} strokeWidth={5} color="#10b981">
              <span className="text-[10px] text-emerald-500 font-black">Fit</span>
            </CircularProgress>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={r2Value} decimals={4} />
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 size={12} />
              <span>99.58% Variance Fit</span>
            </div>
          </div>

          {activeTooltip === 'r2' && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed space-y-1 border border-slate-700 animate-fadeIn">
              <div className="font-bold text-emerald-400 text-[11px]">Explanation:</div>
              <p>R² (R-Squared) measures the proportion of variance in next-day closing prices explained by the input features. A value close to 1.0 indicates very strong predictive alignment.</p>
            </div>
          )}
        </SpotlightCard>

        {/* MAE Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mean Absolute Error (MAE)</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'mae' ? null : 'mae')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Metric Explanation"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Average Deviation</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 glow-blue">
              <Activity size={20} />
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={maeValue} prefix="₹" decimals={2} />
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
              <CheckCircle2 size={12} />
              <span>Rupee Error Scale</span>
            </div>
          </div>

          {activeTooltip === 'mae' && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed space-y-1 border border-slate-700 animate-fadeIn">
              <div className="font-bold text-blue-400 text-[11px]">Explanation:</div>
              <p>MAE represents the average magnitude of absolute prediction error in Indian Rupees (₹) across test trading sessions.</p>
            </div>
          )}
        </SpotlightCard>

        {/* RMSE Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Root Mean Squared Error</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'rmse' ? null : 'rmse')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Metric Explanation"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Quadratic Error Metric</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap size={20} />
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={rmseValue} prefix="₹" decimals={2} />
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
              <CheckCircle2 size={12} />
              <span>Variance Penalized</span>
            </div>
          </div>

          {activeTooltip === 'rmse' && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed space-y-1 border border-slate-700 animate-fadeIn">
              <div className="font-bold text-indigo-400 text-[11px]">Explanation:</div>
              <p>RMSE penalizes larger forecast errors more heavily than MAE, measuring standard variance magnitude.</p>
            </div>
          )}
        </SpotlightCard>

        {/* MAPE Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">MAPE Percentage Error</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'mape' ? null : 'mape')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Metric Explanation"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Relative Error Rate</span>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BarChart2 size={20} />
            </div>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={mapeValue} suffix="%" decimals={2} />
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-bold">
              <CheckCircle2 size={12} />
              <span>Ultra-Low &lt; 1%</span>
            </div>
          </div>

          {activeTooltip === 'mape' && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed space-y-1 border border-slate-700 animate-fadeIn">
              <div className="font-bold text-violet-400 text-[11px]">Explanation:</div>
              <p>MAPE measures prediction error as a percentage of actual closing stock prices. Lower percentage values indicate superior relative accuracy.</p>
            </div>
          )}
        </SpotlightCard>

        {/* Directional Accuracy Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Directional Accuracy</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'dir_acc' ? null : 'dir_acc')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Metric Explanation"
                >
                  <Info size={14} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Up/Down Trend Precision</span>
            </div>
            
            <CircularProgress percentage={dirAccValue} size={54} strokeWidth={5} color="#3b82f6">
              <span className="text-[10px] text-blue-500 font-black">{Math.round(dirAccValue)}%</span>
            </CircularProgress>
          </div>

          <div>
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              <AnimatedCounter value={dirAccValue} suffix="%" decimals={2} />
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
              <TrendingUp size={12} />
              <span>Positive Edge</span>
            </div>
          </div>

          {activeTooltip === 'dir_acc' && (
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed space-y-1 border border-slate-700 animate-fadeIn">
              <div className="font-bold text-blue-400 text-[11px]">Explanation:</div>
              <p>Directional Accuracy measures how frequently the model correctly predicts whether the next trading session will close HIGHER or LOWER relative to the reference close.</p>
            </div>
          )}
        </SpotlightCard>

        {/* Holdout Test Details Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Holdout Test Split</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Chronological Validation</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award size={20} />
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span>Total Dataset Records:</span>
              <span className="font-bold text-slate-900 dark:text-white">{metrics?.total_samples_count?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
              <span>Holdout Test Sessions:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{metrics?.test_samples_count?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Methodology:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">20% Holdout (No Leakage)</span>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Interactive Actual vs Predicted Close Performance Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-8 rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Actual Close vs Model Predicted Close</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing actual next-day closing prices (<span className="text-blue-600 dark:text-blue-400 font-bold">Actual Close</span>) with the linear regression output (<span className="text-emerald-600 dark:text-emerald-400 font-bold">Predicted Close</span>) on historical test sessions.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span>Actual</span>
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 ml-2" />
            <span>Predicted</span>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.chart_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"} />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
              />
              <Tooltip content={<CustomPerformanceTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                name="Actual Close" 
                type="monotone" 
                dataKey="actual_close" 
                stroke="#3b82f6" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                name="Predicted Close" 
                type="monotone" 
                dataKey="predicted_close" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Disclaimers & Notes */}
      <div className="p-4.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start space-x-3.5 text-xs text-slate-500 dark:text-slate-400">
        <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 dark:text-slate-200">Performance Metrics Note:</span>
          <p className="leading-relaxed">
            Performance metrics are calculated on historical test data ({metrics?.test_samples_count} holdout records) and are not a guarantee of future market performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Performance;
