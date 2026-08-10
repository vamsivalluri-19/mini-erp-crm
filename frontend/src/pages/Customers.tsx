import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Zod schemas for Customer Form
const customerFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().optional().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional(),
});

type CustomerFormInput = z.infer<typeof customerFormSchema>;

export const Customers: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isEditable = role === 'ADMIN' || role === 'SALES';
  const isAdmin = role === 'ADMIN';

  // State
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search / Pagination parameters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      status: 'LEAD',
      customerType: 'RETAIL',
    }
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 8 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.customerType = typeFilter;

      const response = await api.get('/customers', { params });
      if (response.data.success) {
        setCustomers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch customers registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300); // Simple debouncing
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, typeFilter, page]);

  // Open modal for add
  const handleAddOpen = () => {
    setEditingCustomer(null);
    reset({
      customerName: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: null,
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEditOpen = (cust: any) => {
    setEditingCustomer(cust);
    setValue('customerName', cust.customerName);
    setValue('mobile', cust.mobile);
    setValue('email', cust.email || '');
    setValue('businessName', cust.businessName);
    setValue('gstNumber', cust.gstNumber || '');
    setValue('customerType', cust.customerType);
    setValue('address', cust.address || '');
    setValue('status', cust.status);
    setValue('followUpDate', cust.followUpDate ? new Date(cust.followUpDate).toISOString().split('T')[0] : null);
    setValue('notes', cust.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CustomerFormInput) => {
    setFormError(null);
    setSubmitting(true);
    // Sanitize dates and empty values
    const sanitizedData = {
      ...data,
      email: data.email || null,
      gstNumber: data.gstNumber || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
    };

    try {
      if (editingCustomer) {
        // Edit Customer
        const response = await api.put(`/customers/${editingCustomer.id}`, sanitizedData);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchCustomers();
        }
      } else {
        // Create Customer
        const response = await api.post('/customers', sanitizedData);
        if (response.data.success) {
          setIsModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Operation failed. Check input formats (e.g. GST template).');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer '${name}'? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data.success) {
        fetchCustomers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete customer. Historical transactions exist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Customer CRM</h3>
          <p className="text-xs text-slate-400">Manage client followups, profiles, and transaction archives</p>
        </div>
        {isEditable && (
          <button
            onClick={handleAddOpen}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, business, mobile, GST..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-600 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="LEAD">LEAD</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-600 font-medium"
          >
            <option value="">All Customer Types</option>
            <option value="RETAIL">RETAIL</option>
            <option value="WHOLESALE">WHOLESALE</option>
            <option value="DISTRIBUTOR">DISTRIBUTOR</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty states */}
      {loading && customers.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Customers Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search criteria or add your first business customer to begin CRM logging.
          </p>
          {isEditable && (
            <button
              onClick={handleAddOpen}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-4.5 w-4.5" /> Add Customer
            </button>
          )}
        </div>
      ) : (
        /* Data Table Grid */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Business Profile</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Follow-up Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/customers/${cust.id}`} className="font-bold text-slate-950 hover:text-indigo-600">
                        {cust.customerName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-slate-900">{cust.businessName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{cust.gstNumber || 'No GST Registered'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-slate-900">{cust.mobile}</span>
                      <span className="text-[10px] text-slate-400">{cust.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        cust.customerType === 'DISTRIBUTOR'
                          ? 'bg-purple-100 text-purple-800'
                          : cust.customerType === 'WHOLESALE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {cust.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        cust.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cust.status === 'LEAD'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {cust.followUpDate ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          {new Date(cust.followUpDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        </div>
                      ) : (
                        <span className="text-slate-300">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/customers/${cust.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="View details & timeline"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isEditable && (
                          <button
                            onClick={() => handleEditOpen(cust)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Edit profile"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(cust.id, cust.customerName)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-800">{customers.length}</span> of <span className="font-bold text-slate-800">{total}</span> customers</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Previous
              </button>
              <span className="px-3 font-semibold text-slate-800">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Form Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between smooth-transition">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingCustomer ? 'Modify Customer Profile' : 'Register New Customer'}
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
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}

              {/* Form Input fields */}
              <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
                {/* Customer name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer / Client Name *
                  </label>
                  <input
                    type="text"
                    {...register('customerName')}
                    className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                      errors.customerName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.customerName.message}</p>
                  )}
                </div>

                {/* Business name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    {...register('businessName')}
                    className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${
                      errors.businessName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="9876543210"
                        {...register('mobile')}
                        className={`block w-full rounded-xl border pl-8 pr-3 py-2 text-xs outline-none transition-all ${
                          errors.mobile ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                    {errors.mobile && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.mobile.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="client@acme.com"
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Customer type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Customer Type *
                    </label>
                    <select
                      {...register('customerType')}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                    >
                      <option value="RETAIL">RETAIL</option>
                      <option value="WHOLESALE">WHOLESALE</option>
                      <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Relationship Status
                    </label>
                    <select
                      {...register('status')}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                    >
                      <option value="LEAD">LEAD (Prospect)</option>
                      <option value="ACTIVE">ACTIVE (Client)</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* GST */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      placeholder="27AAAAA1111A1Z5"
                      {...register('gstNumber')}
                      className={`block w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all uppercase placeholder:normal-case ${
                        errors.gstNumber ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.gstNumber && (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">{errors.gstNumber.message}</p>
                    )}
                  </div>

                  {/* Next Followup */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Next CRM Follow-up Date
                    </label>
                    <input
                      type="date"
                      {...register('followUpDate')}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Business Address
                  </label>
                  <textarea
                    rows={2}
                    {...register('address')}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all custom-scrollbar resize-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Relationship Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter customer notes, background details, terms..."
                    {...register('notes')}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all custom-scrollbar resize-none"
                  />
                </div>

                {/* Submit button bar */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingCustomer ? 'Update Profile' : 'Add Customer'}
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
