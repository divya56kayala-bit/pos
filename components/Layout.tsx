
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'pos', name: 'POS Billing', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { id: 'inventory', name: 'Inventory', roles: [UserRole.ADMIN] },
    { id: 'categories', name: 'Categories', roles: [UserRole.ADMIN] },
    { id: 'purchases', name: 'Purchase Entry', roles: [UserRole.ADMIN] },
    { id: 'customers', name: 'Customers', roles: [UserRole.ADMIN] },
    { id: 'users', name: 'Employees', roles: [UserRole.ADMIN] },
    { id: 'reports', name: 'Reports', roles: [UserRole.ADMIN] },
    { id: 'history', name: 'Bill History', roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role as UserRole));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col no-print shrink-0">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
          <span className="text-orange-500">Sri Purna Chandra</span> General Store
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === item.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 bg-slate-800 hover:bg-red-900 text-red-400 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto h-[100dvh] bg-gray-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
