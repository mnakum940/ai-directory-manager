import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileCheck,
    FolderSync,
    Play,
    RotateCcw,
    AlertOctagon,
    MessageSquare,
    RefreshCw,
    BrainCircuit,
    CheckCircle
} from 'lucide-react';

interface BlueprintAction {
    type: string;
    source: string;
    target: string;
    confidence?: number;
    reason?: string;
    isSensitive?: boolean;
}

interface Blueprint {
    summary: string;
    actions: BlueprintAction[];
}

interface DiffViewerProps {
    scanResults: any[] | null;
    blueprint: Blueprint | null;
    setBlueprint: (bp: Blueprint | null) => void;
    onResetProject?: () => void;
}

export default function DiffViewer({ scanResults, blueprint, setBlueprint, onResetProject }: DiffViewerProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [executionLog, setExecutionLog] = useState<{ status: string, message: string }[]>([]);
    const [lastTxId, setLastTxId] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [selectedModel, setSelectedModel] = useState('llama3');

    const generateBlueprint = async (isRegeneration = false) => {
        setIsGenerating(true);
        if (isRegeneration) {
            setBlueprint(null); // Clear old blueprint while generating new one
        }
        try {
            // In a real scenario, we'd map scanResults to a lightweight tree to send to Ollama
            const simpleStructure = (scanResults || []).map((f: any) => ({ path: f.path, type: f.extension }));

            const payload = {
                structure: simpleStructure.slice(0, 100), // Limiting for demo purposes assuming limited context window
                model: selectedModel,
                feedback: feedbackText || null
            };

            const response = await window.api.generateBlueprint(payload);
            setBlueprint(response);
            setShowFeedback(false);
            setFeedbackText('');
        } catch (error) {
            console.error('Failed to generate blueprint:', error);
            // Fallback for demo purposes if Ollama is not working
            setBlueprint({
                summary: "Error generating blueprint. Ensure Ollama is running.",
                actions: []
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const executeChanges = async () => {
        if (!blueprint) return;
        setIsExecuting(true);
        setExecutionLog([]);

        try {
            const txId = `tx_${Date.now()}`;
            setLastTxId(txId);
            const logItems = await window.api.executeBlueprint({ blueprint, transactionId: txId });
            setExecutionLog(logItems.map((entry: any) => ({
                status: entry.success ? 'success' : 'error',
                message: entry.success ? `Moved ${entry.action.source} -> ${entry.action.target}` : `Failed: ${entry.error}`
            })));
        } catch (error: any) {
            setExecutionLog(prev => [...prev, { status: 'error', message: error.message || 'Execution failed' }]);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleRollback = async () => {
        if (!lastTxId) return;
        setIsRollingBack(true);
        try {
            await window.api.rollbackTransaction(lastTxId);
            setExecutionLog(prev => [...prev, { status: 'success', message: 'Transaction rolled back successfully.' }]);
            setLastTxId(null);
        } catch (error: any) {
            setExecutionLog(prev => [...prev, { status: 'error', message: `Rollback failed: ${error.message}` }]);
        } finally {
            setIsRollingBack(false);
        }
    };

    if (!scanResults) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                Run a directory scan first to generate a transformation blueprint.
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <header className="mb-6 lg:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <FolderSync className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />
                        Transformation Blueprint
                    </h2>
                    <p className="text-sm lg:text-base text-slate-400">Review AI-proposed changes before execution. Mandatory dry-run phase.</p>
                </div>

                {!blueprint && (
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-700/50 group-hover:border-emerald-500/50 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                                <label className="text-sm font-medium text-slate-400">Model:</label>
                                <div className="relative flex items-center">
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        disabled={isGenerating}
                                        className="bg-transparent text-emerald-400 text-sm font-bold focus:outline-none appearance-none cursor-pointer disabled:opacity-50 pr-8 w-28 drop-shadow-md"
                                    >
                                        <option value="llama3" className="bg-slate-900 text-slate-200 font-medium">Llama 3</option>
                                        <option value="llama3.2" className="bg-slate-900 text-slate-200 font-medium">Llama 3.2</option>
                                        <option value="mistral" className="bg-slate-900 text-slate-200 font-medium">Mistral</option>
                                    </select>
                                    <div className="absolute right-0 pointer-events-none text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!isGenerating ? (
                            <button
                                onClick={() => generateBlueprint(false)}
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
                            >
                                <BrainCircuit className="w-5 h-5" />
                                Generate Blueprint
                            </button>
                        ) : (
                            <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-xl px-6 py-3 flex flex-col items-center justify-center gap-2 min-w-[200px] shadow-[0_0_15px_rgba(52,211,153,0.15)] relative overflow-hidden">
                                {/* Animated background pulse */}
                                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />

                                <div className="flex items-center gap-2 text-emerald-400 font-medium relative z-10">
                                    <BrainCircuit className="w-5 h-5 animate-pulse" />
                                    <span>AI is Thinking...</span>
                                </div>

                                {/* Indeterminate Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10 mt-1">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            ease: "easeInOut"
                                        }}
                                        style={{ width: "50%" }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 relative z-10 uppercase tracking-widest font-mono">
                                    Processing Local Models
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {blueprint && (
                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-y-auto lg:overflow-hidden pb-8 lg:pb-0">
                    {/* Diff List */}
                    <div className="flex-1 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                            <h3 className="font-medium text-slate-200">Proposed Actions</h3>
                            <p className="text-sm text-slate-500 mt-1">{blueprint.summary}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {blueprint.actions && blueprint.actions.length > 0 ? (
                                blueprint.actions.map((action: BlueprintAction, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-5 rounded-xl border relative overflow-hidden group ${action.isSensitive ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/30 transition-colors'}`}
                                    >
                                        {/* Subtle background glow on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <div className="flex items-center gap-2">
                                                {action.isSensitive ?
                                                    <AlertOctagon className="w-4 h-4 text-rose-400" /> :
                                                    <FileCheck className="w-4 h-4 text-blue-400" />
                                                }
                                                <span className="text-sm font-medium text-slate-300">
                                                    {action.type.toUpperCase()}
                                                </span>
                                            </div>
                                            {action.confidence && (
                                                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                                                    {action.confidence}% ACC
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            {/* Source File */}
                                            <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                <div className="mt-0.5 w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Original Location</p>
                                                    <p className="font-mono text-sm text-slate-400 break-all line-through decoration-rose-500/50">
                                                        {action.source}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Target File */}
                                            {action.target && (
                                                <div className="flex items-start gap-3 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                                                    <div className="mt-0.5 w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-emerald-500/70 font-medium mb-1 uppercase tracking-wider">New Encoded Path</p>
                                                        <p className="font-mono text-sm text-emerald-400 break-all">
                                                            {action.target}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {action.reason && (
                                            <div className="mt-3 text-sm text-slate-400 bg-slate-950/80 px-4 py-3 rounded-lg italic border-l-2 border-slate-700 relative z-10">
                                                <span className="text-indigo-400 font-semibold not-italic mr-2">{"//"} AI Rationale:</span>
                                                {action.reason}
                                            </div>
                                        )}
                                    </motion.div>
                                ))) : (
                                <div className="text-slate-500 text-sm mt-4 italic">No actions generated. Please check your Ollama service.</div>
                            )}
                        </div>
                    </div>

                    {/* Execution Panel */}
                    <div className="w-full lg:w-80 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col p-6 shrink-0">
                        <h3 className="font-medium text-slate-200 mb-6 flex items-center gap-2">
                            <Play className="w-5 h-5 text-emerald-400" />
                            Execution Engine
                        </h3>

                        {executionLog.length === 0 ? (
                            <div className="space-y-4 mt-auto">
                                <p className="text-sm text-slate-400 mb-4">
                                    Review the changes. Execution creates a transaction log for guaranteed rollback.
                                </p>

                                <button
                                    onClick={executeChanges}
                                    disabled={isExecuting || !blueprint.actions || blueprint.actions.length === 0}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isExecuting ? 'Executing...' : 'Approve & Execute'}
                                </button>

                                {showFeedback ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-rose-500/20"
                                    >
                                        <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Rejection Feedback
                                        </label>
                                        <textarea
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="e.g. 'I don't like grouping by file extension. Group by year instead.'"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 min-h-[100px] resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowFeedback(false)}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-all text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => generateBlueprint(true)}
                                                disabled={isGenerating || !feedbackText.trim()}
                                                className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 font-medium py-2 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={() => setShowFeedback(true)}
                                        className="w-full bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 text-slate-300 font-medium py-3 rounded-xl transition-all"
                                    >
                                        Reject & Refine Blueprint
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <h4 className="text-sm font-medium text-slate-400 mb-4">Transaction Log</h4>
                                <div className="flex-1 space-y-2 overflow-y-auto mb-4 font-mono text-xs">
                                    {executionLog.map((log: any, i: number) => (
                                        <div key={i} className={`p-2 rounded break-all ${log.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-800/50'}`}>
                                            {log.message}
                                        </div>
                                    ))}
                                </div>
                                {lastTxId && (
                                    <button
                                        onClick={handleRollback}
                                        disabled={isRollingBack}
                                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                                    >
                                        <RotateCcw className={`w-4 h-4 ${isRollingBack ? 'animate-spin' : ''}`} />
                                        {isRollingBack ? 'Rolling back...' : 'Undo & Rollback'}
                                    </button>
                                )}
                                <button
                                    onClick={onResetProject}
                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Complete & Start Over
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
