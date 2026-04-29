import React from 'react';
import { Settings, Play, Terminal, Trash2, Search, Lock, ShieldCheck, Database } from 'lucide-react';
import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';
import './index.css';

function GetSignerCard() {
  const { sdk, addLog } = useWorkbench();
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', 'Calling getSigner()...');
    try {
      const result = await sdk.getSigner();
      addLog('success', 'getSigner resolved', { adminSigner: result });
    } catch (e: any) {
      addLog('error', 'getSigner failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><ShieldCheck size={18} /> Get Hub Admin Signer</div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Fetch the administrative signer of the current Zolvency Hub contract.
      </p>
      <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
        {loading ? 'Fetching...' : 'Execute getSigner()'}
      </button>
    </div>
  );
}

function RegisterSourceCard() {
  const { sdk, addLog } = useWorkbench();
  const [adminKey, setAdminKey] = React.useState('');
  const [tokenAddress, setTokenAddress] = React.useState('CCGK3D3WGLQWOMDDQOM2V22PZXET7PAGNGMBW6WQ7GJNVZW4B2DLUZFA');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Attempting to register source: ${tokenAddress.substring(0, 8)}...`);
    try {
      // Direct call to registry client (requires signer/wallet integration in a real scenario)
      addLog('info', 'Note: Registration usually requires admin signature. Simulation only if no wallet connected.');
      const tx = await sdk.registry.register_token({ 
        admin: adminKey || 'G... (Admin Public Key)', 
        token_contract: tokenAddress 
      });
      addLog('success', 'register_token transaction built/simulated', tx);
    } catch (e: any) {
      addLog('error', 'register_token failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><Database size={18} /> Register Token Source</div>
      <div className="input-group">
        <label className="input-label">Admin Public Key</label>
        <input className="input-field" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="G..." />
      </div>
      <div className="input-group">
        <label className="input-label">Token Contract ID</label>
        <input className="input-field" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
        {loading ? 'Processing...' : 'Register Source'}
      </button>
    </div>
  );
}

function GetScoreCard() {
  const { sdk, addLog } = useWorkbench();
  const [address, setAddress] = React.useState('GAK35OYQKEHPETRCH2JW64OYYJH6WMSBDVRG2SFZ4XJLQ4OHOM45GV75');
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Calling getScore(${address.substring(0, 8)}...)`);
    try {
      const start = Date.now();
      const score = await sdk.getScore(address);
      const duration = Date.now() - start;
      addLog('success', `getScore resolved in ${duration}ms`, score);
    } catch (e: any) {
      addLog('error', `getScore failed`, { error: e.message, stack: e.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><Search size={18} /> Get Reputation Score</div>
      <div className="input-group">
        <label className="input-label">User Stellar Address</label>
        <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
        {loading ? 'Fetching...' : 'Execute getScore()'}
      </button>
    </div>
  );
}

function IsLockedCard() {
  const { sdk, addLog } = useWorkbench();
  const [address, setAddress] = React.useState('GDY6PAWAKXFMA2X2M6GMLBBSINMCWABT5XZLFAIXXBVVOOW727GOHV57');
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Calling isLocked(${address.substring(0, 8)}...)`);
    try {
      const start = Date.now();
      const locked = await sdk.isLocked(address);
      const duration = Date.now() - start;
      addLog('success', `isLocked resolved in ${duration}ms`, { locked });
    } catch (e: any) {
      addLog('error', `isLocked failed`, { error: e.message, stack: e.stack });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><Lock size={18} /> Check Lock Status</div>
      <div className="input-group">
        <label className="input-label">User Stellar Address</label>
        <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
        {loading ? 'Checking...' : 'Execute isLocked()'}
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
          <label className="input-label">Network Passphrase</label>
          <input className="input-field" name="networkPassphrase" value={config.networkPassphrase} onChange={handleChange} />
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
        <GetSignerCard />
        <RegisterSourceCard />
        <GetScoreCard />
        <IsLockedCard />
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
