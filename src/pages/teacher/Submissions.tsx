import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Submission } from '../../types';
import { Download, CheckCircle, Clock, AlertCircle, ArrowLeft, X } from 'lucide-react';

export default function Submissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [evaluation, setEvaluation] = useState({ marks: '', feedback: '' });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const fetchSubmissions = async () => {
    try {
      const data = await api.get(`/teacher/submissions/${id}`);
      setSubmissions(data.submissions);
      setAssignment(data.assignment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/teacher/evaluate', {
        submissionId: selectedSubmission.id,
        marks: parseInt(evaluation.marks),
        feedback: evaluation.feedback
      });
      setSuccess('Evaluation saved successfully!');
      fetchSubmissions();
      setTimeout(() => {
        setSelectedSubmission(null);
        setEvaluation({ marks: '', feedback: '' });
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setReportLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/teacher/report-student', {
        studentId: selectedSubmission.student_id,
        assignmentId: id,
        reason: reportReason
      });
      setSuccess('Report sent to mentor successfully!');
      setReportReason('');
      setTimeout(() => {
        setShowReportModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send report. Ensure student has a mentor.');
    } finally {
      setReportLoading(true); // Wait, this should be false
      setReportLoading(false);
    }
  };

  const isLate = (submittedAt: string) => {
    if (!assignment?.deadline) return false;
    return new Date(submittedAt) > new Date(assignment.deadline);
  };

  const handleDownload = (sub: Submission) => {
    api.download(`/files/download/${sub.id}`, sub.file_name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
          <p className="text-slate-500">Evaluate student work and provide feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {submissions?.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white p-6 rounded-xl shadow-sm border transition-all cursor-pointer ${
                selectedSubmission?.id === sub.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-100 hover:border-slate-300'
              }`}
              onClick={() => {
                setSelectedSubmission(sub);
                setEvaluation({
                  marks: sub.marks?.toString() || '',
                  feedback: sub.feedback || ''
                });
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {sub.student_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.student_name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">Submitted on {new Date(sub.submitted_at).toLocaleString()}</p>
                      {isLate(sub.submitted_at) && (
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Late
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.marks !== null ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle size={14} />
                      {sub.marks} Marks
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 text-sm font-bold bg-amber-50 px-2 py-1 rounded">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(sub);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    title="Download File"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <FileIcon className="text-slate-400" size={16} />
                <span className="truncate">{sub.file_name}</span>
              </div>
            </div>
          ))}
          {(!submissions || submissions.length === 0) && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">No submissions found for this assignment.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedSubmission ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-8">
              <h3 className="text-lg font-bold mb-6">Evaluation</h3>

              {success && !showReportModal && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-medium flex items-center gap-2">
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              {error && !showReportModal && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleEvaluate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Marks Obtained</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={evaluation.marks}
                    onChange={e => setEvaluation({...evaluation, marks: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Feedback</label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Provide constructive feedback..."
                    value={evaluation.feedback}
                    onChange={e => setEvaluation({...evaluation, feedback: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Evaluation'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <AlertCircle size={16} />
                  Report to Mentor
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-500">
              Select a submission to start evaluating.
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2">Report to Mentor</h2>
            <p className="text-slate-500 text-sm mb-6">
              Send a report to {selectedSubmission?.student_name}'s mentor regarding their performance or behavior.
            </p>

            {success && showReportModal && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            {error && showReportModal && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <form onSubmit={handleReport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Reason for Report</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g., Consistently late submissions, poor quality of work..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={reportLoading}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reportLoading ? 'Sending...' : 'Send Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FileIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
