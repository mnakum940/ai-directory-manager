import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderPlus,
    Loader2,
    FolderTree,
    BrainCircuit,
    DatabaseZap
} from 'lucide-react';

declare global {
    interface Window {
        api: any;
    }
}

interface ScannerViewProps {
    setScanResults: (results: any) => void;
    setChaosScore: (score: number) => void;
    setActiveTab: (tab: string) => void;
}

export default function ScannerView({ setScanResults, setChaosScore, setActiveTab }: ScannerViewProps) {
    const [selectedPath, setSelectedPath] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const handleSelectFolder = async () => {
        // Call our Electron API
        const path = await window.api.selectFolder();
        if (path) setSelectedPath(path);
    };

    const startScan = async () => {
        if (!selectedPath) return;
        setIsScanning(true);
        setScanProgress(10); // Start progress

        try {
            // Fake progress animation while native scan happens
            const progressInterval = setInterval(() => {
                setScanProgress(p => p < 90 ? p + Math.random() * 15 : p);
            }, 500);

            const items = await window.api.scanDirectory(selectedPath);

            clearInterval(progressInterval);
            setScanProgress(100);

            setTimeout(() => {
                setScanResults(items);
                setChaosScore(Math.min(100, Math.floor(items.length / 50))); // Naive chaos score calculation
                setIsScanning(false);
                setActiveTab('diff'); // Automatically go to Transfom view when done
            }, 800);

        } catch (e) {
            console.error('Scan failed:', e);
            setIsScanning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col justify-center pb-20">
            <div className="text-center mb-12">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-6 ring-1 ring-emerald-500/20"
                >
                    <FolderTree className="w-12 h-12 text-emerald-400" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Initialize Analysis</h2>
                <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto px-4">
                    Select a root directory to begin the local intelligence scan.
                    All neural processing executes directly on your hardware.
                </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)]">

                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none z-0" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Target Directory</label>
                        <div className="flex gap-4">
                            <button
                                onClick={handleSelectFolder}
                                className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-left text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
                            >
                                <FolderPlus className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="truncate">{selectedPath || 'Select a folder...'}</span>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {selectedPath && !isScanning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <button
                                    onClick={startScan}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] group"
                                >
                                    <BrainCircuit className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    Commence AI Scan
                                </button>
                            </motion.div>
                        )}

                        {isScanning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        <span>Analyzing file structure & metadata...</span>
                                    </div>
                                    <span>{Math.round(scanProgress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                        className="h-full bg-emerald-500 rounded-full"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-8 text-center flex items-center justify-center gap-2 text-sm text-slate-500">
                <DatabaseZap className="w-4 h-4" />
                Offline processing module locked. No telemetry emitted.
            </div>
        </div>
    );
}
