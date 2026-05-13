import { Database, Shield, Wifi } from 'lucide-react';

export default function StatusBar({ memoryCount }) {
  return (
    <div className="status-bar">
      <div className="status-card">
        <div className="status-indicator">
          <div className="status-dot pulse"></div>
          <Database size={13} className="status-icon" />
        </div>
        <div className="status-info">
          <p className="status-label">🟢 0G Storage Active</p>
          <p className="status-detail">0G Mainnet · {memoryCount} memories</p>
        </div>
      </div>
      <div className="status-card paymaster">
        <Shield size={13} className="status-icon-purple" />
        <p className="status-label-purple">Paymaster: Active</p>
      </div>
      <p className="powered-by">Powered by MemoriaDA</p>
    </div>
  );
}
