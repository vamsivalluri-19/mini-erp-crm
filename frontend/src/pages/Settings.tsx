import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, Info, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800">System Configuration</h3>
        <p className="text-xs text-slate-400">Manage portal preferences, credentials connection strings, and environments</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Account specs */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 md:col-span-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Your Operator Profile
          </h4>
          <div className="space-y-3 font-semibold text-slate-700">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Operator Name</span>
              <span className="text-sm font-bold text-slate-900">{currentUser?.name}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Operator Email</span>
              <span>{currentUser?.email}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Security Role</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100/30 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase mt-1">
                <Shield className="h-3 w-3" />
                {currentUser?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Server & Database configs */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Environment & Connection Strings
          </h4>

          <div className="divide-y divide-slate-100">
            {/* Database URL */}
            <div className="py-3 flex items-start justify-between gap-4 font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <div>
                  <span>Database Link Connection</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Active postgres credentials URL</span>
                </div>
              </div>
              <span className="font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 truncate max-w-xs">
                postgresql://neondb_owner:••••••••@ep-round-block-axr8s3l0.us-east-2.neon.tech
              </span>
            </div>

            {/* Server Port */}
            <div className="py-3 flex items-start justify-between gap-4 font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <div>
                  <span>Node App Port</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Server runtime listener port</span>
                </div>
              </div>
              <span className="font-mono text-slate-700 font-bold bg-slate-50 border border-slate-100 rounded-lg px-3 py-1">
                5000
              </span>
            </div>

            {/* Environment Status */}
            <div className="py-3 flex items-start justify-between gap-4 font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <div>
                  <span>Portal Build Mode</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Environment development state</span>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                development
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
