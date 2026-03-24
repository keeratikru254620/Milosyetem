import type { FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../services/api';
import { showToast } from '../services/toastService';
import type { AuthMode, User } from '../types';
import { APP_LOGO_FALLBACK, APP_LOGO_SRC } from '../utils/assets';

interface AuthViewProps {
  initialMode?: AuthMode;
  onLogin: (user: User) => Promise<void> | void;
}

export default function AuthView({ initialMode = 'login', onLogin }: AuthViewProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'admin' | 'general'>('admin');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.login(loginUsername, loginPassword);
      await onLogin(result.user);
      showToast('à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
    } catch {
      showToast('à¸­à¸µà¹€à¸¡à¸¥/Username à¸«à¸£à¸·à¸­à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!termsAccepted) {
      showToast('à¸à¸£à¸¸à¸“à¸²à¸¢à¸­à¸¡à¸£à¸±à¸šà¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸šà¸£à¸´à¸à¸²à¸£', 'error');
      return;
    }

    if (registerPassword.length < 4) {
      showToast('à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¸•à¹‰à¸­à¸‡à¸¡à¸µà¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢ 4 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.register({
        username: registerEmail,
        password: registerPassword,
        name: `${registerFirstName} ${registerLastName}`.trim(),
        role: registerRole,
        phone: registerPhone,
        email: registerEmail,
      });
      await onLogin(result.user);
      showToast('à¸¥à¸‡à¸—à¸°à¹€à¸šà¸µà¸¢à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
    } catch {
      showToast('à¸¡à¸µà¸­à¸µà¹€à¸¡à¸¥à¸™à¸µà¹‰à¸­à¸¢à¸¹à¹ˆà¹ƒà¸™à¸£à¸°à¸šà¸šà¹à¸¥à¹‰à¸§', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!forgotUsername.trim()) {
      showToast('à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸­à¸µà¹€à¸¡à¸¥à¸«à¸£à¸·à¸­ Username à¸‚à¸­à¸‡à¸„à¸¸à¸“', 'error');
      return;
    }

    showToast('à¸£à¸°à¸šà¸šà¹„à¸”à¹‰à¸ªà¹ˆà¸‡à¸„à¸³à¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™à¹„à¸›à¸¢à¸±à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸£à¸°à¸šà¸¸à¹à¸¥à¹‰à¸§', 'info');
    setForgotUsername('');
    navigate('/login');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white font-sans dark:bg-[#0B1120]">
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-200/25 blur-[120px] animate-pulse dark:bg-blue-900/30"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-amber-200/25 blur-[120px] animate-pulse dark:bg-amber-500/20"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="relative z-10 flex w-[90%] max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.12)] animate-slide-blur dark:border-white/10 dark:bg-slate-900/95">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
            <div className="flex flex-col items-center">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-900 dark:text-amber-500" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                à¸à¸³à¸¥à¸±à¸‡à¸›à¸£à¸°à¸¡à¸§à¸¥à¸œà¸¥...
              </p>
            </div>
          </div>
        )}

        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden border-r border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/90 p-12 text-center text-slate-900 lg:flex">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05]"></div>
          <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/45 blur-3xl"></div>
          <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200/35 blur-3xl"></div>
          <div className="pointer-events-none absolute left-1/2 top-28 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-200/25 blur-2xl"></div>

          <div className="relative z-10 flex animate-float flex-col items-center">
            <div className="relative mb-10 flex h-60 w-60 items-center justify-center">
              <div className="absolute -inset-6 rounded-[3rem] bg-blue-200/30 blur-3xl"></div>
              <div className="absolute inset-6 rounded-full bg-amber-200/28 blur-2xl"></div>
            <img
              alt="à¹‚à¸¥à¹‚à¸à¹‰ à¸šà¸.à¸ªà¸­à¸—.1"
              className="relative h-[12.25rem] w-[12.25rem] scale-[1.02] object-contain brightness-[1.08] contrast-[1.16] saturate-105 drop-shadow-[0_18px_32px_rgba(15,23,42,0.22)]"
              onError={(event) => {
                const target = event.currentTarget;
                target.onerror = null;
                target.src = APP_LOGO_FALLBACK;
              }}
              src={APP_LOGO_SRC}
            />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
              à¸£à¸°à¸šà¸šà¸ˆà¸±à¸”à¹€à¸à¹‡à¸šà¹€à¸­à¸à¸ªà¸²à¸£à¸£à¸²à¸Šà¸à¸²à¸£
            </h1>
            <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
              à¸ªà¸³à¸«à¸£à¸±à¸šà¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸£à¸²à¸Šà¸à¸²à¸£à¹à¸¥à¸°à¸ªà¸–à¸²à¸™à¸¨à¸¶à¸à¸©à¸²
            </p>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Â© 2026 Gov-Doc Pro
          </div>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:p-12 lg:w-1/2">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login'
                ? 'à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š'
                : authMode === 'register'
                  ? 'à¸ªà¸¡à¸±à¸„à¸£à¸ªà¸¡à¸²à¸Šà¸´à¸'
                  : 'à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login'
                ? 'à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¸”à¹‰à¸§à¸¢à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¹à¸šà¸šà¹€à¸‚à¹‰à¸²à¸£à¸«à¸±à¸ªà¸—à¸µà¹ˆà¸›à¸¥à¸­à¸”à¸ à¸±à¸¢'
                : authMode === 'register'
                  ? 'à¸ªà¸£à¹‰à¸²à¸‡à¸šà¸±à¸à¸Šà¸µà¹€à¸žà¸·à¹ˆà¸­à¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸­à¸à¸ªà¸²à¸£'
                  : 'à¸à¸£à¸­à¸à¸­à¸µà¹€à¸¡à¸¥à¸«à¸£à¸·à¸­ Username à¹€à¸žà¸·à¹ˆà¸­à¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™'}
            </p>
          </div>

          {authMode === 'login' && (
            <form className="space-y-5 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleLogin}>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  à¸­à¸µà¹€à¸¡à¸¥ à¸«à¸£à¸·à¸­ Username
                </label>
                <div className="group relative">
                  <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-mono text-sm shadow-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setLoginUsername(event.target.value)}
                    required
                    type="text"
                    value={loginUsername}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™
                </label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 font-mono text-sm shadow-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                  />
                  <button
                    className="absolute right-4 top-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  className="text-xs font-bold text-blue-900 transition-colors hover:underline dark:text-amber-500 dark:hover:text-amber-400"
                  onClick={() => navigate('/forgot-password')}
                  type="button"
                >
                  à¸¥à¸·à¸¡à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™?
                </button>
              </div>
              <button
                className="mt-4 w-full rounded-xl border border-blue-800 bg-blue-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95 disabled:opacity-50"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'à¸à¸³à¸¥à¸±à¸‡à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š...' : 'à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š'}
              </button>
              <p className="mt-6 border-t border-slate-200 pt-6 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸±à¸à¸Šà¸µà¹ƒà¸Šà¹ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?{' '}
                <button
                  className="ml-1 font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => {
                    setRegisterRole('admin');
                    navigate('/register');
                  }}
                  type="button"
                >
                  à¸ªà¸¡à¸±à¸„à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™
                </button>
              </p>
            </form>
          )}

          {authMode === 'register' && (
            <form className="space-y-4 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    à¸Šà¸·à¹ˆà¸­
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setRegisterFirstName(event.target.value)}
                    required
                    type="text"
                    value={registerFirstName}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setRegisterLastName(event.target.value)}
                    required
                    type="text"
                    value={registerLastName}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  à¹€à¸šà¸­à¸£à¹Œà¸¡à¸·à¸­à¸–à¸·à¸­
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                  onChange={(event) => setRegisterPhone(event.target.value)}
                  required
                  type="tel"
                  value={registerPhone}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  à¸­à¸µà¹€à¸¡à¸¥
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                  type="email"
                  value={registerEmail}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™ (à¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³ 4 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£)
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-10 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    minLength={4}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                  />
                  <button
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  à¸›à¸£à¸°à¹€à¸ à¸—à¸šà¸±à¸à¸Šà¸µ
                </label>
                <select
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                  onChange={(event) =>
                    setRegisterRole(event.target.value as 'admin' | 'general')
                  }
                  value={registerRole}
                >
                  <option value="general">à¸šà¸¸à¸„à¸„à¸¥à¸—à¸±à¹ˆà¸§à¹„à¸›</option>
                  <option value="admin">à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¸•à¸³à¸£à¸§à¸ˆ (Admin)</option>
                </select>
              </div>

              <div className="mb-2 mt-2 flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    checked={termsAccepted}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100 text-blue-900 focus:ring-blue-900"
                    id="terms"
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    type="checkbox"
                  />
                </div>
                <label className="ml-2 text-xs text-slate-600 dark:text-slate-400" htmlFor="terms">
                  à¸¢à¸­à¸¡à¸£à¸±à¸š{' '}
                  <a className="font-bold text-blue-900 hover:underline dark:text-amber-500" href="#">
                    à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸šà¸£à¸´à¸à¸²à¸£
                  </a>{' '}
                  à¹à¸¥à¸°{' '}
                  <a className="font-bold text-blue-900 hover:underline dark:text-amber-500" href="#">
                    à¸™à¹‚à¸¢à¸šà¸²à¸¢à¸„à¸§à¸²à¸¡à¹€à¸›à¹‡à¸™à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§
                  </a>
                </label>
              </div>

              <button
                className="mt-2 w-full rounded-lg border border-blue-800 bg-blue-900 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95 disabled:opacity-50"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'à¸à¸³à¸¥à¸±à¸‡à¸›à¸£à¸°à¸¡à¸§à¸¥à¸œà¸¥...' : 'à¸¢à¸·à¸™à¸¢à¸±à¸™'}
              </button>
              <p className="mt-6 border-t border-slate-200 pt-6 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                à¸¡à¸µà¸šà¸±à¸à¸Šà¸µà¸­à¸¢à¸¹à¹ˆà¹à¸¥à¹‰à¸§?{' '}
                <button
                  className="ml-1 font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  à¸à¸¥à¸±à¸šà¹„à¸›à¸«à¸™à¹‰à¸²à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š
                </button>
              </p>
            </form>
          )}

          {authMode === 'forgot' && (
            <form className="space-y-5 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleForgotPassword}>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  à¸­à¸µà¹€à¸¡à¸¥ à¸«à¸£à¸·à¸­ Username
                </label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 font-mono text-sm shadow-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setForgotUsername(event.target.value)}
                    required
                    type="text"
                    value={forgotUsername}
                  />
                </div>
              </div>
              <button
                className="mt-4 w-full rounded-xl border border-blue-800 bg-blue-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95"
                type="submit"
              >
                à¸ªà¹ˆà¸‡à¸„à¸³à¸‚à¸­à¸£à¸µà¹€à¸‹à¹‡à¸•à¸£à¸«à¸±à¸ªà¸œà¹ˆà¸²à¸™
              </button>
              <p className="mt-8 border-t border-slate-200 pt-8 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                <button
                  className="font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  à¸à¸¥à¸±à¸šà¹„à¸›à¸«à¸™à¹‰à¸²à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}




