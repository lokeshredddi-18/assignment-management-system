import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, CheckSquare, Users, AlertCircle, Clock, BarChart3 } from 'lucide-react';

export default function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<{pending: number, submitted: number, graded: number, lateCount: number} | null>(null);
  const [memberStats, setMemberStats] = useState<any[]>([]);
  const [mentorReports, setMentorReports] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch member stats for everyone
        const members = await api.get('/dashboard/members');
        setMemberStats(members);

        if (user.role === 'TEACHER') {
          const data = await api.get('/analytics/teacher-summary');
          setStats(data);
        } else if (user.role === 'ADMIN') {
          const logs = await api.get('/audit-logs');
          setStats({ logs });
        } else if (user.role === 'MENTOR') {
          const reports = await api.get('/mentor/reports');
          setMentorReports(reports);
        }

        if (user.role === 'STUDENT') {
          const messages = await api.get('/student/unread-messages');
          if (messages.length > 0) {
            setUnreadMessages(messages);
            setShowMsgModal(true);
          }
          const sStats = await api.get('/student/assignment-stats');
          setStudentStats(sStats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user.role]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.post(`/student/mark-read/${id}`, {});
      setUnreadMessages(prev => prev.filter(m => m.id !== id));
      if (unreadMessages.length <= 1) {
        setShowMsgModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user.role === 'STUDENT' ? 'Welcome back student' : `Welcome back, ${user.fullName}`}
          </h1>
          <p className="text-slate-500">Here's what's happening in your {user.role.toLowerCase()} portal.</p>
        </div>
        <div className="flex gap-3">
          {user.role !== 'STUDENT' && memberStats?.map((stat: any) => (
            <div key={stat.role} className="bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{stat.role}s</p>
              <p className="text-lg font-bold text-slate-900">{stat.count}</p>
            </div>
          ))}
        </div>
      </header>

      {user.role === 'TEACHER' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold mb-4 text-slate-500 uppercase tracking-wider">Submission Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.isArray(stats) ? stats : []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="title" fontSize={12} tick={{fill: '#64748b'}} />
                  <YAxis fontSize={12} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="submission_count" fill="#10b981" radius={[4, 4, 0, 0]} name="Submissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold mb-4 text-slate-500 uppercase tracking-wider">Average Marks</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.isArray(stats) ? stats : []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="title" fontSize={12} tick={{fill: '#64748b'}} />
                  <YAxis fontSize={12} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="avg_marks" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Marks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {user.role === 'ADMIN' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">System Status</p>
                <p className="text-xl font-bold text-slate-900">Active</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckSquare size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Database</p>
                <p className="text-xl font-bold text-slate-900">Connected</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Uptime</p>
                <p className="text-xl font-bold text-slate-900">99.9%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold">Recent Audit Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                    <th className="px-6 py-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{log.username || 'System'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.action.includes('DELETE') ? 'bg-red-50 text-red-600' : 
                          log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{log.details}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {user.role === 'STUDENT' && (
        <div className="space-y-6">
          {studentStats && studentStats.lateCount >= 2 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-900">Academic Warning</h3>
                <p className="text-sm text-red-700">
                  You have <span className="font-bold">{studentStats.lateCount}</span> late or overdue assignments. 
                  Please complete them as soon as possible and contact your mentor if you need assistance.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-xl font-bold text-slate-900">{studentStats?.pending || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckSquare size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="text-xl font-bold text-slate-900">{studentStats?.submitted || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Graded</p>
                <p className="text-xl font-bold text-slate-900">{studentStats?.graded || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">My Assignments</h3>
              <p className="text-slate-500 mb-6">View and submit your pending tasks.</p>
              <button 
                onClick={() => window.location.href = '/student/assignments'}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800"
              >
                View All
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Performance</h3>
              <p className="text-slate-500 mb-6">Track your grades and feedback.</p>
              <button 
                onClick={() => window.location.href = '/student/assignments'}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {user.role === 'MENTOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Mentor Portal</h3>
              <p className="text-slate-500 mb-6">You are assigned to monitor student performance and provide guidance.</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Students</p>
                  <p className="text-2xl font-bold text-slate-900">Active</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reports</p>
                  <p className="text-2xl font-bold text-slate-900">{mentorReports.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold">Teacher Reports</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px]">
                {mentorReports.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                    <p>No reports from teachers yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {mentorReports?.map((report: any) => (
                      <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-900">{report.student_name}</p>
                            <p className="text-xs text-slate-500">Reported by {report.teacher_name}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          "{report.message}"
                        </p>
                        {report.assignment_title && (
                          <p className="text-[10px] text-slate-400 mt-2">Assignment: {report.assignment_title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mentor Messages Modal for Students */}
      {showMsgModal && unreadMessages.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-6 text-white text-center relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Message from Mentor</h3>
              <p className="text-emerald-100 text-sm mt-1">You have a new notification</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {unreadMessages.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700 text-center text-lg font-medium">
                      "{msg.content}"
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="font-bold text-slate-500 uppercase tracking-wider">From: {msg.mentor_name}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                      I Understand
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
