import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderSearch,
  LayoutDashboard,
  GitCompareArrows
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScannerView from './components/ScannerView';
import DiffViewer from './components/DiffViewer';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chaosScore, setChaosScore] = useState(0);
  const [scanResults, setScanResults] = useState<any[] | null>(null);
  const [blueprint, setBlueprint] = useState<any | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  const handleResetProject = () => {
    setScanResults(null);
    setBlueprint(null);
    setChaosScore(0);
    setActiveTab('dashboard');
  };

  // Catch unhandled errors for debugging
  useState(() => {
    window.addEventListener('error', (e) => setDebugError(e.message));
    window.addEventListener('unhandledrejection', (e) => setDebugError(e.reason?.message || 'Promise rejection'));
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner', icon: FolderSearch },
    { id: 'diff', label: 'Transform', icon: GitCompareArrows },
  ];

  return (
    <div className="flex w-full h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col pt-8 z-10">
        <div className="px-4 lg:px-6 mb-8 flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-3 mb-1 whitespace-nowrap">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full"></div>
              <img src="/logo.png" alt="Pragya Logo" className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 object-contain rounded-xl relative z-10" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight hidden lg:block bg-gradient-to-br from-emerald-400 to-blue-500 bg-clip-text text-transparent pb-1">Pragya</h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 uppercase tracking-widest font-semibold hidden lg:block mt-1 pl-1">Intelligent Directory</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 relative group ${isActive ? 'text-white bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border border-emerald-500/20 bg-emerald-500/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 shrink-0 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="font-medium relative z-10 hidden lg:block">{tab.label}</span>
              </motion.button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 flex justify-center lg:justify-start">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-emerald-500/80 bg-emerald-500/10 p-2 lg:px-3 lg:py-2 rounded-lg border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="hidden lg:block">Fully Offline Mode Active</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 w-full relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />

        {/* Global Debug Error Banner */}
        {(!window.api || debugError) && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-rose-500/90 text-white p-4 text-sm font-mono shadow-lg">
            <strong>CRITICAL ERROR DETECTED:</strong> <br />
            {(!window.api) ? "window.api is UNDEFINED. Preload script failed to load." : debugError}
            <button onClick={() => setDebugError(null)} className="ml-4 underline hover:text-rose-200">Dismiss</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full p-8"
          >
            {activeTab === 'dashboard' && <Dashboard chaosScore={chaosScore} scanResults={scanResults} />}
            {activeTab === 'scanner' && <ScannerView setScanResults={setScanResults} setChaosScore={setChaosScore} setActiveTab={setActiveTab} />}
            {activeTab === 'diff' && <DiffViewer scanResults={scanResults} blueprint={blueprint} setBlueprint={setBlueprint} onResetProject={handleResetProject} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
