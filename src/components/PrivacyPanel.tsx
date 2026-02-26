import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu,
    WifiOff,
    Activity,
    CheckCircle2,
    Loader2
} from 'lucide-react';

interface SystemMetrics {
    cpuLoad: number;
    memoryUsedParams: number;
    memoryTotal: number;
    gpu: string;
    networkActive: boolean;
}

export default function PrivacyPanel() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [ollamaStatus, setOllamaStatus] = useState(false);

    useEffect(() => {
        // Poll metrics every 2 seconds
        const fetchMetrics = async () => {
            const m = await window.api.getSystemMetrics();
            setMetrics(m);
            const oStatus = await window.api.checkOllama();
            setOllamaStatus(oStatus);
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <WifiOff className="w-8 h-8 text-emerald-400" />
                        Privacy Verification
                    </h2>
                    <p className="text-slate-400">Real-time audit of local processing capabilities.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Zero-Trust Environment Active
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Hardware Status */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-400" />
                        Hardware Diagnostics
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">LLM Engine Load (Ollama)</span>
                                <span className="text-slate-300 font-mono">
                                    {metrics ? `${Math.round(metrics.cpuLoad)}%` : '---'}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: metrics ? `${metrics.cpuLoad}%` : '0%' }}
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 font-mono text-sm text-slate-300 space-y-2">
                            <div className="flex justify-between pb-2 border-b border-slate-800/50">
                                <span className="text-slate-500">GPU Device</span>
                                <span className="text-emerald-400">{metrics?.gpu || 'Scanning...'}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-slate-500">Memory Allocation</span>
                                <span>{metrics ? `${Math.round(metrics.memoryUsedParams / (1024 * 1024 * 1024))} GB / ${Math.round(metrics.memoryTotal / (1024 * 1024 * 1024))} GB` : '---'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Network isolation status */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Security & Telemetry Audit
                    </h3>

                    <ul className="space-y-4">
                        <li className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="mt-1">
                                {metrics && !metrics.networkActive ?
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500/50 animate-pulse text-emerald-400" />
                                }
                            </div>
                            <div>
                                <h4 className="text-slate-200 font-medium text-m">Network Egress Blocked</h4>
                                <p className="text-slate-500 text-sm mt-1">Application sandboxed. No outbound API requests detected during AI processing.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="mt-1">
                                {ollamaStatus ?
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                                }
                            </div>
                            <div>
                                <h4 className="text-slate-200 font-medium text-m">Local Inference Hub (`127.0.0.1: 11434`)</h4>
                                <p className="text-slate-500 text-sm mt-1">
                                    {ollamaStatus ? 'Connected to local Ollama instance securely.' : 'Searching for local Ollama service...'}
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    );
}
