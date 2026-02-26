import si from 'systeminformation';

export class SystemMonitor {
    async getMetrics() {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const graphics = await si.graphics(); // Useful to see if GPU is being used

            // Look at network connections to verify offline status
            const netStats = await si.networkStats();
            const hasOutbound = netStats.some(iface => iface.tx_sec > 0 || iface.rx_sec > 0);

            // In a strict offline mode, we might want to check active connections
            // const connections = await si.networkConnections();
            // const remoteConnections = connections.filter(c => c.peerAddress !== '127.0.0.1' && c.peerAddress !== '::1' && c.state === 'ESTABLISHED');

            return {
                cpuLoad: cpu.currentLoad,
                memoryUsedParams: mem.active,
                memoryTotal: mem.total,
                isOfflineModeActive: true, // We will enforce no outbound from Electron itself, and Ollama is local
                gpu: graphics.controllers.length > 0 ? graphics.controllers[0].model : 'Unknown',
                networkActive: hasOutbound
            };
        } catch (e) {
            console.error('Error getting system metrics:', e);
            return null;
        }
    }
}

export const systemMonitor = new SystemMonitor();
