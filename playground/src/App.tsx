import React from 'react';
import { 
  Settings, Play, Terminal, Trash2, Search, 
  ShieldCheck, User, LogIn, Key, LifeBuoy, 
  RefreshCw, Fingerprint 
} from 'lucide-react';


import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';
import './index.css';

function SoulPassport() {
  const { sdk, addLog } = useWorkbench();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const address = sdk?.getAddress();

  const loadSoul = async () => {
    if (!sdk || !address) return;
    setLoading(true);
    try {
      // Tenta carregar como endereço ou tenta resolver se for um ID
      const metadata = await sdk.getSoulMetadata(address as any);
      setData(metadata);
      if (metadata) {
        addLog('info', 'Soul Token metadata loaded', metadata);
      }
    } catch (e: any) {
      addLog('error', 'Failed to load Soul metadata', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (address) loadSoul();
  }, [address, sdk]);

  if (!address) return null;

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} /> Soul Passport
        </div>
        <button className="btn" onClick={loadSoul} disabled={loading} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {data ? (
        <div className="passport-container">
          <div className="passport-header">
            <div className="passport-id">#{data.tokenId.toString()}</div>
            <div className="passport-tier">{data.metadata.tier}</div>
          </div>
          {data.svg && (
            <div className="passport-svg" dangerouslySetInnerHTML={{ __html: data.svg }} />
          )}
          <div className="passport-details">
            <div className="detail-item">
              <span className="label">Username</span>
              <span className="value">{data.metadata.username}</span>
            </div>
            <div className="detail-item">
              <span className="label">Contributions</span>
              <span className="value">{data.metadata.contributions}</span>
            </div>
            <div className="detail-item">
              <span className="label">Address</span>
              <span className="value text-truncate">{address}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          {loading ? 'Checking Stellar Network...' : 'No Soul Token found for this address.'}
        </div>
      )}
    </div>
  );
}

function OnboardingCard() {
  const { sdk, addLog } = useWorkbench();
  const [password, setPassword] = React.useState('secure-pass-123');
  const [loading, setLoading] = React.useState(false);
  const [vault, setVault] = React.useState<any>(null);

  const handleSovereignCreate = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', 'Starting Sovereign Onboarding (Handshake + Recovery Gen)...');
    try {
      const session = await sdk.createIdentity(password);
      setVault(session.encryptedVault);
      addLog('success', session.soulId !== 'pending' 
        ? `Sovereign Identity Minted! Soul ID: #${session.soulId}` 
        : 'Sovereign Identity Created! Mint transaction prepared.', {
        soulId: session.soulId,
        address: session.address,
        txHash: session.txHash,
        explorer: `https://stellar.expert/explorer/testnet/tx/${session.txHash}`
      });
    } catch (e: any) {
      addLog('error', 'Sovereign Onboarding failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><Fingerprint size={18} /> Sovereign Onboarding</div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Gera Passkey + Chave de Recuperação criptografada.
      </p>
      <div className="input-group">
        <label className="input-label">Recovery Password</label>
        <input 
          type="password"
          className="input-field" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
      </div>
      <button className="btn btn-primary" onClick={handleSovereignCreate} disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Processing...' : 'Create Sovereign Soul'}
      </button>

      {vault && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: '4px', fontSize: '0.7rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Encrypted Vault Generated!</div>
          <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {JSON.stringify(vault).substring(0, 100)}...
          </div>
          <button 
            className="btn" 
            style={{ marginTop: '8px', width: '100%', fontSize: '0.65rem' }}
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(vault));
              addLog('info', 'Vault copied to clipboard');
            }}
          >
            Copy Vault JSON
          </button>
        </div>
      )}
    </div>
  );
}

function IdentifyCard() {
  const { sdk, addLog } = useWorkbench();
  const [loading, setLoading] = React.useState(false);

  const handleIdentify = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', 'Starting Identity Resolution (Login)...');
    try {
      const identity = await sdk.identify();
      addLog('success', 'Identity Resolved!', identity);
    } catch (e: any) {
      addLog('error', 'Identification failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><LogIn size={18} /> Soul Login</div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Resolve a identidade on-chain usando apenas a biometria.
      </p>
      <button className="btn btn-primary" onClick={handleIdentify} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Fingerprint size={16} /> {loading ? 'Scanning...' : 'Identify Myself'}
      </button>
    </div>
  );
}

function RecoveryCard() {
  const { sdk, addLog } = useWorkbench();
  const [soulId, setSoulId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [vaultJson, setVaultJson] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRecover = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Attempting Recovery for Soul #${soulId}...`);
    try {
      const vault = JSON.parse(vaultJson);
      const result = await sdk.recoverSoul({
        soulId: Number(soulId),
        password,
        encryptedVault: vault,
        relayer: sdk.getAddress() || "G_SENDER_REQUIRED"
      });
      
      const txHash = (result.recoverTx as any).hash || (result.recoverTx as any).txHash;
      
      addLog('success', 'Recovery Transaction Built & Broadcasted!', {
        txHash,
        newPasskey: result.newPasskeyHex.substring(0, 20) + '...'
      });
    } catch (e: any) {
      addLog('error', 'Recovery failed', { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title"><LifeBuoy size={18} /> Soul Recovery</div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Recupere seu acesso usando a senha e o vault salvo.
      </p>
      <div className="input-group">
        <label className="input-label">Soul ID (Number)</label>
        <input className="input-field" value={soulId} onChange={e => setSoulId(e.target.value)} placeholder="Ex: 1" />
      </div>
      <div className="input-group">
        <label className="input-label">Recovery Password</label>
        <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Vault JSON</label>
        <textarea 
          className="input-field" 
          style={{ minHeight: '60px', resize: 'vertical' }}
          value={vaultJson} 
          onChange={e => setVaultJson(e.target.value)} 
          placeholder='{"version":"1", ...}'
        />
      </div>
      <button className="btn btn-primary" onClick={handleRecover} disabled={loading} style={{ width: '100%', background: 'var(--accent-primary)' }}>
        {loading ? 'Decrypting & Signing...' : 'Recover Soul Access'}
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
        <label className="input-label">Soul ID or Address (Optional)</label>
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
          <label className="input-label">Paymaster URL</label>
          <input className="input-field" name="paymasterUrl" value={config.paymasterUrl} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Hub (Registry) Address</label>
          <input className="input-field" name="hubAddress" value={config.hubAddress} onChange={handleChange} />
        </div>
        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <Key size={12} /> Pro-tip
          </div>
          Use o "Sovereign Onboarding" para gerar uma identidade com suporte a recuperação. Salve o Vault JSON em um local seguro!
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
                {log.data.txHash && (
                  <div style={{ marginTop: '8px' }}>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${log.data.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link"
                      style={{ color: 'var(--success-base)', textDecoration: 'underline' }}
                    >
                      View on Stellar Expert ↗
                    </a>
                  </div>
                )}
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
        <SoulPassport />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <OnboardingCard />
          <IdentifyCard />
        </div>
        
        <RecoveryCard />
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
