import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment } from '../../types';
import { Plus, Calendar, BookOpen, FileText, ChevronRight, Download, Users, AlertCircle, Send, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentStatuses, setStudentStatuses] = useState<any[]>([]);
  const [reportModal, setReportModal] = useState<{show: boolean, student: any} | null>(null);
  const [reportMessage, setReportMessage] = useState('');
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: '',
    deadline: '',
    totalMarks: '100'
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await api.get('/teacher/assignments');
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment);
      const data = await api.get(`/teacher/student-assignment-status/${assignment.id}`);
      setStudentStatuses(data);
      setShowStatusModal(true);
    } catch (err) {
      alert('Failed to fetch student status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/teacher/assignments', {
        ...newAssignment,
        totalMarks: parseInt(newAssignment.totalMarks) || 0
      });
      setSuccess('Assignment created successfully!');
      setNewAssignment({ title: '', description: '', subject: '', deadline: '', totalMarks: '100' });
      fetchAssignments();
      setTimeout(() => {
        setShowModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportModal || !reportMessage.trim()) return;
    setReporting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/teacher/report-student', {
        studentId: reportModal.student.student_id,
        assignmentId: selectedAssignment?.id,
        reason: reportMessage
      });
      setSuccess('Report sent to mentor successfully!');
      setReportMessage('');
      setTimeout(() => {
        setReportModal(null);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send report');
    } finally {
      setReporting(false);
    }
  };

  const handleExport = (id: number) => {
    api.download(`/export/marks/${id}`, `marks_assignment_${id}.csv`);
  };

  const handleExportAll = () => {
    api.download('/export/assignments-summary', 'assignments_summary.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500">Create and manage your course assignments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download size={20} />
            Export All
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} />
            New Assignment
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title or subject..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          Showing {assignments.filter(a => 
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.subject.toLowerCase().includes(searchTerm.toLowerCase())
          ).length} assignments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments
          ?.filter(assignment => 
            assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded uppercase tracking-wider">
                  {assignment.subject}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(assignment.deadline).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{assignment.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{assignment.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <FileText size={16} className="text-slate-400" />
                  <span>{assignment.total_marks} Marks</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
              <Link
                to={`/teacher/submissions/${assignment.id}`}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <FileText size={16} />
                Submissions
              </Link>
              <button
                onClick={() => fetchStatus(assignment)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white border border-slate-200 text-emerald-700 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
              >
                <Users size={16} />
                Status
              </button>
              <button
                onClick={() => handleExport(assignment.id)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Export Marks to CSV"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Status Modal */}
      {showStatusModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Student Status: {selectedAssignment.title}</h2>
                <p className="text-sm text-slate-500">Deadline: {new Date(selectedAssignment.deadline).toLocaleString()}</p>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left">
                <thead className="text-xs text-slate-400 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="pb-4">Student</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Submission Time</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentStatuses?.map((status) => (
                    <tr key={status.student_id}>
                      <td className="py-4">
                        <p className="font-bold text-slate-900">{status.full_name}</p>
                        <p className="text-xs text-slate-500">{status.email}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          status.status === 'ON_TIME' ? 'bg-emerald-50 text-emerald-600' :
                          status.status === 'LATE' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {status.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-500">
                        {status.submitted_at ? new Date(status.submitted_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-4 text-right">
                        {status.status !== 'ON_TIME' && status.mentor_id && (
                          <button
                            onClick={() => setReportModal({show: true, student: status})}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                          >
                            <AlertCircle size={14} />
                            Report to Mentor
                          </button>
                        )}
                        {!status.mentor_id && status.status !== 'ON_TIME' && (
                          <span className="text-[10px] text-slate-400 italic">No Mentor Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Report to Mentor</h3>
            <p className="text-sm text-slate-500 mb-4">
              Sending report for <span className="font-bold text-slate-900">{reportModal.student.full_name}</span> regarding the assignment <span className="font-bold text-slate-900">{selectedAssignment?.title}</span>.
            </p>

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Message to Mentor</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  placeholder="Explain the issue (e.g., student is consistently late)..."
                  value={reportMessage}
                  onChange={e => setReportMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReportModal(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReport}
                  disabled={reporting || !reportMessage.trim()}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {reporting ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Create New Assignment</h2>
            <p className="text-sm text-slate-500 mb-6">Set up a new task for your students to complete.</p>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newAssignment.subject}
                  onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newAssignment.deadline}
                    onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Total Marks</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newAssignment.totalMarks}
                    onChange={e => setNewAssignment({...newAssignment, totalMarks: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newAssignment.description}
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
