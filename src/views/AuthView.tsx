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
      <label className="mb-3 block text-sm font-semibold tracking-wide text-slate-500">
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#233B84]">
          {icon}
        </div>
        <input
          autoComplete={autoComplete}
          className="h-16 w-full rounded-[1.2rem] border border-slate-200 bg-white pl-16 pr-14 text-lg font-normal text-slate-700 shadow-[0_6px_20px_rgba(15,23,42,0.06)] outline-none transition-all placeholder:text-slate-400 focus:border-[#233B84] focus:shadow-[0_0_0_4px_rgba(35,59,132,0.08)]"
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
          ? 'border-[#233B84] bg-[#EEF3FF] shadow-[0_10px_24px_rgba(35,59,132,0.12)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            isSelected ? 'bg-[#233B84] text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

function AuthBrandPanel() {
  return (
    <section className="relative hidden w-[50%] shrink-0 flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#EAF2FF_0%,#DDE9FA_52%,#D9E5F5_100%)] px-12 py-10 lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(35,59,132,0.08),_transparent_36%)]" />
      <div className="pointer-events-none absolute left-[-6rem] top-[-7rem] h-72 w-72 rounded-full bg-white/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-5rem] h-60 w-60 rounded-full bg-[#233B84]/10 blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="flex h-[22rem] w-[22rem] items-center justify-center rounded-[2.4rem] border border-white/80 bg-white/88 p-8 shadow-[0_28px_70px_rgba(35,59,132,0.12)] backdrop-blur-xl">
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
          <h1 className="font-display text-[4rem] font-bold leading-[0.96] tracking-tight text-slate-800">
            ระบบจัดเก็บเอกสาร
            <br />
            ราชการ
          </h1>
          <div className="mx-auto mt-7 h-1.5 w-24 rounded-full bg-[#E68618]" />
          <p className="mt-6 text-[1.7rem] font-semibold tracking-tight text-[#E68618]">
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
      const result = await api.login(loginIdentity, loginPassword);
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
    <div className="relative min-h-screen overflow-hidden bg-[#E9EEF5] px-4 py-4 sm:px-6 sm:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(35,59,132,0.12),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1320px] overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/70 shadow-[0_40px_120px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:min-h-[calc(100vh-3rem)]">
        {isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/65 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-[1.8rem] bg-white/90 px-8 py-7 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#233B84]" />
              <p className="text-sm font-semibold text-slate-700">กำลังประมวลผล...</p>
            </div>
          </div>
        ) : null}

        <AuthBrandPanel />

        <section className="flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <div className="mb-10 flex justify-center lg:hidden">
            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#EEF4FF_0%,#E0EAFE_100%)] p-4 shadow-[0_20px_50px_rgba(35,59,132,0.12)]">
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
              <h2 className="font-display text-[3.2rem] font-bold leading-none tracking-tight text-slate-800">
                {authMode === 'login'
                  ? 'เข้าสู่ระบบ'
                  : authMode === 'register'
                    ? 'สมัครสมาชิก'
                    : 'ลืมรหัสผ่าน'}
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-500">
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
                  <button
                    className="text-sm font-semibold text-slate-700 transition hover:text-[#233B84]"
                    onClick={() => navigate('/forgot-password')}
                    type="button"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>

                <button
                  className="h-16 w-full rounded-[1.2rem] bg-[#233B84] text-2xl font-bold text-white shadow-[0_18px_30px_rgba(35,59,132,0.26)] transition-all hover:bg-[#1D326F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="submit"
                >
                  เข้าสู่ระบบ
                </button>

                <p className="pt-6 text-center text-sm font-semibold text-slate-500">
                  ยังไม่มีบัญชีใช่หรือไม่?{' '}
                  <button
                    className="text-[#233B84] transition hover:text-[#1D326F]"
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
                  <label className="mb-3 block text-sm font-semibold tracking-wide text-slate-500">
                    ประเภทบัญชี
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RoleCard
                      description="สำหรับผู้ปฏิบัติงานและผู้ดูแลในหน่วยงาน"
                      icon={<ShieldCheck className="h-5 w-5" />}
                      isSelected={registerRole === 'admin'}
                      label="เจ้าหน้าที่ตำรวจ"
                      onClick={() => setRegisterRole('admin')}
                    />
                    <RoleCard
                      description="สำหรับผู้ใช้งานภายนอกหรือบุคคลทั่วไป"
                      icon={<UserIcon className="h-5 w-5" />}
                      isSelected={registerRole === 'general'}
                      label="ผู้ใช้งานทั่วไป"
                      onClick={() => setRegisterRole('general')}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                  <input
                    checked={termsAccepted}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#233B84] focus:ring-[#233B84]"
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    ยอมรับ{' '}
                    <button
                      className="font-semibold text-[#233B84] hover:underline"
                      onClick={() => navigate('/terms')}
                      type="button"
                    >
                      เงื่อนไขการใช้บริการ
                    </button>{' '}
                    และ{' '}
                    <button
                      className="font-semibold text-[#233B84] hover:underline"
                      onClick={() => navigate('/privacy')}
                      type="button"
                    >
                      นโยบายความเป็นส่วนตัว
                    </button>
                  </span>
                </label>

                <button
                  className="h-16 w-full rounded-[1.2rem] bg-[#233B84] text-2xl font-bold text-white shadow-[0_18px_30px_rgba(35,59,132,0.26)] transition-all hover:bg-[#1D326F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="submit"
                >
                  ยืนยัน
                </button>

                <p className="pt-4 text-center text-sm font-semibold text-slate-500">
                  มีบัญชีผู้ใช้อยู่แล้ว?{' '}
                  <button
                    className="text-[#233B84] transition hover:text-[#1D326F]"
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
                  className="h-16 w-full rounded-[1.2rem] bg-[#233B84] text-xl font-bold text-white shadow-[0_18px_30px_rgba(35,59,132,0.26)] transition-all hover:bg-[#1D326F] active:scale-[0.99]"
                  type="submit"
                >
                  ส่งคำขอรีเซ็ตรหัสผ่าน
                </button>

                <p className="pt-4 text-center text-sm font-semibold text-slate-500">
                  <button
                    className="text-[#233B84] transition hover:text-[#1D326F]"
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
