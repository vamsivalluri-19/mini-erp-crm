import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const StockMovements: React.FC = () => {

  // Ledger state
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [movementType, setMovementType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 12 };
      if (movementType) params.movementType = movementType;

      const response = await api.get('/stock/movements', { params });
      if (response.data.success) {
        setMovements(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stock movements ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [movementType, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800">Stock Movements Ledger</h3>
        <p className="text-xs text-slate-400">Chronological history log of all warehouse intake and sales dispatch actions</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200/60 p-4 text-xs text-red-800">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Filter by Direction
          </label>
          <select
            value={movementType}
            onChange={(e) => { setMovementType(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-600 font-semibold"
          >
            <option value="">All Directions (IN & OUT)</option>
            <option value="IN">IN (Warehouse intake / returns)</option>
            <option value="OUT">OUT (Sales dispatch / adjustments)</option>
          </select>
        </div>
      </div>

      {/* List content */}
      {loading && movements.length === 0 ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <ArrowLeftRight className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Stock Movements Logged</h4>
          <p className="text-xs text-slate-400 mt-1">
            Incoming purchase deliveries and confirmed challans will log historical movements here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4">Transaction Date</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4 font-mono">SKU</th>
                  <th className="px-6 py-4 text-center">Direction</th>
                  <th className="px-6 py-4 text-right">Qty units</th>
                  <th className="px-6 py-4">Reason / Narration</th>
                  <th className="px-6 py-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {movements.map((m) => {
                  const isIn = m.movementType === 'IN';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(m.createdAt).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-900 leading-tight">
                          {m.product.productName}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{m.product.category}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{m.product.sku}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isIn ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Intake IN
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="h-3 w-3" /> Dispatch OUT
                            </>
                          )}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-extrabold ${isIn ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIn ? '+' : '-'}{m.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-normal leading-relaxed">
                        {m.reason}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="block font-bold text-slate-800">{m.creator.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{m.creator.email}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <span className="font-bold text-slate-800">{movements.length}</span> of <span className="font-bold text-slate-800">{total}</span> records</span>
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
