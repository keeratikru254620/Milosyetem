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
import { getErrorMessage } from '../utils/auth';
import { APP_LOGO_FALLBACK, APP_LOGO_SRC } from '../utils/assets';

interface AuthViewProps {
  initialMode?: AuthMode;
  onLogin: (user: User) => Promise<void> | void;
}

export default function AuthView({ initialMode = 'login', onLogin }: AuthViewProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
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
      const result = await api.login(loginEmail, loginPassword);
      await onLogin(result.user);
      showToast('เข้าสู่ระบบสำเร็จ');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          invalidCredentialsMessage: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          emailNotVerifiedMessage: 'กรุณายืนยันอีเมลจากกล่องจดหมายก่อนเข้าสู่ระบบ',
          disabledAccountMessage: 'บัญชีนี้ถูกปิดการใช้งานแล้ว',
          fallbackMessage: 'เข้าสู่ระบบไม่สำเร็จ',
        }),
        'error',
      );
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
      showToast('กรุณายอมรับเงื่อนไขการใช้บริการ', 'error');
      return;
    }

    if (registerPassword.length < 6) {
      showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        username: registerEmail,
        password: registerPassword,
        name: `${registerFirstName} ${registerLastName}`.trim(),
        role: 'general',
        phone: registerPhone,
        email: registerEmail,
      });
      showToast('สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ', 'success');
      navigate('/login');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          duplicateMessage: 'มีอีเมลนี้อยู่ในระบบแล้ว',
          fallbackMessage: 'ไม่สามารถสมัครสมาชิกได้',
        }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!forgotEmail.trim()) {
      showToast('กรุณากรอกอีเมลที่ใช้เข้าสู่ระบบ', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await api.requestPasswordReset(forgotEmail.trim());
      showToast('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว', 'success');
      setForgotEmail('');
      navigate('/login');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          fallbackMessage: 'ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้',
        }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
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
                กำลังประมวลผล...
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
            <div className="relative mb-12 flex h-72 w-72 items-center justify-center">
              <div className="absolute inset-3 rounded-[2.75rem] bg-blue-200/40 blur-3xl"></div>
              <div className="absolute inset-10 rounded-full bg-amber-200/30 blur-3xl"></div>
              <img
                alt="โลโก้ บก.สอท.1"
                className="relative h-[14rem] w-[14rem] scale-[1.03] object-contain brightness-[1.08] contrast-[1.16] saturate-105 drop-shadow-[0_24px_40px_rgba(15,23,42,0.25)]"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = APP_LOGO_FALLBACK;
                }}
                src={APP_LOGO_SRC}
              />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
              ระบบจัดเก็บเอกสารราชการ
            </h1>
            <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
              สำหรับหน่วยงานราชการและสถานศึกษา
            </p>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            © 2026 Gov-Doc Pro
          </div>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:p-12 lg:w-1/2">
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="relative rounded-[2rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
              <div className="absolute inset-2 rounded-[1.5rem] bg-blue-100/50 blur-2xl"></div>
              <img
                alt="logo"
                className="relative h-28 w-28 object-contain drop-shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = APP_LOGO_FALLBACK;
                }}
                src={APP_LOGO_SRC}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login'
                ? 'เข้าสู่ระบบ'
                : authMode === 'register'
                  ? 'สมัครสมาชิก'
                  : 'ลืมรหัสผ่าน'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login'
                ? 'เข้าสู่ระบบด้วยการเชื่อมต่อแบบเข้ารหัสที่ปลอดภัย'
                : authMode === 'register'
                  ? 'สร้างบัญชีเพื่อเข้าถึงข้อมูลเอกสาร'
                  : 'กรอกอีเมลเพื่อขอรีเซ็ตรหัสผ่าน'}
            </p>
          </div>

          {authMode === 'login' && (
            <form className="space-y-5 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleLogin}>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  อีเมล
                </label>
                <div className="group relative">
                  <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-mono text-sm shadow-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                    type="text"
                    value={loginEmail}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  รหัสผ่าน
                </label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    autoComplete="current-password"
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
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <button
                className="mt-4 w-full rounded-xl border border-blue-800 bg-blue-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95 disabled:opacity-50"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
              <p className="mt-6 border-t border-slate-200 pt-6 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                ยังไม่มีบัญชีใช่หรือไม่?{' '}
                <button
                  className="ml-1 font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => navigate('/register')}
                  type="button"
                >
                  สมัครใช้งาน
                </button>
              </p>
            </form>
          )}

          {authMode === 'register' && (
            <form className="space-y-4 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    ชื่อ
                  </label>
                  <input
                    autoComplete="given-name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setRegisterFirstName(event.target.value)}
                    required
                    type="text"
                    value={registerFirstName}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    นามสกุล
                  </label>
                  <input
                    autoComplete="family-name"
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
                  เบอร์มือถือ
                </label>
                <input
                  autoComplete="tel"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                  onChange={(event) => setRegisterPhone(event.target.value)}
                  required
                  type="tel"
                  value={registerPhone}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  อีเมล
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                  type="email"
                  value={registerEmail}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-10 font-mono text-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    minLength={6}
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
                  ประเภทบัญชี
                </label>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-100">
                  บัญชีที่สมัครจากหน้าเว็บไซต์จะถูกสร้างเป็นผู้ใช้งานทั่วไป และสามารถกำหนดสิทธิ์เพิ่มเติมโดยผู้ดูแลระบบภายหลัง
                </div>
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
                  ยอมรับ{' '}
                  <button
                    className="font-bold text-blue-900 hover:underline dark:text-amber-500"
                    onClick={() => navigate('/terms')}
                    type="button"
                  >
                    เงื่อนไขการใช้บริการ
                  </button>{' '}
                  และ{' '}
                  <button
                    className="font-bold text-blue-900 hover:underline dark:text-amber-500"
                    onClick={() => navigate('/privacy')}
                    type="button"
                  >
                    นโยบายความเป็นส่วนตัว
                  </button>
                </label>
              </div>

              <button
                className="mt-2 w-full rounded-lg border border-blue-800 bg-blue-900 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95 disabled:opacity-50"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'กำลังประมวลผล...' : 'ยืนยัน'}
              </button>
              <p className="mt-6 border-t border-slate-200 pt-6 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                มีบัญชีอยู่แล้ว?{' '}
                <button
                  className="ml-1 font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}

          {authMode === 'forgot' && (
            <form className="space-y-5 animate-in zoom-in-95 fade-in duration-300" onSubmit={handleForgotPassword}>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  อีเมล
                </label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-900 dark:group-focus-within:text-amber-500" />
                  <input
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 font-mono text-sm shadow-sm outline-none transition-colors focus:border-blue-900 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-amber-500"
                    onChange={(event) => setForgotEmail(event.target.value)}
                    required
                    type="text"
                    value={forgotEmail}
                  />
                </div>
              </div>
              <button
                className="mt-4 w-full rounded-xl border border-blue-800 bg-blue-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-950 active:scale-95"
                type="submit"
              >
                ส่งคำขอรีเซ็ตรหัสผ่าน
              </button>
              <p className="mt-8 border-t border-slate-200 pt-8 text-center text-xs font-medium text-slate-500 dark:border-slate-800">
                <button
                  className="font-bold text-blue-900 hover:underline dark:text-amber-500"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
