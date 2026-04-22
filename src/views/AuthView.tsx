import type { FormEvent, ReactNode } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../services/api';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { showToast } from '../services/toastService';
import type { AuthMode, User } from '../types';
import { getErrorMessage } from '../utils/auth';
import { APP_LOGO_FALLBACK, APP_LOGO_SRC } from '../utils/assets';

interface AuthViewProps {
  initialMode?: AuthMode;
  onLogin: (user: User) => Promise<void> | void;
}

interface AuthInputProps {
  autoComplete?: string;
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rightSlot?: ReactNode;
  type?: string;
  value: string;
}

function AuthInput({
  autoComplete,
  icon,
  label,
  onChange,
  placeholder,
  required = true,
  rightSlot,
  type = 'text',
  value,
}: AuthInputProps) {
  return (
    <div>
      <label className="luxury-kicker mb-3 block text-[11px] text-[var(--app-text-soft)]">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--app-navy)]">
          {icon}
        </div>
        <input
          autoComplete={autoComplete}
          className="metal-control h-16 w-full rounded-[1.2rem] pl-16 pr-14 text-lg font-normal text-[var(--app-title)] outline-none transition-all dark:text-white"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
        {rightSlot ? (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">{rightSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

interface RoleCardProps {
  description: string;
  icon: ReactNode;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}

function RoleCard({ description, icon, isSelected, label, onClick }: RoleCardProps) {
  return (
    <button
      aria-pressed={isSelected}
      className={`rounded-[1.25rem] border p-4 text-left transition-all ${
        isSelected
          ? 'metal-button-primary border-white/20 shadow-[0_18px_28px_rgba(29,18,44,0.24)]'
          : 'luxury-panel-soft border-white/70 shadow-[0_14px_26px_rgba(51,65,85,0.12)] hover:border-[rgba(115,132,154,0.42)] hover:shadow-[0_18px_32px_rgba(51,65,85,0.16)]'
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            isSelected
              ? 'bg-white/12 text-[var(--app-gold-soft)]'
              : 'metal-icon-shell text-slate-700 dark:text-slate-100'
          }`}
        >
          {icon}
        </div>
        <div>
          <p
            className={`text-sm font-bold ${
              isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-1 text-xs leading-5 ${
              isSelected ? 'text-white/80' : 'text-slate-600 dark:text-slate-200'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function AuthBrandPanel() {
  return (
    <section className="relative hidden w-[50%] shrink-0 flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#342348_0%,#1b1328_56%,#08070d_100%)] px-12 py-10 lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_24%),radial-gradient(circle_at_82%_24%,_rgba(171,134,219,0.26),_transparent_18%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:150px_150px] opacity-30" />
      <div className="pointer-events-none absolute left-[-6rem] top-[-7rem] h-72 w-72 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-5rem] h-60 w-60 rounded-full bg-[var(--app-ember-soft)] blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="luxury-panel flex h-[22rem] w-[22rem] items-center justify-center rounded-[2.4rem] p-8 shadow-[var(--panel-shadow-strong)] backdrop-blur-xl">
          <img
            alt="CCID logo"
            className="h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(15,23,42,0.22)]"
            onError={(event) => {
              const target = event.currentTarget;
              target.onerror = null;
              target.src = APP_LOGO_FALLBACK;
            }}
            src={APP_LOGO_SRC}
          />
        </div>

        <div className="mt-12 text-center">
          <p className="luxury-kicker mb-5 text-[12px] text-[var(--app-gold-soft)]">Foundations / Access Node</p>
          <h1
            className="font-display text-[4rem] font-bold leading-[0.96] tracking-tight text-white"
            style={{ color: '#ffffff' }}
          >
            ระบบจัดเก็บเอกสาร
            <br />
            ราชการ
          </h1>
          <div className="mx-auto mt-7 h-px w-28 bg-[linear-gradient(90deg,transparent,rgba(237,226,252,0.86),transparent)]" />
          <p className="mt-6 text-[1.7rem] font-semibold tracking-tight text-[var(--app-gold-soft)]">
            สำหรับหน่วยงานและองค์กร
          </p>
        </div>
      </div>
    </section>
  );
}

export default function AuthView({ initialMode = 'login', onLogin }: AuthViewProps) {
  const navigate = useNavigate();
  const usesFirebaseAuth = isFirebaseConfigured;

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<User['role']>('general');
  const [forgotEmail, setForgotEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const result = await api.login(loginIdentity, loginPassword, rememberMe);
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
      showToast('กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก', 'error');
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
        role: registerRole,
        email: registerEmail,
      });

      showToast(
        usesFirebaseAuth
          ? 'สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
          : 'สมัครสมาชิกสำเร็จ สามารถเข้าสู่ระบบได้ทันที',
        'success',
      );
      navigate('/login');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          duplicateMessage: 'อีเมลนี้มีอยู่ในระบบแล้ว',
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

    if (!usesFirebaseAuth) {
      showToast('โหมดทดสอบในเครื่องยังไม่รองรับการรีเซ็ตรหัสผ่านทางอีเมล', 'info');
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

  const passwordToggle = (
    <button
      className="transition-colors hover:text-slate-600"
      onClick={() => setShowPassword((current) => !current)}
      type="button"
    >
      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_18%),radial-gradient(circle_at_84%_20%,_rgba(171,134,219,0.18),_transparent_16%)]" />

      <div className="luxury-panel relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1320px] overflow-hidden rounded-[2.5rem] backdrop-blur-xl sm:min-h-[calc(100vh-3rem)]">
        {isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#08050d]/42 backdrop-blur-sm">
            <div className="luxury-panel flex flex-col items-center rounded-[1.8rem] px-8 py-7 shadow-[var(--panel-shadow-strong)]">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-[var(--app-navy)]" />
              <p className="text-sm font-semibold text-[var(--app-text)]">กำลังประมวลผล...</p>
            </div>
          </div>
        ) : null}

        <AuthBrandPanel />

        <section className="flex flex-1 flex-col justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04)),radial-gradient(circle_at_top,rgba(171,134,219,0.08),transparent_55%)] px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <div className="mb-10 flex justify-center lg:hidden">
            <div className="luxury-panel rounded-[2rem] p-4 shadow-[var(--panel-shadow-strong)]">
              <img
                alt="CCID logo"
                className="h-28 w-28 object-contain drop-shadow-[0_14px_25px_rgba(15,23,42,0.2)]"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = APP_LOGO_FALLBACK;
                }}
                src={APP_LOGO_SRC}
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[32rem]">
            <div className="mb-10">
              <p className="luxury-kicker mb-4 text-[11px]">Access / Security Layer</p>
              <h2 className="font-display text-[3.2rem] font-bold leading-none tracking-tight text-[var(--app-title)] dark:text-white">
                {authMode === 'login'
                  ? 'เข้าสู่ระบบ'
                  : authMode === 'register'
                    ? 'สมัครสมาชิก'
                    : 'ลืมรหัสผ่าน'}
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--app-text-soft)] dark:text-slate-300">
                {authMode === 'login'
                  ? 'กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบงานเอกสาร'
                  : authMode === 'register'
                    ? 'สร้างบัญชีใหม่เพื่อเริ่มใช้งานระบบงานเอกสาร'
                    : 'กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน'}
              </p>
            </div>

            {authMode === 'login' ? (
              <form className="space-y-7" onSubmit={handleLogin}>
                <AuthInput
                  autoComplete="username"
                  icon={<UserIcon className="h-6 w-6" />}
                  label="อีเมล หรือ USERNAME"
                  onChange={setLoginIdentity}
                  placeholder="admin"
                  type="text"
                  value={loginIdentity}
                />

                <AuthInput
                  autoComplete="current-password"
                  icon={<Lock className="h-6 w-6" />}
                  label="รหัสผ่าน"
                  onChange={setLoginPassword}
                  placeholder="••••••••"
                  rightSlot={passwordToggle}
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                />

                <div className="flex justify-end">
                  <div className="flex w-full items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                      <input
                        checked={rememberMe}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--app-navy)] focus:ring-[var(--app-navy)]"
                        onChange={(event) => setRememberMe(event.target.checked)}
                        type="checkbox"
                      />
                      จดจำการเข้าสู่ระบบ
                    </label>
                    <button
                      className="metal-link text-sm font-semibold transition"
                      onClick={() => navigate('/forgot-password')}
                      type="button"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                </div>

                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {rememberMe
                    ? 'ระบบจะจดจำการเข้าสู่ระบบบนอุปกรณ์นี้จนกว่าคุณจะกดออกจากระบบ'
                    : 'ถ้าไม่เลือก ระบบจะไม่จำการเข้าสู่ระบบหลังปิดเบราว์เซอร์'}
                </p>

                <button
                  className="metal-button-primary h-16 w-full rounded-[1.2rem] text-2xl font-bold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="submit"
                >
                  เข้าสู่ระบบ
                </button>

                <p className="pt-6 text-center text-sm font-semibold text-slate-500">
                  ยังไม่มีบัญชีใช่หรือไม่?{' '}
                  <button
                    className="metal-link transition"
                    onClick={() => navigate('/register')}
                    type="button"
                  >
                    ลงทะเบียนใช้งาน
                  </button>
                </p>
              </form>
            ) : null}

            {authMode === 'register' ? (
              <form className="space-y-5" onSubmit={handleRegister}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <AuthInput
                    autoComplete="given-name"
                    icon={<UserIcon className="h-6 w-6" />}
                    label="ชื่อ"
                    onChange={setRegisterFirstName}
                    placeholder="ชื่อ"
                    value={registerFirstName}
                  />
                  <AuthInput
                    autoComplete="family-name"
                    icon={<UserIcon className="h-6 w-6" />}
                    label="นามสกุล"
                    onChange={setRegisterLastName}
                    placeholder="นามสกุล"
                    value={registerLastName}
                  />
                </div>

                <AuthInput
                  autoComplete="email"
                  icon={<Mail className="h-6 w-6" />}
                  label="อีเมล"
                  onChange={setRegisterEmail}
                  placeholder="name@agency.go.th"
                  type="email"
                  value={registerEmail}
                />

                <AuthInput
                  autoComplete="new-password"
                  icon={<Lock className="h-6 w-6" />}
                  label="รหัสผ่าน"
                  onChange={setRegisterPassword}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  rightSlot={passwordToggle}
                  type={showPassword ? 'text' : 'password'}
                  value={registerPassword}
                />

                <div>
                  <label className="luxury-kicker mb-3 block text-[12px] text-slate-600 dark:text-slate-300">
                    ประเภทบัญชี
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RoleCard
                      description="สำหรับผู้ดูแลและกำหนดค่าระบบในหน่วยงาน"
                      icon={<ShieldCheck className="h-5 w-5" />}
                      isSelected={registerRole === 'admin'}
                      label="ผู้ดูแลระบบ"
                      onClick={() => setRegisterRole('admin')}
                    />
                    <RoleCard
                      description="สำหรับเจ้าหน้าที่ตำรวจผู้ปฏิบัติงานในระบบ"
                      icon={<UserIcon className="h-5 w-5" />}
                      isSelected={registerRole === 'general'}
                      label="เจ้าหน้าที่ตำรวจ"
                      onClick={() => setRegisterRole('general')}
                    />
                  </div>
                </div>

                <label className="luxury-panel-soft flex items-start gap-3 rounded-[1.2rem] px-4 py-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  <input
                    checked={termsAccepted}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-navy)] focus:ring-[var(--app-navy)]"
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    ยอมรับ{' '}
                    <button
                      className="metal-link font-semibold hover:underline"
                      onClick={() => navigate('/terms')}
                      type="button"
                    >
                      เงื่อนไขการใช้บริการ
                    </button>{' '}
                    และ{' '}
                    <button
                      className="metal-link font-semibold hover:underline"
                      onClick={() => navigate('/privacy')}
                      type="button"
                    >
                      นโยบายความเป็นส่วนตัว
                    </button>
                  </span>
                </label>

                <button
                  className="metal-button-primary h-16 w-full rounded-[1.2rem] text-2xl font-bold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="submit"
                >
                  ยืนยัน
                </button>

                <p className="pt-4 text-center text-sm font-semibold text-slate-500">
                  มีบัญชีผู้ใช้อยู่แล้ว?{' '}
                  <button
                    className="metal-link transition"
                    onClick={() => navigate('/login')}
                    type="button"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </button>
                </p>
              </form>
            ) : null}

            {authMode === 'forgot' ? (
              <form className="space-y-7" onSubmit={handleForgotPassword}>
                <AuthInput
                  autoComplete="email"
                  icon={<Mail className="h-6 w-6" />}
                  label="อีเมล"
                  onChange={setForgotEmail}
                  placeholder="name@agency.go.th"
                  type="email"
                  value={forgotEmail}
                />

                <button
                  className="metal-button-primary h-16 w-full rounded-[1.2rem] text-xl font-bold transition-all active:scale-[0.99]"
                  type="submit"
                >
                  ส่งคำขอรีเซ็ตรหัสผ่าน
                </button>

                <p className="pt-4 text-center text-sm font-semibold text-slate-500">
                  <button
                    className="metal-link transition"
                    onClick={() => navigate('/login')}
                    type="button"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </button>
                </p>
              </form>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
