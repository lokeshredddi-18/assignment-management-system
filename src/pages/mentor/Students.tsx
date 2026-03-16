import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Users, ChevronRight, BarChart3, Mail, FileText, TrendingUp, UserPlus, X, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function MentorStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [lateCount, setLateCount] = useState(0);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchReports();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.get('/mentor/students');
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api.get('/mentor/reports');
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    
    if (!newStudentEmail.toLowerCase().endsWith('@gmail.com')) {
      setAddError('Please enter a valid Gmail address (ending in @gmail.com)');
      return;
    }
    setAddLoading(true);
    try {
      const response = await api.post('/mentor/add-student', { email: newStudentEmail });
      setAddSuccess(`${response.studentName} has been added to your list!`);
      setNewStudentEmail('');
      fetchStudents();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(null);
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add student');
    } finally {
      setAddLoading(false);
    }
  };

  const fetchPerformance = async (studentId: number) => {
    try {
      const data = await api.get(`/mentor/student-performance/${studentId}`);
      setPerformance(data);
    } catch (err) {
      console.error(err);
    }
  };


  const handleSendMeetingRequest = async () => {
    if (!selectedStudent) return;
    setSendingMessage(true);
    try {
      await api.post('/mentor/send-message', {
        studentId: selectedStudent.id,
        content: `URGENT: Meeting Request regarding your ${lateCount} late/overdue assignments. Please meet me in the mentor office today.`
      });
      alert('Meeting request sent successfully!');
    } catch (err) {
      alert('Failed to send meeting request');
    } finally {
      setSendingMessage(false);
    }
  };
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setLateCount(student.lateCount || 0);
    fetchPerformance(student.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
          <p className="text-slate-500">Monitor performance and generate progress reports.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <UserPlus size={20} />
          Add Student
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {students?.map((student) => (
            <div
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer flex items-center justify-between ${
                selectedStudent?.id === student.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 
                student.lateCount >= 2 ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  student.lateCount >= 2 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {student.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{student.fullName}</h4>
                    {student.lateCount >= 2 && (
                      <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        {student.lateCount} LATE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${student.email}?subject=Message from your Mentor&body=Hello ${student.fullName},`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Contact Student"
                >
                  <Mail size={18} />
                </a>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </div>
          ))}
          {(!students || students.length === 0) && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <Users className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">No students assigned to you.</p>
            </div>
          )}

          {reports?.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                Teacher Reports
              </h3>
              {reports?.map((report) => (
                <div key={report.id} className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-red-900">{report.student_name}</h4>
                    <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{report.message}</p>
                  <div className="flex flex-col gap-1 pt-2 border-t border-red-200/50 text-[10px] text-red-500">
                    <div className="flex justify-between">
                      <span>Student Email: {report.student_email}</span>
                      <span>From: {report.teacher_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Student Ph: {report.student_phone || 'N/A'}</span>
                      <span>Parents Ph: {report.student_parents_number || 'N/A'}</span>
                    </div>
                    <div className="text-right mt-1">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
                      {selectedStudent.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.fullName}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Mail size={14} />
                          {selectedStudent.email}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <FileText size={14} />
                          ID: {selectedStudent.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <TrendingUp size={16} />
                    Generate Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Assignments</p>
                    <p className="text-2xl font-bold text-slate-900">{performance?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Late Submissions</p>
                    <p className={`text-2xl font-bold ${lateCount >= 2 ? 'text-red-600' : 'text-slate-900'}`}>{lateCount}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {performance?.length > 0 
                        ? Math.round(performance.reduce((acc, curr) => acc + (curr.marks / curr.total_marks), 0) / performance.length * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>

                {lateCount >= 2 && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle size={24} />
                      <div>
                        <p className="font-bold">Multiple Late Submissions</p>
                        <p className="text-sm">Student has {lateCount} late submissions. Consider requesting a meeting.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSendMeetingRequest}
                      disabled={sendingMessage}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {sendingMessage ? 'Sending...' : 'Request Meeting'}
                    </button>
                  </div>
                )}

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-500" />
                  Performance Trend
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="marks" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ r: 6, fill: '#10b981' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold">Recent Evaluations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                      <tr>
                        <th className="px-6 py-4 font-medium">Assignment</th>
                        <th className="px-6 py-4 font-medium">Subject</th>
                        <th className="px-6 py-4 font-medium">Marks</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {performance?.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                          <td className="px-6 py-4 text-slate-600">{p.subject}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-600">{p.marks}</span>
                            <span className="text-slate-400 text-sm"> / {p.total_marks}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.graded_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Users className="text-slate-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900">Select a Student</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Click on a student from the list to view their detailed performance analytics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2">Add Student</h2>
            <p className="text-slate-500 text-sm mb-6">Enter the student's Gmail ID to add them to your list.</p>
            
            {addSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
                {addSuccess}
              </div>
            )}

            {addError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {addError}
              </div>
            )}
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Student Email (Gmail)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newStudentEmail}
                    onChange={e => setNewStudentEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addLoading ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
