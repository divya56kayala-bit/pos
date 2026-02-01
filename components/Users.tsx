
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.EMPLOYEE });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare user payload. Repository/API needs password.
      await api.registerUser(newUser);
      await loadUsers();
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.EMPLOYEE });
      alert('User Created Successfully!');
    } catch (err: any) {
      alert('Failed to create user: ' + err.message);
    }
  };

  const toggleStatus = (user: User) => {
    // Current backend doesn't support status toggle explicitly yet or UI might call update endpoint
    // We haven't built an explicit 'Update User' API fully in this turn, or we assume register/update logic.
    // Ideally we would add api.updateUser(user.id, { status: ... })
    // For now, let's alert implementation is pending or add it if easy.
    alert("User status update not fully implemented in API yet.");
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold">
          + Add Staff
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-y">
            <tr>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Name</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Email</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Role</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Status</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u, index) => (
              <tr key={u._id || u.id || index}>
                <td className="px-4 py-4 font-semibold text-gray-900">{u.name}</td>
                <td className="px-4 py-4 text-sm text-gray-700">{u.email}</td>
                <td className="px-4 py-4 text-sm capitalize text-gray-700">{u.role}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button onClick={() => toggleStatus(u)} className="text-blue-600 text-sm font-bold hover:underline">
                    {u.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Create New Staff Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                <input required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors">Create User</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;
