import React from 'react';
import { AlertTriangle, Database, RefreshCw, Layers } from 'lucide-react';

/**
 * Premium rotating loading spinner
 */
export const Spinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`animate-spin rounded-full border-t-blue-500 border-r-emerald-500 border-b-indigo-500 border-l-transparent ${sizeClasses[size]}`} />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading data...</span>
    </div>
  );
};

/**
 * Skeleton Loader for cards and details
 */
export const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const pulseClass = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg';
  
  const renderSkeleton = () => {
    if (type === 'table') {
      return (
        <div className={`space-y-3 w-full ${className}`}>
          <div className="h-10 bg-slate-300 dark:bg-slate-700 rounded-md w-full animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center h-12 border-b border-slate-100 dark:border-slate-800">
              <div className={`h-4 w-1/4 ${pulseClass}`} />
              <div className={`h-4 w-1/6 ${pulseClass}`} />
              <div className={`h-4 w-1/6 ${pulseClass}`} />
              <div className={`h-4 w-1/6 ${pulseClass}`} />
              <div className={`h-4 w-1/6 ${pulseClass}`} />
            </div>
          ))}
        </div>
      );
    }

    if (type === 'stats') {
      return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl glass-card space-y-3">
              <div className="flex justify-between items-center">
                <div className={`h-4 w-24 ${pulseClass}`} />
                <div className={`h-8 w-8 rounded-full ${pulseClass}`} />
              </div>
              <div className={`h-8 w-32 ${pulseClass}`} />
              <div className={`h-3 w-20 ${pulseClass}`} />
            </div>
          ))}
        </div>
      );
    }

    // Default card skeleton
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl glass-card space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`h-12 w-12 rounded-full ${pulseClass}`} />
              <div className="space-y-2 flex-1">
                <div className={`h-4 w-1/3 ${pulseClass}`} />
                <div className={`h-3 w-1/4 ${pulseClass}`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-4 w-full ${pulseClass}`} />
              <div className={`h-4 w-5/6 ${pulseClass}`} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return renderSkeleton();
};

/**
 * Graceful error display panel
 */
export const ErrorState = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl glass-panel text-center max-w-lg mx-auto my-6 border-red-500/20 dark:border-red-500/10 ${className}`}>
      <div className="p-4 bg-red-100 dark:bg-red-950/50 text-red-500 rounded-full mb-4 glow-red">
        <AlertTriangle size={36} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Service Error</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        {message || 'Unable to connect to the backend prediction service. Please ensure the server is online and running.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/25"
        >
          <RefreshCw size={16} className="animate-hover" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};

/**
 * Standard empty state container
 */
export const EmptyState = ({ title = 'No Data Found', description = 'There is currently no information available.', icon: Icon = Database, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-card ${className}`}>
      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full mb-4">
        <Icon size={32} />
      </div>
      <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
    </div>
  );
};
