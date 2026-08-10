import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const followUpFormSchema = z.object({
  note: z.string().min(1, 'Timeline note details are required'),
  followUpDate: z.string().min(1, 'Select a follow-up date'),
});

type FollowUpFormInput = z.infer<typeof followUpFormSchema>;

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const isEditable = currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES';

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormInput>({
    resolver: zodResolver(followUpFormSchema),
  });

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${id}`);
      if (response.data.success) {
        setCustomer(response.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load customer profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (data: FollowUpFormInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await api.post(`/customers/${id}/followups`, {
        note: data.note,
        followUpDate: new Date(data.followUpDate).toISOString(),
      });
      if (response.data.success) {
        setShowAddForm(false);
        reset();
        fetchCustomerDetails(); // refresh timeline
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to submit follow-up note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!window.confirm('Are you sure you want to delete this follow-up note from history?')) {
      return;
    }
    try {
      const response = await api.delete(`/customers/${id}/followups/${followUpId}`);
      if (response.data.success) {
        fetchCustomerDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  if (loading && !customer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="font-bold">{error || 'Customer profile not found'}</p>
        <Link to="/customers" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Customers List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation and Actions Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CRM List
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Business & Customer Profile Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            {/* Initials and Name */}
            <div className="text-center pb-6 border-b border-slate-100">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-600 text-2xl shadow-sm mb-3">
                {customer.customerName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">{customer.customerName}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                {customer.businessName}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                  customer.customerType === 'DISTRIBUTOR'
                    ? 'bg-purple-100 text-purple-800'
                    : customer.customerType === 'WHOLESALE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {customer.customerType}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                  customer.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : customer.status === 'LEAD'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customer.status}
                </span>
              </div>
            </div>

            {/* Profile Contact parameters */}
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex items-start gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Mobile</span>
                  <span className="text-slate-800">{customer.mobile}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email</span>
                  <span className="text-slate-800 break-all">{customer.email || 'No email registered'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">GST Registration</span>
                  <span className="text-slate-800 uppercase font-mono">{customer.gstNumber || 'No GST Registered'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Address</span>
                  <span className="text-slate-800 leading-relaxed font-normal">{customer.address || 'No address added'}</span>
                </div>
              </div>

              {customer.followUpDate && (
                <div className="flex items-start gap-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-indigo-500 uppercase tracking-wider font-bold">Next CRM Follow-up</span>
                    <span className="text-indigo-900 font-extrabold">
                      {new Date(customer.followUpDate).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile notes */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Account Notes</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-xl p-3">
                {customer.notes || 'No general description logged for this relationship yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Columns: Follow-ups Interaction History Timeline */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                CRM Follow-up History
              </h4>
              {isEditable && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Note
                </button>
              )}
            </div>

            {/* Add Follow-up Form */}
            {showAddForm && (
              <form onSubmit={handleSubmit(handleAddFollowUp)} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 animate-slideDown">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Record CRM Interaction</span>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); reset(); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-xs text-red-800">
                    <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                    <p className="font-bold">{formError}</p>
                  </div>
                )}

                {/* Follow up Date selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Next Follow-up Date *
                  </label>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                  />
                  {errors.followUpDate && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.followUpDate.message}</p>
                  )}
                </div>

                {/* Follow up Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Conversation Details / Timeline Notes *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="E.g. Called customer to pitch Cables pricing. They will confirm draft challan on Thursday."
                    {...register('note')}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all custom-scrollbar"
                  />
                  {errors.note && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.note.message}</p>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); reset(); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Log
                  </button>
                </div>
              </form>
            )}

            {/* Timeline UI */}
            <div className="relative border-l border-slate-100 pl-6 ml-2.5 space-y-6">
              {customer.followUps.map((item: any) => (
                <div key={item.id} className="relative text-xs">
                  {/* Bullet */}
                  <div className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                    <MessageSquare className="h-2 w-2" />
                  </div>

                  {/* Bubble content */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 relative hover:border-slate-200 transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{item.creator.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider ml-2">
                          {item.creator.role || 'Sales'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Note body */}
                    <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{item.note}</p>

                    {/* Footer next action date */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400 font-semibold uppercase">
                      <div className="flex items-center gap-1 text-indigo-500 font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        Next Follow-up:{' '}
                        {new Date(item.followUpDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </div>
                      {isEditable && (
                        <button
                          onClick={() => handleDeleteFollowUp(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete timeline note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {customer.followUps.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No interactions recorded on this client profile yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
