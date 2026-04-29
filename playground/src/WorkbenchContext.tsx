import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { ZolvencySDK, PRESETS } from '@zolvency/sdk';

interface TraceLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error';
  message: string;
  data?: any;
}

interface WorkbenchState {
  config: {
    rpcUrl: string;
    networkPassphrase: string;
    hubAddress: string;
  };
  setConfig: (config: any) => void;
  sdk: ZolvencySDK | null;
  logs: TraceLog[];
  addLog: (type: TraceLog['type'], message: string, data?: any) => void;
  clearLogs: () => void;
}

const WorkbenchContext = createContext<WorkbenchState | undefined>(undefined);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState({
    rpcUrl: PRESETS.TESTNET.rpcUrl,
    networkPassphrase: PRESETS.TESTNET.networkPassphrase,
    hubAddress: 'CAAFVZRKABOYNJV4GSFAWXSBX7F5VM3EKJ7K6RVKFVN2Z36VRKPFH3SV'
  });
  
  const [logs, setLogs] = useState<TraceLog[]>([]);

  const addLog = (type: TraceLog['type'], message: string, data?: any) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      type,
      message,
      data
    }, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  // Memoize SDK instance
  const sdk = React.useMemo(() => {
    try {
      return new ZolvencySDK(config);
    } catch (e: any) {
      addLog('error', 'Failed to initialize SDK', e.message);
      return null;
    }
  }, [config]);

  return (
    <WorkbenchContext.Provider value={{ config, setConfig, sdk, logs, addLog, clearLogs }}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench() {
  const context = useContext(WorkbenchContext);
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return context;
}
