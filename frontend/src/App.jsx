import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { RootLayout } from './layouts/RootLayout';
import { Spinner } from './components/LoadingStates';
import { Compass, ShieldAlert } from 'lucide-react';

// Import Pages
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Prediction } from './pages/Prediction';
import { Performance } from './pages/Performance';
import { Dataset } from './pages/Dataset';
import { Analytics } from './pages/Analytics';
import { About } from './pages/About';

// Beautiful fallback 404 page
const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 rounded-2xl glass-panel max-w-md mx-auto my-12 border-slate-200/50 dark:border-slate-800/50">
      <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-full mb-4 glow-blue">
        <Compass size={40} className="animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">404 - Page Not Found</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        The destination you are trying to reach does not exist or has been shifted.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-250 cursor-pointer shadow-lg shadow-blue-500/25"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <RootLayout>
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Spinner size="large" /></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/predict" element={<Prediction />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/dataset" element={<Dataset />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RootLayout>
      </Router>
    </ThemeProvider>
  );
}
