import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInput = z.infer<typeof loginFormSchema>;

export const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
  });

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormInput) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100/50">
      {/* Left Column: Visual branding panels */}
      <div className="hidden w-1/2 bg-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
            OF
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">OpsFlow ERP</h1>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Operations & CRM Portal</p>
          </div>
        </div>

        <div className="max-w-md my-auto relative z-10">
          <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/25 mb-6">
            Wholesale & Distribution Solution
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Manage your supply chain and CRM in one portal.
          </h2>
          <p className="text-slate-400 leading-relaxed text-sm">
            Access analytics, track customers interactions, oversee product stock levels, register sales challans, and compile audits in real time.
          </p>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} OpsFlow ERP. All rights reserved.
        </div>
      </div>

      {/* Right Column: Authenticate inputs */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 sm:px-12 md:px-24 bg-white shadow-xl">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 lg:hidden mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
                OF
              </div>
              <span className="text-lg font-bold text-slate-800">OpsFlow ERP</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to your operational dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200/60 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@opsflow.com"
                  {...register('email')}
                  className={`block w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-400 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-indigo-600/35 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying account...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </button>
          </form>

          {/* Quick login credentials block */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Developer Quick Credentials
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@opsflow.com', 'Admin@123')}
                className="flex flex-col items-start rounded-lg border border-slate-200/80 p-2.5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">Admin Account</span>
                <span className="text-slate-500 truncate w-full">admin@opsflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sales@opsflow.com', 'Sales@123')}
                className="flex flex-col items-start rounded-lg border border-slate-200/80 p-2.5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">Sales Account</span>
                <span className="text-slate-500 truncate w-full">sales@opsflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse@opsflow.com', 'Warehouse@123')}
                className="flex flex-col items-start rounded-lg border border-slate-200/80 p-2.5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">Warehouse Account</span>
                <span className="text-slate-500 truncate w-full text-left">warehouse@opsflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('accounts@opsflow.com', 'Accounts@123')}
                className="flex flex-col items-start rounded-lg border border-slate-200/80 p-2.5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">Accounts Account</span>
                <span className="text-slate-500 truncate w-full text-left">accounts@opsflow.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
