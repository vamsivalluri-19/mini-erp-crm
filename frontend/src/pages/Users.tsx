import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  X,
  Loader2,
  Shield,
  ToggleLeft,
  ToggleRight,
  Mail,
  AlertCircle
} from 'lucide-react';

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  isActive: z.boolean(),
});

type UserFormInput = z.infer<typeof userFormSchema>;

export const Users: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: 'SALES',
      isActive: true,
    }
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddOpen = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: 'SALES',
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (u: any) => {
    setEditingUser(u);
    setValue('name', u.name);
    setValue('email', u.email);
    setValue('role', u.role);
    setValue('isActive', u.isActive);
    setValue('password', ''); // password is blank by default for edit
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (userRecord: any) => {
    try {
      const response = await api.put(`/users/${userRecord.id}`, {
        isActive: !userRecord.isActive,
      });
      if (response.data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update account status.');
    }
  };

  const handleFormSubmit = async (data: UserFormInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: Record<string, any> = { ...data };
        if (!payload.password) delete payload.password; // do not update password if empty

        const response = await api.put(`/users/${editingUser.id}`, payload);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchUsers();
        }
      } else {
        if (!data.password) {
          setFormError('Password is required for new accounts.');
          setSubmitting(false);
          return;
        }
        const response = await api.post('/users', data);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Operation failed. Verify email uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">User Management</h3>
          <p className="text-xs text-slate-400">Admin control panel to manage staff login profiles and operations permissions</p>
        </div>
        <button
          onClick={handleAddOpen}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Security Role</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="block font-bold text-slate-900 leading-tight">{u.name}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                      <Shield className="h-3 w-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={u.id === currentUser?.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5" /> Enabled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5" /> Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditOpen(u)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                      title="Edit specifications"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between smooth-transition">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingUser ? 'Modify Team Account' : 'Register New Team Member'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800 mb-6">
                  <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4 text-xs">
                {/* Name */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                      errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      {...register('email')}
                      className={`block w-full rounded-xl border pl-8 pr-3 py-2 text-xs outline-none transition-all ${
                        errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password {editingUser ? '(leave blank to keep unchanged)' : '*'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                      errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Role selection */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Security Permissions Role *
                  </label>
                  <select
                    {...register('role')}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="SALES">SALES (Customers CRM, Challan Drafts)</option>
                    <option value="WAREHOUSE">WAREHOUSE (Products catalog, adjustments)</option>
                    <option value="ACCOUNTS">ACCOUNTS (Invoice audits, summaries)</option>
                  </select>
                </div>

                {/* Submit button bar */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingUser ? 'Update Account' : 'Register Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
