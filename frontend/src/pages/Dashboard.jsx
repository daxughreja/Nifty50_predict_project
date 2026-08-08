import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Activity, TrendingUp, TrendingDown, Landmark, Coins, 
  BrainCircuit, History, Share2, AlertCircle, RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';
import { SkeletonLoader, ErrorState } from '../components/LoadingStates';
import { showToast } from '../layouts/RootLayout';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localHistoryCount, setLocalHistoryCount] = useState(0);
  const [latestPrediction, setLatestPrediction] = useState(null);

  // Load state and data from backend
  const fetchData = async () => {
    console.log("Dashboard: Executing fetchData()...");
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        apiService.getStatistics(),
        apiService.getChartData(),
        apiService.getLatestRecord()
      ]);
      
      const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const chartRes = results[1].status === 'fulfilled' ? results[1].value : [];
      const latestRes = results[2].status === 'fulfilled' ? results[2].value : null;

      console.log("Dashboard results:", { statsRes, chartResCount: chartRes?.length, latestRes });

      if (!statsRes && (!chartRes || chartRes.length === 0) && !latestRes) {
        setError('Unable to load dashboard data. Please check if backend service is running.');
      } else {
        if (statsRes) setStats(statsRes);
        if (chartRes) setChartData(chartRes);
        if (latestRes) setLatestRecord(latestRes);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data. Please check if backend service is running.');
    } finally {
      console.log("Dashboard: Clearing loading state.");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Dashboard Component Mounted.");
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

  // Determine dynamic column casing for high/low/close/volume
  const keys = chartData.length > 0 ? Object.keys(chartData[0]) : [];
  const getColKey = (stdName) => {
    const found = keys.find(k => k.toLowerCase() === stdName.toLowerCase());
    return found || stdName;
  };

  const closeKey = getColKey('close');
  const openKey = getColKey('open');
  const highKey = getColKey('high');
  const lowKey = getColKey('low');
  const volumeKey = getColKey('volume');
  const dateKey = getColKey('date');

  const hasVolume = keys.includes(volumeKey) && chartData.some(d => d[volumeKey] !== null && d[volumeKey] !== 0);

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current session tracking and historical overview.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300/40 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <RefreshCw size={14} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36 relative overflow-hidden border border-white/20 dark:border-slate-850">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats?.total_records?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Days of Trading History</div>
          </div>
        </div>

        {/* Latest Close */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36 relative overflow-hidden border border-white/20 dark:border-slate-850">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Latest Close</span>
            <Landmark size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              ₹{latestRecord ? Number(latestRecord[closeKey]).toFixed(2) : 'N/A'}
            </div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center space-x-1 mt-1">
              <span>Date: {latestRecord ? latestRecord[dateKey] : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Highest Close */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36 relative overflow-hidden border border-white/20 dark:border-slate-850">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Highest Close</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              ₹{stats?.highest_close ? Number(stats.highest_close).toFixed(2) : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Historical Max Point</div>
          </div>
        </div>

        {/* Lowest Close */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between h-36 relative overflow-hidden border border-white/20 dark:border-slate-850">
          <div className="flex justify-between items-center text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lowest Close</span>
            <TrendingDown size={18} className="text-rose-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              ₹{stats?.lowest_close ? Number(stats.lowest_close).toFixed(2) : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Historical Floor Price</div>
          </div>
        </div>
      </div>

      {/* Model Activity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local History Stats */}
        <div className="p-5 rounded-2xl glass-card flex items-center justify-between border border-white/20 dark:border-slate-850">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Local Predictions Count</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{localHistoryCount} runs</div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <History size={20} />
          </div>
        </div>

        {/* Latest Prediction */}
        <div className="p-5 rounded-2xl glass-card flex items-center justify-between border border-white/20 dark:border-slate-850">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Latest Run Prediction</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white text-gradient">
              {latestPrediction ? `₹${latestPrediction.prediction.toFixed(2)}` : 'No runs yet'}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <BrainCircuit size={20} />
          </div>
        </div>
      </div>

      {/* Interactive Main Chart */}
      <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
              <XAxis 
                dataKey={dateKey} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f8fafc'
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
      </div>

      {/* Conditionally Display Volume Trend Chart */}
      {hasVolume && (
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Daily Volume Trend</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Volume distribution over the last 100 records.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey={dateKey} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Area name="Volume" type="monotone" dataKey={volumeKey} stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Local Predictions Table snippet */}
      <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Recent Predictions History</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Last runs triggered locally on this browser.</p>
          </div>
          <Link 
            to="/predict" 
            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center space-x-1"
          >
            <span>Run New Prediction</span>
          </Link>
        </div>

        {localHistoryCount === 0 ? (
          <div className="py-8 text-center text-slate-450 dark:text-slate-500 text-sm font-medium">
            No predictions run yet in this session. Go to the Predictor tab to run one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Date/Time</th>
                  <th className="py-3 px-4">Inputs (O/H/L/C)</th>
                  <th className="py-3 px-4 text-right">Predicted tomorrow close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {JSON.parse(localStorage.getItem('prediction_history') || '[]')
                  .slice(-5)
                  .reverse()
                  .map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                        {item.date} {item.time}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-slate-400">
                        O: {item.inputs.open} | H: {item.inputs.high} | L: {item.inputs.low} | C: {item.inputs.close}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-500">
                        ₹{item.prediction.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
