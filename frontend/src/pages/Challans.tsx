import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Calendar,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Challans: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const navigate = useNavigate();
  const isSales = role === 'ADMIN' || role === 'SALES';

  // State
  const [challans, setChallans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 8 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customerId = customerFilter;

      const response = await api.get('/challans', { params });
      if (response.data.success) {
        setChallans(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sales challans ledger.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const response = await api.get('/customers', { params: { limit: 100 } });
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers for filtering', err);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchChallans();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, customerFilter, page]);

  useEffect(() => {
    fetchCustomersList();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Sales Challans</h3>
          <p className="text-xs text-slate-400">View customer invoice receipts, drafts, and dispatch logs</p>
        </div>
        {isSales && (
          <button
            onClick={() => navigate('/challans/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Challan
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Filters panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by challan number, customer name..."
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
            <option value="DRAFT">DRAFT (Stock Reserved)</option>
            <option value="CONFIRMED">CONFIRMED (Stock Deducted)</option>
            <option value="CANCELLED">CANCELLED (Stock Restored)</option>
          </select>
        </div>

        {/* Customer Filter */}
        <div>
          <select
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-600 font-medium"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerName} ({c.businessName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid list content */}
      {loading && challans.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : challans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Challans Logged</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search criteria or register a new delivery/sales challan.
          </p>
          {isSales && (
            <button
              onClick={() => navigate('/challans/new')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-4.5 w-4.5" /> Create Challan
            </button>
          )}
        </div>
      ) : (
        /* Data grid ledger */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4">Challan Number</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4 text-center">Items Qty</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/challans/${ch.id}`} className="font-extrabold text-indigo-600 hover:text-indigo-700">
                        {ch.challanNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-900 leading-tight">
                        {ch.customer.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{ch.customer.businessName}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {ch.totalQuantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        ch.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ch.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(ch.createdAt).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="block font-bold text-slate-800">{ch.creator.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/challans/${ch.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="View Challan details"
                      >
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-800">{challans.length}</span> of <span className="font-bold text-slate-800">{total}</span> challans</span>
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
    </div>
  );
};
