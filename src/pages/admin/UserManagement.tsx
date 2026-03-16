import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { UserPlus, Trash2, UserCheck, Shield, BookOpen, Users, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [mentors, setMentors] = useState<{id: number, full_name: string}[]>([]);
  const [students, setStudents] = useState<{id: number, full_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'STUDENT' as Role,
    phone: '',
    address: '',
    department: '',
    grade: '',
    rollNumber: '',
    parentsNumber: ''
  });

  const [assignment, setAssignment] = useState({
    mentorId: '',
    studentId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, mentorsData, studentsData] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/mentors'),
        api.get('/admin/students')
      ]);
      setUsers(usersData);
      setMentors(mentorsData);
      setStudents(studentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/admin/users', newUser);
      setSuccess('User created successfully!');
      setNewUser({ 
        username: '', 
        password: '', 
        fullName: '', 
        email: '', 
        role: 'STUDENT',
        phone: '',
        address: '',
        department: '',
        grade: '',
        rollNumber: '',
        parentsNumber: ''
      });
      fetchData();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      fetchData();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/admin/assign-mentor', assignment);
      setSuccess('Mentor assigned successfully!');
      setAssignment({ mentorId: '', studentId: '' });
      fetchData();
      setTimeout(() => {
        setShowAssignModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign mentor');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'ADMIN': return <Shield className="text-red-500" size={16} />;
      case 'TEACHER': return <BookOpen className="text-blue-500" size={16} />;
      case 'STUDENT': return <UserCheck className="text-emerald-500" size={16} />;
      case 'MENTOR': return <Users className="text-amber-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage system users and role assignments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Users size={20} />
            Assign Mentor
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <UserPlus size={20} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">Full Name</th>
              <th className="px-6 py-4 font-medium">Username</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {user.fullName?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-slate-900">{user.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.username}</td>
                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm font-medium">{user.role}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {user.role === 'STUDENT' && user.grade && <span>Grade: {user.grade} | Roll: {user.rollNumber}</span>}
                      {user.role === 'STUDENT' && user.parentsNumber && <span className="block">Parents: {user.parentsNumber}</span>}
                      {user.role === 'TEACHER' && user.department && <span>Dept: {user.department}</span>}
                      {user.phone && <span className="block">Ph: {user.phone}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle size={20} className="rotate-45" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">Create a new system user with specific roles and details.</p>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <UserCheck size={18} />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Username</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.fullName}
                      onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+1 234 567 890"
                      value={newUser.phone}
                      onChange={e => setNewUser({...newUser, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="123 Main St, City"
                      value={newUser.address}
                      onChange={e => setNewUser({...newUser, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {(newUser.role === 'TEACHER' || newUser.role === 'STUDENT') && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Details</h3>
                  
                  {newUser.role === 'TEACHER' && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Computer Science"
                        value={newUser.department}
                        onChange={e => setNewUser({...newUser, department: e.target.value})}
                      />
                    </div>
                  )}

                  {newUser.role === 'STUDENT' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Grade / Class</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. 10th Grade"
                            value={newUser.grade}
                            onChange={e => setNewUser({...newUser, grade: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-slate-700">Roll Number</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. CS101"
                            value={newUser.rollNumber}
                            onChange={e => setNewUser({...newUser, rollNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Parents' Phone Number</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Emergency contact"
                          value={newUser.parentsNumber}
                          onChange={e => setNewUser({...newUser, parentsNumber: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Assign Mentor to Student</h2>
            <p className="text-sm text-slate-500 mb-6">Link a mentor to a student for performance monitoring.</p>

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <UserCheck size={18} />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleAssignMentor} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Mentor</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={assignment.mentorId}
                  onChange={e => setAssignment({...assignment, mentorId: e.target.value})}
                >
                  <option value="">Choose a mentor...</option>
                  {mentors?.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Student</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  value={assignment.studentId}
                  onChange={e => setAssignment({...assignment, studentId: e.target.value})}
                >
                  <option value="">Choose a student...</option>
                  {students?.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Confirm Deletion</h2>
            <p className="text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-900">{userToDelete.fullName}</span>? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
