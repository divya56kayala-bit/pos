import React from 'react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'billing', label: 'Billing', icon: '🛒' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="bg-secondary w-64 h-full flex flex-col border-r border-slate-700 p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
            <div className="mb-8">
                <h1 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span className="text-blue-500" style={{ color: 'var(--accent-color)' }}>⚡</span> SuperPOS
                </h1>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === item.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        style={{
                            backgroundColor: activeTab === item.id ? 'var(--accent-color)' : 'transparent',
                            color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            border: 'none',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            width: '100%',
                            fontSize: '1rem'
                        }}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="text-sm text-slate-500 text-center">
                v1.0.0
            </div>
        </div>
    );
};

export default Sidebar;
