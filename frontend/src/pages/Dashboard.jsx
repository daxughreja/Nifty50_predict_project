import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Activity, TrendingUp, TrendingDown, Landmark, Coins, 
  BrainCircuit, History, Share2, AlertCircle, RefreshCw,
  Award, Trophy, Layers
} from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../components/ThemeContext';
import { SkeletonLoader, ErrorState } from '../components/LoadingStates';
import { SpotlightCard } from '../components/SpotlightCard';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const Dashboard = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localHistoryCount, setLocalHistoryCount] = useState(0);
  const [latestPrediction, setLatestPrediction] = useState(null);

  // Load state and data from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        apiService.getStatistics(),
        apiService.getChartData(),
        apiService.getLatestRecord(),
        apiService.getModelPerformance()
      ]);
      
      const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const chartRes = results[1].status === 'fulfilled' ? results[1].value : [];
      const latestRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const perfRes = results[3].status === 'fulfilled' ? results[3].value : null;

      if (!statsRes && (!chartRes || chartRes.length === 0) && !latestRes) {
        setError('Unable to load dashboard data. Please check if backend service is running.');
      } else {
        if (statsRes) setStats(statsRes);
        if (chartRes) setChartData(chartRes);
        if (latestRes) setLatestRecord(latestRes);
        if (perfRes) setPerformanceData(perfRes);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please check if backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Load local storage prediction history metadata
    const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    setLocalHistoryCount(history.length);
    if (history.length > 0) {
      setLatestPrediction(history[history.length - 1]);
    }
  }, []);

  // Compute Simple Moving Average (SMA 5) on the fly for chart data
  const chartDataWithSma = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    return chartData.map((item, idx) => {
      if (idx >= 4) {
        const sum = chartData.slice(idx - 4, idx + 1).reduce((acc, curr) => acc + (curr.close || curr.Close || 0), 0);
        return {
          ...item,
          sma5: parseFloat((sum / 5).toFixed(2))
        };
      }
      return {
        ...item,
        sma5: null
      };
    });
  }, [chartData]);

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader type="stats" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  // Determine dynamic column casing
  const keys = chartData.length > 0 ? Object.keys(chartData[0]) : [];
  const getColKey = (stdName) => {
    const found = keys.find(k => k.toLowerCase() === stdName.toLowerCase());
    return found || stdName;
  };

  const closeKey = getColKey('close');
  const dateKey = getColKey('date');

  const bestModel = performanceData?.best_model;
  const topModels = performanceData?.models?.slice(0, 5) || [];

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nifty 50 Multi-Model AI Prediction Platform monitoring hub.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Records */}
        <SpotlightCard className="p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              <AnimatedCounter value={stats?.total_records || 4603} decimals={0} />
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Nifty 50 Trading History</div>
          </div>
        </SpotlightCard>

        {/* Latest Close */}
        <SpotlightCard className="p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Latest Close</span>
            <Landmark size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              <AnimatedCounter value={latestRecord ? Number(latestRecord[closeKey]) : 0} prefix="₹" decimals={2} />
            </div>
            <div className="text-[11px] text-emerald-500 font-bold mt-1">
              Date: {latestRecord ? latestRecord[dateKey] : 'N/A'}
            </div>
          </div>
        </SpotlightCard>

        {/* Available Models */}
        <SpotlightCard className="p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Available Models</span>
            <Layers size={18} className="text-violet-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              <AnimatedCounter value={stats?.active_models || 10} decimals={0} />
              <span className="text-sm text-slate-400 font-normal ml-1">/ 10</span>
            </div>
            <div className="text-[11px] text-violet-500 font-bold mt-1">Trained Regression Engines</div>
          </div>
        </SpotlightCard>

        {/* Best Model R2 */}
        <SpotlightCard className="p-6 flex flex-col justify-between h-40">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Best Model R²</span>
            <Trophy size={18} className="text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              <AnimatedCounter value={bestModel ? bestModel.r2 * 100 : 99.968} suffix="%" decimals={3} />
            </div>
            <div className="text-[11px] text-amber-500 font-bold mt-1 truncate">
              {bestModel ? bestModel.name : 'Lasso Regression'}
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Model Performance Overview & Latest Run Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Performance Overview Table */}
        <SpotlightCard className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="text-emerald-500" size={20} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model Performance Overview</h3>
            </div>
            <Link to="/performance" className="text-xs font-bold text-blue-500 hover:underline">
              View All 10 Models →
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-800">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase bg-slate-100/50 dark:bg-slate-900/50">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4 text-right">R² Score</th>
                  <th className="py-3 px-4 text-right">RMSE (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {topModels.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="py-3 px-4 font-bold text-xs">#{m.rank}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-xs">{m.name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-500 text-xs">
                      {(m.r2 * 100).toFixed(3)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-500 text-xs">
                      ₹{m.rmse.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>

        {/* Local History & Latest Run */}
        <div className="space-y-5">
          <SpotlightCard className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local Session Runs</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{localHistoryCount} predictions</div>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl glow-blue">
              <History size={20} />
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Run Forecast</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white text-emerald-500">
                {latestPrediction ? `₹${latestPrediction.prediction.toFixed(2)}` : 'No runs yet'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {latestPrediction ? (latestPrediction.model_name || latestPrediction.model) : 'Run prediction on Predictor page'}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl glow-green">
              <BrainCircuit size={20} />
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* Interactive Main Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-8 rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Historical Close Price Trend</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Displaying the last 100 days closing prices and 5-day SMA.</p>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataWithSma} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"} />
              <XAxis 
                dataKey={dateKey} 
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
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Area 
                name="Closing Price" 
                type="monotone" 
                dataKey={closeKey} 
                stroke="#3b82f6" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorClose)" 
              />
              <Area 
                name="SMA 5" 
                type="monotone" 
                dataKey="sma5" 
                stroke="#10b981" 
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
