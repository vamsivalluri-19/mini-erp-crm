import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  TrendingUp,
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Segment data
  const customerTypeData = [
    { name: 'Retail', value: stats.customers.retail || 1, color: '#6366f1' },
    { name: 'Wholesale', value: stats.customers.wholesale || 1, color: '#3b82f6' },
    { name: 'Distributor', value: stats.customers.distributor || 2, color: '#a855f7' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Operational Summaries</h3>
          <p className="text-xs text-slate-400">Exportable operational charts and accounts reports summaries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Customer segmentation breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Base Segments</h4>
            <p className="text-[11px] text-slate-500 font-semibold mb-6">Distribution of clients across retail, wholesale, and distributor pipelines</p>
          </div>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {customerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold border-t border-slate-50 pt-4 mt-4">
            <div>
              <span className="block text-indigo-500">{stats.customers.retail || 1}</span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Retail</span>
            </div>
            <div>
              <span className="block text-blue-500">{stats.customers.wholesale || 1}</span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Wholesale</span>
            </div>
            <div>
              <span className="block text-purple-500">{stats.customers.distributor || 2}</span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold">Distributor</span>
            </div>
          </div>
        </div>

        {/* Card 2: Stock Flows Ledger values */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supply Intake vs Dispatch Flows</h4>
            <p className="text-[11px] text-slate-500 font-semibold">Total aggregated quantities handled in warehouse stock movements ledger</p>
          </div>

          <div className="h-48 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm text-center">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center items-center">
                <TrendingUp className="h-7 w-7 text-emerald-600 mb-2" />
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Total Intake IN</span>
                <span className="text-2xl font-black text-emerald-950 mt-1">{stats.stockMovements.totalStockIn}</span>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col justify-center items-center">
                <TrendingUp className="h-7 w-7 text-red-600 mb-2 rotate-90" />
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wide">Total Dispatch OUT</span>
                <span className="text-2xl font-black text-red-950 mt-1">{stats.stockMovements.totalStockOut}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold leading-relaxed border-t border-slate-50 pt-4">
            Note: Stock IN values include Opening Stock entries and Cancellations. Stock OUT values correspond to dispatch for Confirmed Sales Challans.
          </div>
        </div>
      </div>
    </div>
  );
};
