import React from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    FileWarning,
    HardDrive,
    TrendingUp,
    BrainCircuit,
    Terminal,
    Cpu,
    BookOpen
} from 'lucide-react';

interface ScanResult {
    path: string;
    name: string;
    extension: string;
    size: number;
    created: number;
    modified: number;
    accessed: number;
    isDirectory: boolean;
    preview: string | null;
}

interface DashboardProps {
    chaosScore: number;
    scanResults: ScanResult[] | null;
}

export default function Dashboard({ chaosScore, scanResults }: DashboardProps) {
    // Mock data if no scan yet
    const stats = scanResults ? {
        totalFiles: scanResults.length,
        totalSize: (scanResults.reduce((acc: number, f: ScanResult) => acc + f.size, 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        duplicates: Math.floor(scanResults.length * 0.15), // Mock calculation
        health: 100 - chaosScore
    } : {
        totalFiles: '-',
        totalSize: '-',
        duplicates: '-',
        health: '-',
    };

    const cards = [
        { title: 'System Health', value: `${stats.health}%`, icon: HeartPulse, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { title: 'Total Storage Scanned', value: stats.totalSize, icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'Duplicate Files', value: stats.duplicates, icon: FileWarning, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { title: 'Chaos Score', value: chaosScore, icon: TrendingUp, color: chaosScore > 50 ? 'text-rose-400' : 'text-emerald-400', bg: chaosScore > 50 ? 'bg-rose-400/10' : 'bg-emerald-400/10' },
    ];

    function HeartPulse(props: React.SVGProps<SVGSVGElement>) {
        return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></svg>
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">AI Insights Dashboard</h2>
                <p className="text-sm lg:text-base text-slate-400">View your directory structure health and storage metrics.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={card.title}
                            className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-400 font-medium text-sm mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold text-white">{card.value}</p>
                            </div>
                            <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                                <Icon className="w-32 h-32" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* User Guide */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 lg:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                        How to Use Pragya
                    </h3>
                    <div className="space-y-6 text-slate-300">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">1</div>
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-1">Scan a Directory</h4>
                                <p className="text-sm">Head to the <strong>Scanner</strong> tab and select a messy folder. Pragya will analyze the metadata of all files inside.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">2</div>
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-1">Generate Blueprint</h4>
                                <p className="text-sm">Go to the <strong>Transform</strong> tab. The local AI will group related files and propose a new, clean folder structure.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-500/20">3</div>
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-1">Refine or Execute</h4>
                                <p className="text-sm">Review the proposed changes! If you don't like them, click <strong>Reject & Refine</strong> to command the AI to try again. If they look good, hit <strong>Approve & Execute</strong>.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Requirements */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Cpu className="w-6 h-6 text-blue-400" />
                        System Requirements
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">Pragya is a strict <strong>local-first</strong> application. Processing requires dedicated hardware to run the AI engine offline.</p>

                    <div className="space-y-3 flex-1">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-start gap-3">
                            <Terminal className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300">Ollama Must Be Installed</h4>
                                <p className="text-xs text-slate-500 mt-1">Download Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">ollama.com</a> and ensure the background service is running.</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-start gap-3">
                            <BrainCircuit className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300">Llama3 Model Required</h4>
                                <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-900 p-1.5 rounded mt-2 text-center text-purple-300 border border-purple-500/10">ollama run llama3</p>
                                <p className="text-xs text-slate-500 mt-2">Run this command in your terminal to download the reasoning engine (approx. 4.7GB).</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-start gap-3">
                            <HardDrive className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300">Hardware</h4>
                                <p className="text-xs text-slate-500 mt-1">Minimum 8GB RAM recommended. An M-series Mac or dedicated Nvidia GPU will significantly speed up blueprint generation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
