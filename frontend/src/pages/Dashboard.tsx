import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  Loader2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

interface DashboardStats {
  customers: { total: number; active: number; lead: number; inactive: number };
  products: { total: number; totalStockUnits: number; lowStock: number; outOfStock: number };
  challans: { total: number; draft: number; confirmed: number; cancelled: number };
  stockMovements: { totalStockIn: number; totalStockOut: number };
  recentChallans: any[];
  recentMovements: any[];
  lowStockList: any[];
  followUps: {
    overdue: any[];
    today: any[];
    upcoming: any[];
  };
  charts: {
    monthlyChallans: any[];
  };
}

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <p className="font-bold">{error || 'An unexpected error occurred'}</p>
      </div>
    );
  }

  // Pre-process charts data
  const challanStatusData = [
    { name: 'Draft', value: stats.challans.draft, color: '#f59e0b' },
    { name: 'Confirmed', value: stats.challans.confirmed, color: '#10b981' },
    { name: 'Cancelled', value: stats.challans.cancelled, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden border border-slate-800/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-violet-500/10 rounded-full blur-[50px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
              Control Panel
            </span>
            <h3 className="text-2xl font-black tracking-tight md:text-3xl">Welcome Back, {currentUser?.name}!</h3>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              System Operations Portal is active. You are signed in as <span className="text-indigo-300 font-extrabold uppercase tracking-wide">{role}</span>. Review real-time inventory adjustments and CRM updates below.
            </p>
          </div>
          <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
              {new Date().toLocaleDateString([], { day: '2-digit' })}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">{new Date().toLocaleDateString([], { weekday: 'long' })}</p>
              <p className="text-sm font-bold">{new Date().toLocaleDateString([], { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Customers CRM (Only visible if not WAREHOUSE) */}
        {role !== 'WAREHOUSE' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-indigo-150 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Customers</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{stats.customers.total}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                <span className="text-emerald-500 font-bold">{stats.customers.active}</span> Active |{' '}
                <span className="text-amber-500 font-bold">{stats.customers.lead}</span> Leads
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3.5 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Card 2: Products Catalog */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-violet-150 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Products Catalog</span>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.products.total}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              <span className="text-slate-700 font-bold">{stats.products.totalStockUnits}</span> Total Stock Units
            </p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3.5 text-violet-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Stock Status Warnings */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-red-150 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock Warnings</span>
            <h3 className="text-3xl font-extrabold text-slate-800">
              {stats.products.lowStock + stats.products.outOfStock}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              <span className="text-red-500 font-bold">{stats.products.outOfStock}</span> Out |{' '}
              <span className="text-amber-500 font-bold">{stats.products.lowStock}</span> Low
            </p>
          </div>
          <div className="rounded-xl bg-red-50 p-3.5 text-red-600">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Sales Challans (Only visible if not WAREHOUSE) */}
        {role !== 'WAREHOUSE' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-emerald-150 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sales Challans</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{stats.challans.total}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                <span className="text-emerald-500 font-bold">{stats.challans.confirmed}</span> Confirmed |{' '}
                <span className="text-amber-500 font-bold">{stats.challans.draft}</span> Drafts
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3.5 text-emerald-600">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Warehouse Alternative Card 4: Stock Flow (Only visible to WAREHOUSE) */}
        {role === 'WAREHOUSE' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 hover:shadow-md hover:border-emerald-150 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stock Movements Flow</span>
              <h3 className="text-2xl font-extrabold text-slate-800">Ledger Flow</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                <span className="text-emerald-500 font-bold">+{stats.stockMovements.totalStockIn}</span> IN |{' '}
                <span className="text-red-500 font-bold">-{stats.stockMovements.totalStockOut}</span> OUT
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3.5 text-emerald-600">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      {/* Main Charts & Analytics Block */}
      {role !== 'WAREHOUSE' && stats.charts.monthlyChallans.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chart 1: Monthly Challan Quantity Trends */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <h4 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">
              Challan Flow Trends (Quantity Units)
            </h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.monthlyChallans}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar name="Confirmed Qty" dataKey="confirmedQuantity" fill="#4f6d9e" radius={[4, 4, 0, 0]} />
                  <Bar name="Draft Qty" dataKey="draftQuantity" fill="#c8d1e2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Challan Status Division */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Challan Statuses
            </h4>
            <div className="h-56 relative flex items-center justify-center">
              {challanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={challanStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {challanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs font-semibold text-slate-400">No Challans Registered</div>
              )}
            </div>
            {/* Legend indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold border-t border-slate-50 pt-4">
              <div>
                <span className="block text-amber-500">{stats.challans.draft}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Draft</span>
              </div>
              <div>
                <span className="block text-emerald-500">{stats.challans.confirmed}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Confirmed</span>
              </div>
              <div>
                <span className="block text-red-500">{stats.challans.cancelled}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM Actions & Inventory Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CRM Column: Customer follow ups (hides from Warehouse) */}
        {role !== 'WAREHOUSE' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Follow-ups Panel (CRM)
              </h4>
              <Link
                to="/customers"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Go to CRM <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {/* Overdue */}
              {stats.followUps.overdue.length > 0 && (
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                    Overdue Follow-ups
                  </span>
                  <div className="divide-y divide-slate-100">
                    {stats.followUps.overdue.map((f) => (
                      <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{f.customerName}</p>
                          <span className="text-slate-400">{f.businessName}</span>
                        </div>
                        <div className="text-right text-red-600 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(f.followUpDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {stats.followUps.today.length > 0 && (
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                    Today's Follow-ups
                  </span>
                  <div className="divide-y divide-slate-100">
                    {stats.followUps.today.map((f) => (
                      <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{f.customerName}</p>
                          <span className="text-slate-400">{f.businessName}</span>
                        </div>
                        <div className="text-right text-indigo-600 font-semibold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          Today
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {stats.followUps.upcoming.length > 0 && (
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    Upcoming Follow-ups
                  </span>
                  <div className="divide-y divide-slate-100">
                    {stats.followUps.upcoming.map((f) => (
                      <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{f.customerName}</p>
                          <span className="text-slate-400">{f.businessName}</span>
                        </div>
                        <div className="text-right text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(f.followUpDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.followUps.overdue.length === 0 &&
                stats.followUps.today.length === 0 &&
                stats.followUps.upcoming.length === 0 && (
                  <div className="text-center py-8 text-xs font-semibold text-slate-400">
                    No follow-ups scheduled in CRM.
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Low Stock warnings list */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Low Stock Warnings
            </h4>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Adjust Stock <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {stats.lowStockList.map((p) => (
              <div key={p.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50 text-xs">
                <div>
                  <p className="font-bold text-slate-800">{p.productName}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.currentStock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.currentStock === 0 ? 'Out of Stock' : `${p.currentStock} Units`}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Min: {p.minimumStock}</p>
                </div>
              </div>
            ))}

            {stats.lowStockList.length === 0 && (
              <div className="text-center py-10 text-xs font-semibold text-slate-400">
                All inventory products satisfy minimum stocks!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Lists (Double Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Recent Challans (Hides from Warehouse) */}
        {role !== 'WAREHOUSE' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Recent Sales Challans
            </h4>
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 custom-scrollbar">
              {stats.recentChallans.map((ch) => (
                <div key={ch.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <Link to={`/challans/${ch.id}`} className="font-bold text-indigo-600 hover:text-indigo-700">
                      {ch.challanNumber}
                    </Link>
                    <p className="text-slate-500 mt-0.5">{ch.customer.customerName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      ch.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ch.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ch.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Qty: {ch.totalQuantity}</p>
                  </div>
                </div>
              ))}
              {stats.recentChallans.length === 0 && (
                <div className="text-center py-10 text-xs font-semibold text-slate-400">
                  No challans recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Recent Stock Movements (Hides from Sales, Accounts) */}
        {role !== 'SALES' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 lg:col-span-1">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Recent Inventory Ledger Movements
            </h4>
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 custom-scrollbar pr-1">
              {stats.recentMovements.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{m.product.productName}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{m.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${
                      m.movementType === 'IN' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">
                      {new Date(m.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentMovements.length === 0 && (
                <div className="text-center py-10 text-xs font-semibold text-slate-400">
                  No stock movements recorded.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
