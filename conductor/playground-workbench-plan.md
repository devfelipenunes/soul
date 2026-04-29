# Zolvency SDK Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-DX Vite+React playground (Workbench) to test and develop the Zolvency SDK in real-time, featuring configuration sidebar, interactive method cards, and a trace inspector.

**Architecture:** A lightweight React app inside the `playground/` directory built with Vite. It links directly to the `src/` directory of the SDK for instant TypeScript feedback and hot-reloading. The UI uses vanilla CSS variables and Lucide icons to maintain a professional, dependency-light aesthetic.

**Tech Stack:** Vite, React, TypeScript, Vanilla CSS, `lucide-react`.

---

### Task 1: Scaffold Playground and Update Dependencies

**Files:**
- Modify: `package.json`
- Create: `playground/package.json` (or just use root, but standard is a separate vite project or root vite config. Let's create a vite app inside `playground/`)

- [ ] **Step 1: Scaffold Vite React-TS App in `playground`**

Run: `npm create vite@latest playground -- --template react-ts`
Expected: Creates the basic Vite React TypeScript structure in the `playground/` folder.

- [ ] **Step 2: Install Playground Dependencies**

Run: `cd playground && npm install && npm install lucide-react`
Expected: Installs React, Vite, and Lucide icons.

- [ ] **Step 3: Link SDK to Playground**

Run: `cd playground && npm install ../`
Expected: Installs the local SDK into the playground so it can be imported as `@zolvency/sdk`. Wait, a better approach for real-time `src/` linkage without build steps is to import directly from `../src` or configure vite alias. Let's configure Vite alias.

- [ ] **Step 4: Configure Vite Alias for Real-time SDK Linkage**

Modify: `playground/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zolvency/sdk': path.resolve(__dirname, '../src')
    }
  },
  server: {
    port: 3000
  }
})
```

- [ ] **Step 5: Add Root Script**

Modify: `package.json` (Root)
Add `"dev:playground": "npm run dev --workspace=playground"` or simply `"dev:playground": "cd playground && npm run dev"` to the `scripts` section.

```json
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --watch --dts",
    "dev:playground": "cd playground && npm run dev",
    "test": "vitest run",
    "demo": "tsx examples/demo.ts",
    "lint": "tsc --noEmit",
    "docs": "typedoc"
  },
```

- [ ] **Step 6: Commit**

```bash
git add package.json playground/
git commit -m "chore: scaffold playground workspace with vite and react"
```

### Task 2: Setup UI Layout and Vanilla CSS Variables

**Files:**
- Modify: `playground/src/index.css`
- Modify: `playground/src/App.tsx`
- Modify: `playground/src/App.css` (delete or clear)

- [ ] **Step 1: Define CSS Variables and Reset**

Modify: `playground/src/index.css`
```css
:root {
  --bg-base: #0f1115;
  --bg-panel: #16181d;
  --bg-surface: #1e2128;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-primary: #3b82f6;
  --accent-hover: #2563eb;
  --border-subtle: #334155;
  --error-base: #ef4444;
  --error-bg: #451a1a;
  --success-base: #10b981;
  --success-bg: #064e3b;
  
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-base);
  color: var(--text-primary);
  line-height: 1.5;
}

.workbench-layout {
  display: grid;
  grid-template-columns: 300px 1fr 400px;
  height: 100vh;
  overflow: hidden;
}

.column {
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  background-color: var(--bg-panel);
}

.column:last-child {
  border-right: none;
}

.column-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Common UI Elements */
.input-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.input-field {
  width: 100%;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover {
  background: var(--border-subtle);
}

.btn-primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.btn-primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trace-entry {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
  word-break: break-all;
}

.trace-error {
  background: var(--error-bg);
  color: #fca5a5;
}

.trace-success {
  background: var(--success-bg);
  color: #6ee7b7;
}
```

- [ ] **Step 2: Basic Layout in App.tsx**

Modify: `playground/src/App.tsx`
```tsx
import React, { useState } from 'react';
import { Settings, Play, Terminal } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div className="workbench-layout">
      {/* Sidebar */}
      <div className="column">
        <div className="column-header">
          <Settings size={16} /> Configuration
        </div>
        <div className="column-content">
          <p className="text-muted text-sm">SDK Config will go here</p>
        </div>
      </div>

      {/* Main Playground */}
      <div className="column">
        <div className="column-header">
          <Play size={16} /> Playground
        </div>
        <div className="column-content">
          <p className="text-muted text-sm">Interactive Cards will go here</p>
        </div>
      </div>

      {/* Inspector */}
      <div className="column">
        <div className="column-header">
          <Terminal size={16} /> Inspector
        </div>
        <div className="column-content" style={{ padding: 0, background: 'var(--bg-base)' }}>
           <p className="text-muted text-sm p-4">Logs will go here</p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Commit**

```bash
git add playground/src/index.css playground/src/App.tsx
git commit -m "feat(playground): setup workbench three-column layout and css vars"
```

### Task 3: Implement Configuration Sidebar and Context

**Files:**
- Create: `playground/src/WorkbenchContext.tsx`
- Modify: `playground/src/App.tsx`

- [ ] **Step 1: Create Workbench Context**

Create: `playground/src/WorkbenchContext.tsx`
```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
    hubAddress: 'CAKC4ZOYRNP5T43OURK4H7H6UIOZ4DDBBHQGD736JTVIS6FNUXTH5QEM'
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
```

- [ ] **Step 2: Update App.tsx with Provider and Sidebar Form**

Modify: `playground/src/App.tsx`
```tsx
import React from 'react';
import { Settings, Play, Terminal, Trash2 } from 'lucide-react';
import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';
import './index.css';

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
        <button className="btn" style={{ padding: '0.25rem', border: 'none' }} onClick={clearLogs} title="Clear Logs">
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
              <pre style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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
        <p className="text-muted text-sm">Cards coming next...</p>
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
```

- [ ] **Step 3: Commit**

```bash
git add playground/src/WorkbenchContext.tsx playground/src/App.tsx
git commit -m "feat(playground): implement global state and sidebar config"
```

### Task 4: Implement Interactive SDK Cards

**Files:**
- Modify: `playground/src/App.tsx`

- [ ] **Step 1: Create Action Cards for `getScore` and `isLocked`**

Modify: `playground/src/App.tsx` (Add these components before `App()` and update `MainPlayground`)

```tsx
// ... existing imports ...
import { Search, Lock } from 'lucide-react';

function GetScoreCard() {
  const { sdk, addLog } = useWorkbench();
  const [address, setAddress] = React.useState('GDRUVDVEMV65AOYIUAQUHNVVTDN5V67K4762E44V6S6D6K6FNXTH5QEM');
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Calling getScore(${address.substring(0,8)}...)`);
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
  const [address, setAddress] = React.useState('GDRUVDVEMV65AOYIUAQUHNVVTDN5V67K4762E44V6S6D6K6FNXTH5QEM');
  const [loading, setLoading] = React.useState(false);

  const handleFetch = async () => {
    if (!sdk) return;
    setLoading(true);
    addLog('info', `Calling isLocked(${address.substring(0,8)}...)`);
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

function MainPlayground() {
  return (
    <div className="column">
      <div className="column-header">
        <Play size={16} /> Playground
      </div>
      <div className="column-content">
        <GetScoreCard />
        <IsLockedCard />
      </div>
    </div>
  );
}

// ... rest of App.tsx (App function and export) remains the same
```

- [ ] **Step 2: Commit**

```bash
git add playground/src/App.tsx
git commit -m "feat(playground): add interactive cards for getScore and isLocked"
```

### Task 5: Final Validation

- [ ] **Step 1: Run Playground**
Run: `npm run dev:playground`
Verify: The UI opens at `http://localhost:3000` (or Vite's default port), the layout renders, and clicking the execute buttons logs output to the Inspector panel. Errors from invalid addresses or uninitialized contracts should elegantly render as red trace logs.
