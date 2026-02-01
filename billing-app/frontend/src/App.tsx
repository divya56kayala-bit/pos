import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Billing from './components/Billing';
import Inventory from './components/Inventory';

function App() {
  const [activeTab, setActiveTab] = useState('billing');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 overflow-hidden relative">
        {activeTab === 'billing' && <Billing />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-full text-slate-500">
            Settings feature coming soon...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
