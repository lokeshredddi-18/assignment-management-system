import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Users, Mail, FileText, Search, AlertCircle } from 'lucide-react';

export default function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.get('/teacher/students');
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = (students || []).filter(s => 
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students Directory</h1>
          <p className="text-slate-500">View all students and their submission activity.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search students by name or email..."
          className="flex-1 outline-none text-slate-600"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                {student.fullName?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{student.fullName}</h4>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Mail size={12} />
                  <span className="truncate">{student.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submissions</p>
                <p className="text-lg font-bold text-slate-900">{student.submissionCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-lg font-bold text-emerald-600">Active</p>
              </div>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
