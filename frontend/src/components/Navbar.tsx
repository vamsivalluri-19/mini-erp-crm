import React, { useState, useEffect, useRef } from 'react';
import { Menu, Calendar, Clock, Bell, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        const stats = response.data.data;
        setLowStockAlerts(stats.lowStockList || []);
        setOverdueFollowups(stats.followUps?.overdue || []);
      }
    } catch (err) {
      console.error('Failed to load navbar notifications stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStats();
      // Poll notifications stats every 30 seconds
      const pollTimer = setInterval(fetchStats, 30000);
      return () => clearInterval(pollTimer);
    }
  }, [currentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format path name for title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Analytics';
    
    if (path === '/customers') return 'Customer CRM Portal';
    if (path.startsWith('/customers/')) return 'Customer CRM Profile';
    
    if (path.startsWith('/products')) return 'Product Inventory Catalog';
    if (path.startsWith('/inventory')) return 'Warehouse Stocks Management';
    if (path.startsWith('/stock-movements')) return 'Stock Movements Ledger';
    
    if (path === '/challans') return 'Sales Challans Registry';
    if (path === '/challans/new') return 'New Sales Challan';
    if (path.startsWith('/challans/')) return 'Sales Challan Details';
    
    if (path.startsWith('/users')) return 'System User Accounts';
    if (path.startsWith('/reports')) return 'Operational Summaries & Reports';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'OpsFlow ERP Portal';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalAlerts = lowStockAlerts.length + overdueFollowups.length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-6 shadow-sm shadow-slate-100/50 sticky top-0 z-30">
      {/* Left side mobile burger & page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800 lg:text-xl font-sans tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right side widgets: Real Time, Date, Notifications, User Pill */}
      <div className="flex items-center gap-6">
        {/* Real-time Date and Clock */}
        <div className="hidden items-center gap-4 text-xs font-semibold text-slate-500 md:flex border-r border-slate-100 pr-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>{formatDate(time)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span className="font-mono text-slate-700">{formatTime(time)}</span>
          </div>
        </div>

        {/* Notifications Live Pill with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200 focus:outline-none"
            title="System Alert Notifications"
          >
            <Bell className="h-5 w-5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white animate-bounce shadow-sm">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white shadow-2xl p-4 text-xs animate-slideDown max-h-96 overflow-y-auto custom-scrollbar flex flex-col z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="font-bold text-slate-800 uppercase tracking-wide">System Notifications</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                  {totalAlerts} Active
                </span>
              </div>

              {loadingStats && totalAlerts === 0 && (
                <p className="text-center text-slate-400 py-6">Checking systems status...</p>
              )}

              <div className="space-y-3">
                {/* 1. Low Stock Notifications */}
                {lowStockAlerts.map((p) => (
                  <div key={p.id} className="flex gap-2.5 rounded-xl bg-amber-50/50 border border-amber-100 p-2.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-850">Stock warning: {p.productName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">SKU: {p.sku} | Quantity: {p.currentStock} units</p>
                      <Link
                        to="/inventory"
                        onClick={() => setShowNotifications(false)}
                        className="inline-block text-[10px] font-bold text-amber-700 hover:underline mt-1.5"
                      >
                        Adjust Stock Limit
                      </Link>
                    </div>
                  </div>
                ))}

                {/* 2. Overdue Followup Notifications */}
                {currentUser?.role !== 'WAREHOUSE' && overdueFollowups.map((f) => (
                  <div key={f.id} className="flex gap-2.5 rounded-xl bg-rose-50/50 border border-rose-100 p-2.5">
                    <MessageSquare className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-850">Overdue CRM: {f.customerName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{f.businessName}</p>
                      <Link
                        to={`/customers/${f.id}`}
                        onClick={() => setShowNotifications(false)}
                        className="inline-block text-[10px] font-bold text-rose-700 hover:underline mt-1.5"
                      >
                        Log Followup Note
                      </Link>
                    </div>
                  </div>
                ))}

                {totalAlerts === 0 && (
                  <div className="text-center py-8 text-slate-400 font-semibold flex flex-col items-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-emerald-500/70" />
                    <span>No critical inventory alerts or overdue follow-ups reported.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile capsule */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-3 pr-2">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.name}</p>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
              {currentUser?.role}
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-bold text-indigo-700">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
