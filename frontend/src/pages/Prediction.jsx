import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Copy, Download, RotateCcw, Trash2, FileSpreadsheet, 
  Check, Play, ArrowUpRight, ArrowDownRight, Scale, Info, 
  Sparkles, Zap, RefreshCw, CheckCircle2, TrendingUp, TrendingDown
} from 'lucide-react';
import { apiService } from '../services/api';
import { showToast } from '../layouts/RootLayout';
import { SpotlightCard } from '../components/SpotlightCard';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const Prediction = () => {
  // Form State
  const [formData, setFormData] = useState({
    open: '',
    high: '',
    low: '',
    close: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingLatest, setFetchingLatest] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    setHistory(savedHistory);
  }, []);

  // Quick fill with latest NIFTY 50 market record
  const handleAutoFillLatest = async () => {
    setFetchingLatest(true);
    try {
      const latest = await apiService.getLatestRecord();
      if (latest) {
        setFormData({
          open: latest.open !== undefined ? String(latest.open) : '',
          high: latest.high !== undefined ? String(latest.high) : '',
          low: latest.low !== undefined ? String(latest.low) : '',
          close: latest.close !== undefined ? String(latest.close) : '',
        });
        setErrors({});
        showToast(`Auto-filled latest NIFTY 50 values (${latest.date || 'Market Close'})!`, 'success');
      }
    } catch (err) {
      console.error('Failed to fetch latest record for autofill:', err);
      showToast('Unable to fetch latest market data. Please enter values manually.', 'error');
    } finally {
      setFetchingLatest(false);
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const tempErrors = {};
    const { open, high, low, close } = formData;

    if (!open) tempErrors.open = 'Open price is required';
    else if (isNaN(open) || parseFloat(open) <= 0) tempErrors.open = 'Must be a positive number';

    if (!high) tempErrors.high = 'High price is required';
    else if (isNaN(high) || parseFloat(high) <= 0) tempErrors.high = 'Must be a positive number';

    if (!low) tempErrors.low = 'Low price is required';
    else if (isNaN(low) || parseFloat(low) <= 0) tempErrors.low = 'Must be a positive number';

    if (!close) tempErrors.close = 'Close price is required';
    else if (isNaN(close) || parseFloat(close) <= 0) tempErrors.close = 'Must be a positive number';

    if (!tempErrors.high && !tempErrors.low) {
      if (parseFloat(low) > parseFloat(high)) {
        tempErrors.low = 'Low price cannot exceed High price';
        tempErrors.high = 'High price cannot be less than Low price';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors before running prediction.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      // Call FastAPI prediction service
      const response = await apiService.predictPrice({
        open: formData.open,
        high: formData.high,
        low: formData.low,
        close: formData.close,
      });

      const openVal = parseFloat(formData.open);
      const highVal = parseFloat(formData.high);
      const lowVal = parseFloat(formData.low);
      const closeVal = parseFloat(formData.close);
      const predictedVal = response.prediction;

      const diffVal = predictedVal - closeVal;
      const pctChangeVal = (diffVal / closeVal) * 100;
      
      let direction = 'neutral';
      if (diffVal > 0.05) direction = 'bullish';
      else if (diffVal < -0.05) direction = 'bearish';

      const newRecord = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inputs: {
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
        },
        prediction: predictedVal,
        diff: diffVal,
        pctChange: pctChangeVal,
        direction: direction,
        prediction_time: response.prediction_time,
      };

      // Stagger result state update slightly for animation trigger
      setTimeout(() => {
        setResult(newRecord);

        // Save to localStorage prediction history
        const updatedHistory = [...history, newRecord];
        setHistory(updatedHistory);
        localStorage.setItem('prediction_history', JSON.stringify(updatedHistory));
        showToast('Prediction generated successfully!', 'success');
      }, 400);

    } catch (err) {
      console.error('Failed to run prediction:', err);
      showToast(err.message || 'Unable to generate prediction right now. Please check your connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ open: '', high: '', low: '', close: '' });
    setErrors({});
    setResult(null);
    showToast('Input fields reset.', 'info');
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`₹${result.prediction.toFixed(2)}`);
    setCopied(true);
    showToast('Copied predicted close to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `NIFTY 50 AI Stock Price Forecast Report
===================================================
Generated At: ${result.date} ${result.time}
Model Engine: Scikit-Learn Linear Regression (linear_regression_model.pkl)
---------------------------------------------------
INPUT METRICS (TODAY):
  Open Price : ₹${result.inputs.open.toFixed(2)}
  High Price : ₹${result.inputs.high.toFixed(2)}
  Low Price  : ₹${result.inputs.low.toFixed(2)}
  Close Price: ₹${result.inputs.close.toFixed(2)}
---------------------------------------------------
PREDICTION RESULT (TOMORROW):
  Predicted Tomorrow Close: ₹${result.prediction.toFixed(2)}
  Reference Today Close   : ₹${result.inputs.close.toFixed(2)}
  Expected Price Change   : ${result.diff >= 0 ? '+' : ''}₹${result.diff.toFixed(2)} (${result.pctChange >= 0 ? '+' : ''}${result.pctChange.toFixed(2)}%)
  Market Sentiment        : ${result.direction.toUpperCase()}
===================================================
Disclaimer: Forecasts are generated using Machine Learning based on historical Nifty 50 trends. Financial markets carry risks. For educational use only.`;
    
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `NIFTY50_AI_Prediction_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Prediction text report saved to downloads.', 'success');
  };

  const deleteRecord = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('prediction_history', JSON.stringify(updatedHistory));
    showToast('Record removed.', 'info');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local prediction history?')) {
      setHistory([]);
      localStorage.removeItem('prediction_history');
      showToast('All prediction records cleared.', 'info');
    }
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Date', 'Time', 'Open', 'High', 'Low', 'Close', 'Predicted Tomorrow Close', 'Expected Change', 'Direction'];
    const rows = history.map((item) => [
      item.date,
      item.time,
      item.inputs.open,
      item.inputs.high,
      item.inputs.low,
      item.inputs.close,
      item.prediction,
      item.diff ? item.diff.toFixed(2) : 'N/A',
      item.direction || 'N/A'
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nifty50_prediction_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported prediction history as CSV.', 'success');
  };

  return (
    <div className="space-y-10 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">AI Prediction Terminal</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Input trading session OHLC parameters to generate next-day NIFTY 50 closing price forecast.
          </p>
        </div>

        {/* Quick Fill Button with Hover Micro-interaction */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAutoFillLatest}
          disabled={fetchingLatest}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          {fetchingLatest ? <RefreshCw size={14} className="animate-spin text-blue-500" /> : <Zap size={14} className="text-amber-500" />}
          <span>Use Latest Market Data</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Prediction Input Form */}
        <SpotlightCard className="lg:col-span-2 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 glow-blue">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Input Market OHLC Parameters</h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Values in Indian Rupees (₹)</span>
              </div>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Open Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Open Price</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opening Bell</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    name="open"
                    value={formData.open}
                    onChange={handleInputChange}
                    placeholder="e.g. 24500.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border ${
                      errors.open ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300/60 dark:border-slate-800'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900 dark:text-white transition`}
                  />
                </div>
                {errors.open && <span className="text-xs font-semibold text-red-500">{errors.open}</span>}
              </div>

              {/* High Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>High Price</span>
                  <span className="text-[10px] text-slate-400 font-normal">Session Peak</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    name="high"
                    value={formData.high}
                    onChange={handleInputChange}
                    placeholder="e.g. 24650.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border ${
                      errors.high ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300/60 dark:border-slate-800'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900 dark:text-white transition`}
                  />
                </div>
                {errors.high && <span className="text-xs font-semibold text-red-500">{errors.high}</span>}
              </div>

              {/* Low Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Low Price</span>
                  <span className="text-[10px] text-slate-400 font-normal">Session Floor</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    name="low"
                    value={formData.low}
                    onChange={handleInputChange}
                    placeholder="e.g. 24420.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border ${
                      errors.low ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300/60 dark:border-slate-800'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900 dark:text-white transition`}
                  />
                </div>
                {errors.low && <span className="text-xs font-semibold text-red-500">{errors.low}</span>}
              </div>

              {/* Close Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Close Price</span>
                  <span className="text-[10px] text-slate-400 font-normal">Final Bell</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    name="close"
                    value={formData.close}
                    onChange={handleInputChange}
                    placeholder="e.g. 24580.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border ${
                      errors.close ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300/60 dark:border-slate-800'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900 dark:text-white transition`}
                  />
                </div>
                {errors.close && <span className="text-xs font-semibold text-red-500">{errors.close}</span>}
              </div>
            </div>

            {/* Micro-interactive Submit Button (Requirement 5) */}
            <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/25 flex-1 disabled:opacity-50 glow-blue"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full border-2 border-t-transparent border-white w-4.5 h-4.5" />
                    <span>Calculating Linear Inference...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Predict Tomorrow's Close</span>
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 border border-slate-300/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer transition"
                title="Reset fields"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        </SpotlightCard>

        {/* Informational Sidebar Card */}
        <SpotlightCard className="p-6 space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Info size={18} />
            <h4 className="font-bold text-sm">Model Input Specifications</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The trained **Linear Regression** model (`linear_regression_model.pkl`) evaluates 4 primary input features: Open, High, Low, and Close.
          </p>
          <div className="p-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs font-medium space-y-2 text-slate-600 dark:text-slate-400">
            <div className="flex justify-between"><span>Inputs Required:</span><span className="font-bold text-emerald-500">4 Numeric Values</span></div>
            <div className="flex justify-between"><span>Feature Vector:</span><span className="font-mono text-slate-800 dark:text-slate-200">[open, high, low, close]</span></div>
            <div className="flex justify-between"><span>Target Variable:</span><span className="font-bold text-blue-500">Tomorrow_Close</span></div>
          </div>
        </SpotlightCard>
      </div>

      {/* Prediction Result Display Section with Staggered WOW Reveal (Requirements 6, 7) */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="p-6 md:p-8 rounded-3xl glass-panel border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl relative overflow-hidden space-y-6"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="p-4 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl glow-green shrink-0"
                >
                  <Sparkles size={32} />
                </motion.div>
                <div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1"
                  >
                    <CheckCircle2 size={12} />
                    <span>AI Model Forecast</span>
                  </motion.div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Predicted Tomorrow's Close</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Generated on {result.date} at {result.time}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-300/50 dark:border-slate-800"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Price'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Download size={14} />
                  <span>Download Report</span>
                </button>
              </div>
            </div>

            {/* Metrics Breakout Display with Animated Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 relative z-10">
              {/* Predicted Price Prominent Display */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-5 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-500/5 space-y-1"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Predicted Close</span>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={result.prediction} prefix="₹" decimals={2} duration={1.2} />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Model Forecast</span>
              </motion.div>

              {/* Today Reference Price */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="p-5 rounded-2xl glass-card space-y-1"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Close (Ref)</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedCounter value={result.inputs.close} prefix="₹" decimals={2} duration={1} />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Input Reference</span>
              </motion.div>

              {/* Expected Difference */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="p-5 rounded-2xl glass-card space-y-1"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expected Change</span>
                <div className={`text-3xl font-black ${result.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  <AnimatedCounter value={result.diff} prefix={result.diff >= 0 ? '+₹' : '₹'} decimals={2} duration={1.2} />
                </div>
                <span className={`text-[11px] font-bold ${result.pctChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  <AnimatedCounter value={result.pctChange} prefix={result.pctChange >= 0 ? '+' : ''} suffix="%" decimals={2} duration={1.2} />
                </span>
              </motion.div>

              {/* Market Direction Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="p-5 rounded-2xl glass-card space-y-1 flex flex-col justify-between"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Market Direction</span>
                <div className="flex items-center space-x-2">
                  {result.direction === 'bullish' ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wider glow-green">
                      <TrendingUp size={18} />
                      <span>Bullish</span>
                    </div>
                  ) : result.direction === 'bearish' ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 font-black text-sm uppercase tracking-wider glow-red">
                      <TrendingDown size={18} />
                      <span>Bearish</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300 font-black text-sm uppercase tracking-wider">
                      <Scale size={18} />
                      <span>Neutral</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Prediction History Panel */}
      <SpotlightCard className="p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Local Prediction Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recorded forecasts run in your active browser session.</p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={exportHistoryCSV}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer border border-slate-300/50 dark:border-slate-800"
              >
                <FileSpreadsheet size={14} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={clearHistory}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl cursor-pointer border border-red-500/15"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
            Prediction history is empty. Input values above to calculate stock forecasts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Inputs (O / H / L / C)</th>
                  <th className="py-3 px-4 text-right">Predicted Close</th>
                  <th className="py-3 px-4 text-center">Direction</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {[...history].reverse().map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs">
                      {item.date} {item.time}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      O: {item.inputs.open.toFixed(2)} | H: {item.inputs.high.toFixed(2)} | L: {item.inputs.low.toFixed(2)} | C: {item.inputs.close.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.prediction.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        item.direction === 'bullish' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        item.direction === 'bearish' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.direction || 'Neutral'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteRecord(item.id)}
                        className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition"
                        title="Delete run"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
};

export default Prediction;
