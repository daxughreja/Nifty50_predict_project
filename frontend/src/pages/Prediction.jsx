import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Copy, Download, RotateCcw, Trash2, FileSpreadsheet, 
  Check, Play, ArrowUpRight, Scale, Info, Sparkles 
} from 'lucide-react';
import { apiService } from '../services/api';
import { showToast } from '../layouts/RootLayout';

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
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    setHistory(savedHistory);
  }, []);

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
        tempErrors.low = 'Low price cannot exceed high price';
        tempErrors.high = 'High price cannot be less than low price';
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
      showToast('Please fix the validation errors before predicting.', 'error');
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

      const newRecord = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inputs: {
          open: parseFloat(formData.open),
          high: parseFloat(formData.high),
          low: parseFloat(formData.low),
          close: parseFloat(formData.close),
        },
        prediction: response.prediction,
        prediction_time: response.prediction_time,
      };

      setResult(newRecord);

      // Save to localStorage prediction history
      const updatedHistory = [...history, newRecord];
      setHistory(updatedHistory);
      localStorage.setItem('prediction_history', JSON.stringify(updatedHistory));
      showToast('Prediction generated successfully!', 'success');

    } catch (err) {
      console.error('Failed to run prediction:', err);
      showToast(err.message || 'Prediction failed. Please make sure the FastAPI backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ open: '', high: '', low: '', close: '' });
    setErrors({});
    setResult(null);
    showToast('Form cleared.', 'info');
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`₹${result.prediction.toFixed(2)}`);
    setCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `NIFTY 50 AI Stock Price Prediction
------------------------------------
Timestamp: ${result.date} ${result.time}
Open Price: ₹${result.inputs.open}
High Price: ₹${result.inputs.high}
Low Price: ₹${result.inputs.low}
Close Price: ₹${result.inputs.close}
------------------------------------
Predicted Tomorrow Close: ₹${result.prediction.toFixed(2)}
------------------------------------
Disclaimer: This prediction is based on a Linear Regression machine learning model. Trading stocks involves risk.`;
    
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `nifty50_prediction_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Result file downloaded.', 'success');
  };

  // Prediction History Actions
  const deleteRecord = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('prediction_history', JSON.stringify(updatedHistory));
    showToast('Record deleted.', 'info');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to delete all prediction records from this browser?')) {
      setHistory([]);
      localStorage.removeItem('prediction_history');
      showToast('All prediction history cleared.', 'info');
    }
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Date', 'Time', 'Open', 'High', 'Low', 'Close', 'Predicted Close'];
    const rows = history.map((item) => [
      item.date,
      item.time,
      item.inputs.open,
      item.inputs.high,
      item.inputs.low,
      item.inputs.close,
      item.prediction,
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nifty55_predictions_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Prediction history exported as CSV.', 'success');
  };

  return (
    <div className="space-y-10 py-4">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">AI Prediction Terminal</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter current session OHLC prices to predict next-day closing value.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Prediction Form Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <Cpu className="text-blue-500" size={20} />
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Run Stock Inference</h3>
          </div>

          <form onSubmit={handlePredict} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Open Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Open Price</label>
                <input
                  type="text"
                  name="open"
                  value={formData.open}
                  onChange={handleInputChange}
                  placeholder="e.g. 1200.00"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border ${
                    errors.open ? 'border-red-500' : 'border-slate-350/50 dark:border-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm`}
                />
                {errors.open && <span className="text-xs font-semibold text-red-500">{errors.open}</span>}
              </div>

              {/* High Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">High Price</label>
                <input
                  type="text"
                  name="high"
                  value={formData.high}
                  onChange={handleInputChange}
                  placeholder="e.g. 1225.00"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border ${
                    errors.high ? 'border-red-500' : 'border-slate-350/50 dark:border-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm`}
                />
                {errors.high && <span className="text-xs font-semibold text-red-500">{errors.high}</span>}
              </div>

              {/* Low Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Low Price</label>
                <input
                  type="text"
                  name="low"
                  value={formData.low}
                  onChange={handleInputChange}
                  placeholder="e.g. 1180.00"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border ${
                    errors.low ? 'border-red-500' : 'border-slate-350/50 dark:border-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm`}
                />
                {errors.low && <span className="text-xs font-semibold text-red-500">{errors.low}</span>}
              </div>

              {/* Close Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Close Price</label>
                <input
                  type="text"
                  name="close"
                  value={formData.close}
                  onChange={handleInputChange}
                  placeholder="e.g. 1210.00"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border ${
                    errors.close ? 'border-red-500' : 'border-slate-350/50 dark:border-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm`}
                />
                {errors.close && <span className="text-xs font-semibold text-red-500">{errors.close}</span>}
              </div>
            </div>

            <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-200/30 dark:border-slate-800/30">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/25 flex-1 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full border-2 border-t-transparent border-white w-4.5 h-4.5" />
                    <span>Processing Inference...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Run Model Prediction</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 border border-slate-300 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer transition"
                title="Reset fields"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Info Card / Explainer */}
        <div className="p-5 rounded-2xl glass-card border border-white/20 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-blue-500">
            <Info size={18} />
            <h4 className="font-bold text-sm">Model Input Information</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The underlying machine learning model is a **Linear Regression** trained on actual Nifty 50 historical data. It takes exactly four daily metrics (Open, High, Low, Close) to predict the next day's close price.
          </p>
          <div className="p-3.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[10px] font-semibold space-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex justify-between"><span>Inputs count:</span><span className="text-emerald-500">4 features</span></div>
            <div className="flex justify-between"><span>Casing layout:</span><span className="font-mono">o, h, l, c</span></div>
            <div className="flex justify-between"><span>Target:</span><span>Next-day closing price</span></div>
          </div>
        </div>
      </div>

      {/* Inference Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-6 rounded-2xl glass-panel border border-emerald-500/20 dark:border-emerald-500/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl glow-green shrink-0">
              <Sparkles size={36} />
            </div>

            <div className="flex-1 space-y-2 text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Predicted Tomorrow Close</span>
              <div className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white leading-tight">
                ₹{result.prediction.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Generated at {result.date} {result.time} using `linear_regression_model.pkl`.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-300/40 dark:border-slate-800"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-300/40 dark:border-slate-800"
              >
                <Download size={14} />
                <span>Download TXT</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Prediction History Panel */}
      <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Predictions Log</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">History of stock inference sessions run locally.</p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={exportHistoryCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer border border-slate-300/40 dark:border-slate-800"
              >
                <FileSpreadsheet size={14} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={clearHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 text-xs font-bold rounded-lg cursor-pointer border border-red-500/15"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-450 dark:text-slate-500 text-sm font-semibold">
            Inference history is empty. Input metrics above to generate stock forecasts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Inputs (O/H/L/C)</th>
                  <th className="py-3 px-4 text-right">Predicted Close</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {[...history].reverse().map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs">
                      {item.date} {item.time}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-semibold">
                      O: {item.inputs.open.toFixed(2)} | H: {item.inputs.high.toFixed(2)} | L: {item.inputs.low.toFixed(2)} | C: {item.inputs.close.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-500">
                      ₹{item.prediction.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteRecord(item.id)}
                        className="text-red-500 hover:text-red-650 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition"
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
      </div>
    </div>
  );
};
