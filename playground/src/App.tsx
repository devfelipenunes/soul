import React from 'react';
import { Settings, Play, Terminal, Trash2, Search, Lock, ShieldCheck, Database } from 'lucide-react';
import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';
import './index.css';

function ConnectSoulCard() {
  const { sdk, addLog } = useWorkbench();
  const [username, setUsername] = React.useState('felipe');
  const [loading, setLoading] = React.useState(false);

  const handleConnect = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Starting Atomic Onboarding for: ${username}...`);
    try {
      // ESTE É O MÉTODO QUE CHAMA A DIGITAL/PASSKEY E FAZ O FLOW COMPLETO
      const session = await sdk.identity.connect(username);
      addLog('success', 'Soul Connected! Wallet deployed and Token minted.', session);
    } catch (e: any) {
      addLog('error', 'Onboarding failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><ShieldCheck size={18} /> Soul Connect (Passkey)</div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        One-click: Create Passkey -&gt; Deploy Wallet -&gt; Mint Soulbound Token.
      </p>
      <div className="input-group">
        <label className="input-label">Username</label>
        <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
        {loading ? 'Authenticating...' : 'Connect Identity'}
      </button>
    </div>
  );
}

function GetScoreCard() {
  const { sdk, addLog } = useWorkbench();
  const [address, setAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    const target = address || 'Active Session';
    addLog('info', `Calling getScore(${target})`);
    try {
      const start = Date.now();
      // Se address estiver vazio, usa o endereço logado automaticamente!
      const score = await sdk.getScore(address || undefined);
      const duration = Date.now() - start;
      addLog('success', `getScore resolved in ${duration}ms`, score);
    } catch (e: any) {
      addLog('error', `getScore failed`, { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><Search size={18} /> Get Reputation Score</div>
      <div className="input-group">
        <label className="input-label">User Address (Optional if connected)</label>
        <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="Leave empty for active user" />
      </div>
      <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
        {loading ? 'Fetching...' : 'Execute getScore()'}
      </button>
    </div>
  );
}

function Sidebar() {
  const { config, setConfig } = useWorkbench();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className="column">
      <div className="column-header">
        <Settings size={16} /> Configuration
      </div>
      <div className="column-content">
        <div className="input-group">
          <label className="input-label">RPC URL</label>
          <input className="input-field" name="rpcUrl" value={config.rpcUrl} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Relayer URL</label>
          <input className="input-field" name="relayerUrl" value={config.relayerUrl} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Hub Contract Address</label>
          <input className="input-field" name="hubAddress" value={config.hubAddress} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}

function Inspector() {
  const { logs, clearLogs } = useWorkbench();

  return (
    <div className="column">
      <div className="column-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={16} /> Inspector
        </div>
        <button className="btn" style={{ padding: '0.25rem', border: 'none', background: 'transparent' }} onClick={clearLogs} title="Clear Logs">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="column-content" style={{ padding: 0, background: 'var(--bg-base)' }}>
        {logs.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No traces yet.</div>}
        {logs.map(log => (
          <div key={log.id} className={`trace-entry trace-${log.type}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <strong>[{log.type.toUpperCase()}]</strong>
              <span style={{ color: 'var(--text-muted)' }}>{log.timestamp.toLocaleTimeString()}</span>
            </div>
            <div>{log.message}</div>
            {log.data && (
              <pre style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MainPlayground() {
  return (
    <div className="column">
      <div className="column-header">
        <Play size={16} /> Playground
      </div>
      <div className="column-content">
        <ConnectSoulCard />
        <GetScoreCard />
      </div>
    </div>
  );
}

function App() {
  return (
    <WorkbenchProvider>
      <div className="workbench-layout">
        <Sidebar />
        <MainPlayground />
        <Inspector />
      </div>
    </WorkbenchProvider>
  );
}

export default App;
