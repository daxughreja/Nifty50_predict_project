import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileCode, Database, Server, Laptop, Cpu, 
  ArrowRight, ShieldCheck, Compass, HelpCircle, Code 
} from 'lucide-react';

export const About = () => {
  const flowSteps = [
    { name: 'User UI Input', desc: 'Enter OHLC daily boundaries', icon: Laptop, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { name: 'Axios Client', desc: 'Secure asynchronous POST request', icon: FileCode, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { name: 'FastAPI Router', desc: 'Input validation (Pydantic schemas)', icon: Server, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Pickle Inference', desc: 'Evaluate Linear Regression weights', icon: Cpu, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Technical Architecture & Stack</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          In-depth explanation of the machine learning model pipeline and software components.
        </p>
      </div>

      {/* Interactive Visual Flowchart */}
      <section className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Predictive Inference Pipeline</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Flow of execution from form entry to machine learning prediction output.</p>
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
            <h3 className="font-bold text-lg text-slate-950 dark:text-white">Linear Regression Core</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Linear Regression models the relationship between target dependent variables and independent features by fitting a linear equation to observed data:
          </p>
          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl font-mono text-xs text-slate-650 dark:text-slate-350 text-center select-all">
            Y = &beta;₀ + &beta;₁(open) + &beta;₂(high) + &beta;₃(low) + &beta;₄(close)
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The coefficients (&beta;<sub>i</sub>) are loaded statically from the `linear_regression_model.pkl` file, representing optimal parameters trained on multiple years of historical Nifty 50 index pricing. No retraining occurs on server startups, ensuring stable parameter evaluations.
          </p>
        </div>

        {/* Dataset Specifications */}
        <div className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-blue-500">
            <Database size={20} />
            <h3 className="font-bold text-lg text-slate-950 dark:text-white">Nifty 50 Dataset Details</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The backend imports `new_data.csv` which contains daily stock indices. Key data points captured are:
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside pl-1.5">
            <li><strong className="text-slate-800 dark:text-slate-200">date:</strong> Historical trading session timestamp.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">open / close:</strong> Price levels at trading session start and final bell.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">high / low:</strong> Daily price peaks and floor values.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">volume (conditional):</strong> Standard volume of shares traded.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Tomorrow_Close:</strong> The next-day closing target utilized for baseline validations.</li>
          </ul>
        </div>
      </div>

      {/* Software Architecture Block */}
      <section className="p-6 rounded-2xl glass-panel border border-white/20 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-violet-500">
          <Code size={20} />
          <h3 className="font-bold text-lg text-slate-950 dark:text-white">Technology Integration</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This full-stack system binds a highly optimized Python microservice with a reactive Vite frontend:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">1. FastAPI API Core</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Serves schema endpoints, health status, statistics calculation, and runs scikit-learn models asynchronously inside Uvicorn.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">2. Vite & React 19</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Leverages code-splitting, custom hooks, and React Context providers to handle Dark Mode toggles and Axios requests seamlessly.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase mb-1">3. Tailwind CSS & Motion</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">Creates a high-fidelity dark glassmorphic design that handles multiple screens, with fluid hover transitions and Recharts tooltip integrations.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
