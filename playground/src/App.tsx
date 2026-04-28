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
