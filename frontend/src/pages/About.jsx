import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileCode, Database, Server, Laptop, Cpu, 
  ArrowRight, ShieldCheck, Compass, HelpCircle, Code,
  Layers, Award
} from 'lucide-react';

export const About = () => {
  const flowSteps = [
    { name: 'User UI Input', desc: 'Select model & OHLC boundaries', icon: Laptop, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { name: 'Axios Client', desc: 'Secure POST payload with model ID', icon: FileCode, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { name: 'FastAPI Router', desc: 'Validate inputs & load selected model', icon: Server, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Selected .pkl Model', desc: 'Run model.predict() on feature order', icon: Cpu, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  ];

  const modelsList = [
    'Linear Regression', 'Ridge Regression', 'Lasso Regression', 'Elastic Net',
    'Decision Tree', 'Random Forest', 'Extra Trees', 'Gradient Boosting',
    'Hist Gradient Boosting', 'SVR'
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Technical Architecture & Stack</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          In-depth explanation of the multi-model machine learning pipeline and platform architecture.
        </p>
      </div>

      {/* Interactive Visual Flowchart */}
      <section className="p-6 md:p-8 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Multi-Model Predictive Inference Pipeline</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Flow of execution from model selection to machine learning forecast generation.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          {flowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex-1 w-full p-4 rounded-xl border glass-card text-center flex flex-col items-center space-y-3"
                >
                  <div className={`p-3 rounded-xl border ${step.color} shadow-sm shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-1">{step.desc}</p>
                  </div>
                </motion.div>
                {idx < flowSteps.length - 1 && (
                  <ArrowRight size={20} className="text-slate-300 dark:text-slate-700 hidden md:block shrink-0 rotate-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Model & Dataset Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Learning Details */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-emerald-500">
            <Cpu size={20} />
            <h3 className="font-bold text-lg text-slate-950 dark:text-white">10 Trained Regression Engines</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The platform supports 10 distinct Machine Learning models pre-trained on historical Nifty 50 stock indices:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {modelsList.map((m, i) => (
              <div key={i} className="px-3 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 text-[11px]">
                • {m}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            When a user selects a model, the FastAPI backend routes the feature vector <span className="font-mono text-slate-800 dark:text-slate-200">[open, low, high, close]</span> directly to that model's pickled estimator file, executing <span className="font-mono">model.predict()</span> without fallback.
          </p>
        </div>

        {/* Evaluation Metrics & Dataset */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-blue-500">
            <Database size={20} />
            <h3 className="font-bold text-lg text-slate-950 dark:text-white">Evaluation Metrics & Dataset</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Models are evaluated on <span className="font-bold text-slate-800 dark:text-slate-200">new_data.csv</span> (4,603 records) targeting <span className="font-bold text-emerald-500">Tomorrow_Close</span>.
          </p>
          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between"><span>Residual Sum of Squares (RSS):</span><span className="font-mono font-bold text-blue-500">sum((y - y_pred)²)</span></div>
            <div className="flex justify-between"><span>Root Mean Squared Error (RMSE):</span><span className="font-mono font-bold text-indigo-500">sqrt(mean((y - y_pred)²))</span></div>
            <div className="flex justify-between"><span>R² Score (Variance Fit):</span><span className="font-mono font-bold text-emerald-500">1 - (RSS / SS_tot)</span></div>
          </div>
        </div>
      </div>

      {/* Software Architecture Block */}
      <section className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-violet-500">
          <Code size={20} />
          <h3 className="font-bold text-lg text-slate-950 dark:text-white">Technology Integration</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Full-stack architecture integrating a Python FastAPI microservice with a reactive React/Vite web application:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">1. FastAPI & Scikit-Learn</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Loads trained `.pkl` models at startup, computes RSS/RMSE/R² benchmarks, and runs predictions asynchronously.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">2. Vite & React 19</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Provides code-splitting, dark/light theme context, dynamic model selection dropdown, and Axios request interceptors.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">3. Tailwind CSS & Motion</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Renders a dark glassmorphic financial dashboard with animated counters, Recharts comparison graphs, and scroll transitions.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
