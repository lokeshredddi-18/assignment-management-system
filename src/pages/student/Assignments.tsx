import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment } from '../../types';
import { Upload, CheckCircle, Clock, AlertCircle, FileText, Calendar, Info } from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [similarityNote, setSimilarityNote] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await api.get('/student/assignments');
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, assignmentId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', assignmentId.toString());

    setUploading(assignmentId);
    setSimilarityNote(null);
    try {
      const res = await api.upload('/student/submit', formData);
      if (res.similarityNote) {
        setSimilarityNote(res.similarityNote);
      }
      alert('Assignment submitted successfully!');
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
        <p className="text-slate-500">View your tasks and track your progress.</p>
      </div>

      {similarityNote && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <Info className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{similarityNote}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {assignments?.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 md:flex gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded uppercase tracking-wider">
                    {assignment.subject}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Calendar size={14} />
                    Deadline: {new Date(assignment.deadline).toLocaleString()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{assignment.title}</h3>
                  <p className="text-slate-600 text-sm">{assignment.description}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1 text-slate-500">
                    <FileText size={16} />
                    <span>Total: {assignment.total_marks} Marks</span>
                  </div>
                  {assignment.submitted_at && (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle size={16} />
                      <span>Submitted on {new Date(assignment.submitted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 md:mt-0 md:w-64 shrink-0 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                {assignment.marks !== null ? (
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-emerald-600">
                      {assignment.marks} <span className="text-slate-300 text-lg">/ {assignment.total_marks}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Grade</p>
                    {assignment.feedback && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Feedback</p>
                        <p className="text-sm text-slate-700 italic">"{assignment.feedback}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 text-amber-600 text-sm font-bold bg-amber-50 px-3 py-1 rounded-full">
                        <Clock size={14} />
                        {assignment.submitted_at ? 'Awaiting Evaluation' : 'Not Submitted'}
                      </div>
                    </div>
                    
                    <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                      uploading === assignment.id ? 'opacity-50 pointer-events-none' : 'hover:border-emerald-500 hover:bg-emerald-50/30'
                    }`}>
                      <Upload className="text-slate-400 mb-2" size={24} />
                      <span className="text-xs font-bold text-slate-600">
                        {uploading === assignment.id ? 'Uploading...' : assignment.submitted_at ? 'Resubmit File' : 'Upload Submission'}
                      </span>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, assignment.id)}
                        disabled={uploading !== null}
                      />
                    </label>
                    <p className="text-[10px] text-center text-slate-400">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!assignments || assignments.length === 0) && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900">No Assignments Yet</h3>
            <p className="text-slate-500">Your teachers haven't posted any assignments for you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
