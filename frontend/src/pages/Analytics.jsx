import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  LineChart as ChartIcon, BarChart3, TrendingUp, 
  Layers, Sliders, RefreshCw 
} from 'lucide-react';
import { apiService } from '../services/api';
import { useTheme } from '../components/ThemeContext';
import { SkeletonLoader, ErrorState } from '../components/LoadingStates';

export const Analytics = () => {
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getChartData();
      setChartData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Unable to fetch analytics data. Make sure backend service is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Determine dynamic column mapping based on keys in the dataset
  const keys = useMemo(() => {
    if (chartData.length === 0) return [];
    return Object.keys(chartData[0]);
  }, [chartData]);

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

  // Compute stats like High-Low Spread and Moving Averages
  const processedChartData = useMemo(() => {
    if (chartData.length === 0) return [];

    return chartData.map((item, idx) => {
      const openVal = Number(item[openKey]) || 0;
      const closeVal = Number(item[closeKey]) || 0;
      const highVal = Number(item[highKey]) || 0;
      const lowVal = Number(item[lowKey]) || 0;

      let sma10 = null;
      if (idx >= 9) {
        const sum = chartData.slice(idx - 9, idx + 1).reduce((acc, curr) => acc + (Number(curr[closeKey]) || 0), 0);
        sma10 = parseFloat((sum / 10).toFixed(2));
      }

      return {
        ...item,
        open: openVal,
        close: closeVal,
        high: highVal,
        low: lowVal,
        sma10: sma10,
        spread: parseFloat((highVal - lowVal).toFixed(2)),
      };
    });
  }, [chartData, openKey, closeKey, highKey, lowKey]);

  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Financial Analytics Deep-Dive</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Advanced correlation, spreads, and moving averages on top of Nifty 50 CSV.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300/40 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <RefreshCw size={14} />
          <span>Refresh Charts</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Close Price & SMA-10 Line Chart */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Price Trend & SMA 10</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Closing price compared against 10-period Simple Moving Average.</p>
            </div>
            <TrendingUp size={18} className="text-blue-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedChartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey={dateKey} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Line name="Close Price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line name="SMA 10" type="monotone" dataKey="sma10" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open Price vs Close Price Area Chart */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Open vs Close Relationship</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Day-level open to close price deviations.</p>
            </div>
            <Sliders size={18} className="text-violet-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedChartData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCloseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey={dateKey} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Area name="Open Price" type="monotone" dataKey="open" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#colorOpen)" />
                <Area name="Close Price" type="monotone" dataKey="close" stroke="#10b981" strokeWidth={1.5} fill="url(#colorCloseArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily High vs Low Spread Bar Chart */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Daily Price Spread (High - Low)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Difference between the high and low trading boundary for the day.</p>
            </div>
            <BarChart3 size={18} className="text-emerald-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedChartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey={dateKey} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar name="Spread (High - Low)" dataKey="spread" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conditionally Display Volume Distribution Analysis */}
        {hasVolume && (
          <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Daily Volume Trend</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Trading volume fluctuations on a daily axis.</p>
              </div>
              <Layers size={18} className="text-indigo-500" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedChartData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorVolumeArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                  <XAxis dataKey={dateKey} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '11px'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Area name="Volume" type="monotone" dataKey={volumeKey} stroke="#6366f1" fillOpacity={1} fill="url(#colorVolumeArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
