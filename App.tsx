
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import BillHistory from './components/BillHistory';
import Users from './components/Users';
import Purchases from './components/Purchases';
import Customers from './components/Customers';
import Categories from './components/Categories';
import { UserRole } from './types';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For demo convenience if fields empty
      const demoEmail = role === UserRole.ADMIN ? 'admin@pos.com' : 'staff@pos.com';
      const demoPass = role === UserRole.ADMIN ? 'adminpassword' : 'staff123';

      await login(email || demoEmail, password || demoPass);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-8 text-center text-white">
          <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Bharat POS</h1>
          <p className="text-orange-100 opacity-90 text-sm">Modern Billing for Modern Bharat</p>
        </div>
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Login ID (Email)</label>
            <input
              type="email"
              placeholder="e.g. staff@pos.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              disabled={loading}
              className="w-full p-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full p-3 pr-12 bg-white border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={(e) => handleSubmit(e, UserRole.ADMIN)}
              disabled={loading}
              className="bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? '⏳ Loading...' : '👔 Owner Login'}
            </button>
            <button
              onClick={(e) => handleSubmit(e, UserRole.EMPLOYEE)}
              disabled={loading}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? '⏳ Loading...' : '👤 Staff Login'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-500 font-semibold mb-2">Demo Credentials:</p>
              <div className="text-[10px] text-gray-400 space-y-1">
                <p>👔 Owner: admin@pos.com / adminpassword</p>
                <p>👤 Staff: staff@pos.com / staff123</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">
              GST Compliant • Secure • Fast
            </p>
          </div>
        </div>
      </div>
    </div >
  );
};

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  if (!isAuthenticated) return <Login />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'pos' && <POS />}
      {activeTab === 'inventory' && <Inventory />}
      {activeTab === 'categories' && <Categories />}
      {activeTab === 'purchases' && <Purchases />}
      {activeTab === 'users' && <Users />}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'history' && <BillHistory />}
      {activeTab === 'customers' && <Customers />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
