import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, BookOpen, UserCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, Role } from '../types';

export default function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [activeRole, setActiveRole] = useState<Role>('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles: { id: Role; label: string; icon: any; color: string }[] = [
    { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'text-red-500' },
    { id: 'TEACHER', label: 'Teacher', icon: BookOpen, color: 'text-blue-500' },
    { id: 'STUDENT', label: 'Student', icon: UserCheck, color: 'text-emerald-500' },
    { id: 'MENTOR', label: 'Mentor', icon: Users, color: 'text-amber-500' },
  ];

  const handleRoleSelect = (role: Role) => {
    setActiveRole(role);
    const user = role.toLowerCase();
    setUsername(user);
    setPassword(user + '123');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { username, password });
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">EduGrade</h2>
          <p className="text-slate-400 mt-2">Assignment Management System</p>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-around">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeRole === role.id 
                  ? 'bg-white shadow-sm ring-1 ring-slate-200 scale-105' 
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              <role.icon className={role.color} size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{role.label}</span>
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : `Sign In as ${activeRole.charAt(0) + activeRole.slice(1).toLowerCase()}`}
          </button>

          <div className="text-center text-xs text-slate-500 space-y-2">
            <p>Click a role above to pre-fill demo credentials</p>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
