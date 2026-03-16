import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, BookOpen, CheckSquare, Users, BarChart3, Shield, ClipboardList } from 'lucide-react';
import { User } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherStudents from './pages/teacher/Students';
import Submissions from './pages/teacher/Submissions';
import StudentAssignments from './pages/student/Assignments';
import MentorStudents from './pages/mentor/Students';

function Layout({ user, onLogout, children }: { user: User; onLogout: () => void; children: React.ReactNode }) {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/', roles: ['ADMIN', 'TEACHER', 'STUDENT', 'MENTOR'] },
    { label: 'User Management', icon: Users, path: '/admin/users', roles: ['ADMIN'] },
    { label: 'Assignments', icon: ClipboardList, path: '/teacher/assignments', roles: ['TEACHER'] },
    { label: 'Students', icon: Users, path: '/teacher/students', roles: ['TEACHER'] },
    { label: 'My Assignments', icon: BookOpen, path: '/student/assignments', roles: ['STUDENT'] },
    { label: 'My Students', icon: Users, path: '/mentor/students', roles: ['MENTOR'] },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-emerald-400" />
            EduGrade
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.filter(item => item.roles.includes(user.role)).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
              {user.fullName?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {(user.role === 'STUDENT' || user.role === 'TEACHER') && (
          <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-end items-center">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-4 text-right hover:bg-slate-50 p-2 rounded-xl transition-colors group"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">{user.fullName}</p>
                <p className="text-[10px] text-slate-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-sm">
                {user.fullName?.charAt(0) || '?'}
              </div>
            </button>
          </div>
        )}
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (user.role === 'STUDENT' || user.role === 'TEACHER') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <LogOut className="rotate-180" size={20} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                {user.fullName?.charAt(0) || '?'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mt-1">{user.role}</p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</p>
                <p className="text-sm text-slate-900 font-medium">{user.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</p>
                <p className="text-sm text-slate-900 font-medium">{user.phone || 'Not provided'}</p>
              </div>
              {user.role === 'STUDENT' && (
                <>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Parents Number</p>
                    <p className="text-sm text-slate-900 font-medium">{user.parentsNumber || 'Not provided'}</p>
                  </div>
                  {user.rollNumber && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Roll Number</p>
                      <p className="text-sm text-slate-900 font-medium">{user.rollNumber}</p>
                    </div>
                  )}
                </>
              )}
              {user.role === 'TEACHER' && user.department && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Department</p>
                  <p className="text-sm text-slate-900 font-medium">{user.department}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-8 bg-slate-900 text-white py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import Register from './pages/Register';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/teacher/assignments" element={<TeacherAssignments />} />
                  <Route path="/teacher/students" element={<TeacherStudents />} />
                  <Route path="/teacher/submissions/:id" element={<Submissions />} />
                  <Route path="/student/assignments" element={<StudentAssignments />} />
                  <Route path="/mentor/students" element={<MentorStudents />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
