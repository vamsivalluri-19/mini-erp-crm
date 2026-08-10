import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users as CustomersIcon,
  ShoppingBag,
  Boxes,
  ArrowLeftRight,
  FileSpreadsheet,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const role = currentUser?.role;

  // Define nav links with roles
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customers (CRM)',
      path: '/customers',
      icon: CustomersIcon,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
    },
    {
      name: 'Products Catalog',
      path: '/products',
      icon: ShoppingBag,
      roles: ['ADMIN', 'WAREHOUSE'],
    },
    {
      name: 'Inventory Stocks',
      path: '/inventory',
      icon: Boxes,
      roles: ['ADMIN', 'WAREHOUSE'],
    },
    {
      name: 'Stock Movements',
      path: '/stock-movements',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'WAREHOUSE'],
    },
    {
      name: 'Sales Challans',
      path: '/challans',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
    },
    {
      name: 'User Accounts',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'ACCOUNTS'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      roles: ['ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => role && item.roles.includes(role));

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-slate-900 text-slate-300 smooth-transition lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-md shadow-indigo-600/30">
              OF
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">OpsFlow ERP</h1>
              <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Portal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-800 lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full font-bold shadow-sm ${
              role === 'ADMIN'
                ? 'bg-purple-950/60 border border-purple-500/30 text-purple-400'
                : role === 'SALES'
                ? 'bg-blue-950/60 border border-blue-500/30 text-blue-400'
                : role === 'WAREHOUSE'
                ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
            }`}>
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{currentUser?.name}</h4>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                role === 'ADMIN'
                  ? 'bg-purple-900/30 text-purple-450 border-purple-500/25'
                  : role === 'SALES'
                  ? 'bg-blue-900/30 text-blue-450 border-blue-500/25'
                  : role === 'WAREHOUSE'
                  ? 'bg-amber-900/30 text-amber-450 border-amber-500/25'
                  : 'bg-emerald-900/30 text-emerald-450 border-emerald-500/25'
              }`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
