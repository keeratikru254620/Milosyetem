import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import {
  HelpCircle,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sliders,
  UserCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { showToast } from '../services/toastService';
import type { SaveUserInput, User } from '../types';
import { getErrorMessage } from '../utils/auth';

export type SettingsTab = 'general' | 'profile' | 'security' | 'support';

interface SettingsViewProps {
  basePath?: string;
  currentUser: User;
  initialTab?: SettingsTab;
  isDarkMode: boolean;
  onSaveUser: (data: SaveUserInput, id?: string) => Promise<unknown> | unknown;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
}

export default function SettingsView({
  basePath = '/settings',
  currentUser,
  initialTab = 'profile',
  isDarkMode,
  onSaveUser,
  setIsDarkMode,
}: SettingsViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [name, setName] = useState(currentUser.name);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tabs = [
    { id: 'profile' as const, icon: UserCircle, label: 'ข้อมูลบัญชีผู้ใช้' },
    { id: 'general' as const, icon: Sliders, label: 'การตั้งค่าทั่วไป' },
    { id: 'security' as const, icon: ShieldCheck, label: 'ความปลอดภัย' },
    { id: 'support' as const, icon: HelpCircle, label: 'ช่วยเหลือ' },
  ];

  useEffect(() => {
    setName(currentUser.name);
  }, [currentUser.name]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await onSaveUser({ name: name.trim() }, currentUser._id);
      showToast('บันทึกข้อมูลสำเร็จ');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          fallbackMessage: 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้',
        }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password.trim() || isLoading) {
      return;
    }

    if (password.trim().length < 6) {
      showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await onSaveUser({ password }, currentUser._id);
      setPassword('');
      showToast('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
      showToast(
        getErrorMessage(error, {
          fallbackMessage: 'ไม่สามารถอัปเดตรหัสผ่านได้',
        }),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = image.width;
        let height = image.height;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context?.drawImage(image, 0, 0, width, height);

        try {
          await onSaveUser({ avatar: canvas.toDataURL('image/jpeg', 0.8) }, currentUser._id);
          showToast('อัปเดตรูปสำเร็จ');
        } catch (error) {
          showToast(
            getErrorMessage(error, {
              fallbackMessage: 'ไม่สามารถอัปเดตรูปโปรไฟล์ได้',
            }),
            'error',
          );
        }
      };

      image.src = String(loadEvent.target?.result ?? '');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="luxury-panel mx-auto flex min-h-[600px] max-w-6xl flex-col overflow-hidden rounded-3xl animate-slide-blur md:flex-row">
      <div className="metal-section-band flex w-full flex-col border-r border-white/10 p-6 md:w-72 md:p-8">
        <h3 className="mb-6 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          การตั้งค่าระบบ
        </h3>
        <div className="space-y-1.5">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              className={`flex w-full items-center rounded-2xl border px-5 py-3.5 text-sm font-bold transition-all ${
                activeTab === id
                  ? 'metal-button-primary text-white'
                  : 'border-transparent text-slate-700 hover:bg-white/8 dark:text-slate-300 dark:hover:bg-white/6'
              }`}
              key={id}
              onClick={() => navigate(`${basePath}/${id}`)}
            >
              <Icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  activeTab === id
                    ? 'text-[var(--app-gold-soft)]'
                    : 'text-slate-400'
                }`}
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 p-6 md:p-12">
        {activeTab === 'profile' && (
          <div className="max-w-2xl animate-in zoom-in-95 fade-in duration-300">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              ข้อมูลบัญชีผู้ใช้
            </h2>
            <p className="mb-10 border-b border-white/10 pb-8 text-sm text-slate-500 dark:text-slate-400">
              จัดการข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ
            </p>
            <div className="mb-10 flex items-center gap-6">
              <div className="metal-icon-shell relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/12 text-4xl font-bold text-[var(--app-gold-soft)]">
                {currentUser.avatar ? (
                  <img
                    alt="avatar"
                    className="h-full w-full object-cover"
                    src={currentUser.avatar}
                  />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h3>
                <p className="mt-1 font-mono text-sm text-slate-500">
                  {currentUser.email || currentUser.username}
                </p>
                <input
                  accept="image/jpeg, image/png"
                  className="hidden"
                  onChange={handleAvatarChange}
                  ref={fileRef}
                  type="file"
                />
                <button
                  className="metal-link mt-3 text-xs font-bold transition"
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  เปลี่ยนรูปโปรไฟล์
                </button>
              </div>
            </div>

            <form className="max-w-md space-y-6" onSubmit={handleProfileSave}>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  EMAIL
                </label>
                <input
                  className="metal-control w-full cursor-not-allowed rounded-xl px-5 py-3.5 font-mono text-sm text-slate-500 outline-none"
                  readOnly
                  type="text"
                  value={currentUser.email || currentUser.username}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                  ยศ-ชื่อ-สกุล
                </label>
                <input
                  className="metal-control w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors dark:text-white"
                  onChange={(event) => setName(event.target.value)}
                  required
                  type="text"
                  value={name}
                />
              </div>
              <div className="pt-4">
                <button
                  className="metal-button-primary rounded-xl px-8 py-3.5 text-sm font-bold transition active:scale-95 disabled:opacity-50"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              การตั้งค่าทั่วไป
            </h2>
            <p className="mb-8 border-b border-white/10 pb-8 text-sm text-slate-500 dark:text-slate-400">
              ปรับแต่งประสบการณ์การใช้งานระบบ
            </p>

            <div className="max-w-md space-y-5">
              <div className="luxury-panel-soft flex items-center justify-between rounded-2xl p-6 transition-colors hover:border-white/18">
                <div>
                  <h4 className="flex items-center text-sm font-bold text-slate-800 dark:text-white">
                    <Moon className="mr-3 h-5 w-5 text-slate-400" /> โหมดกลางคืน (Dark Mode)
                  </h4>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                    เปลี่ยนธีมระบบเป็นสีเข้มถนอมสายตา
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    checked={isDarkMode}
                    className="peer sr-only"
                    onChange={(event) => setIsDarkMode(event.target.checked)}
                    type="checkbox"
                  />
                  <div className="peer h-6 w-12 rounded-full bg-white/16 shadow-inner after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/16 after:bg-white/80 after:transition-all after:content-[''] peer-checked:bg-[var(--app-gold)] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              ความปลอดภัย
            </h2>
            <p className="mb-8 border-b border-white/10 pb-8 text-sm text-slate-500 dark:text-slate-400">
              จัดการรหัสผ่านและการเข้าถึงบัญชี
            </p>
            <form className="max-w-md space-y-6" onSubmit={handleSecuritySave}>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  รหัสผ่านใหม่
                </label>
                <input
                  className="metal-control w-full rounded-xl px-5 py-3.5 font-mono text-sm outline-none transition-colors dark:text-white"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <div className="pt-2">
                <button
                  className="metal-button-primary rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95 disabled:opacity-50"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="mx-auto mt-2 w-full max-w-4xl animate-in zoom-in-95 fade-in duration-300">
            <h2 className="mt-4 mb-8 text-center text-2xl font-bold text-slate-900 dark:text-white">
              ช่วยเหลือ
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="luxury-panel-soft flex flex-col items-center rounded-3xl p-8 text-center transition-all hover:shadow-md">
                <div className="metal-icon-shell mb-5 flex h-16 w-16 items-center justify-center rounded-full text-red-300">
                  <Phone className="h-7 w-7" />
                </div>
                <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                  สายด่วน (Hotline)
                </h4>
                <p className="mb-1 text-[28px] font-bold leading-none tracking-wide text-[var(--app-gold)] dark:text-[var(--app-gold-soft)]">
                  1441
                </p>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  ตลอด 24 ชั่วโมง (ศูนย์ AOC)
                </p>
              </div>
              <div className="luxury-panel-soft flex flex-col items-center rounded-3xl p-8 text-center transition-all hover:shadow-md">
                <div className="metal-icon-shell mb-5 flex h-16 w-16 items-center justify-center rounded-full text-[var(--app-gold)]">
                  <Mail className="h-7 w-7" />
                </div>
                <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                  อีเมล (Email)
                </h4>
                <p className="mt-2 mb-1 text-[15px] font-medium leading-none text-slate-700 dark:text-slate-300">
                  contact@ccib.go.th
                </p>
                <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                  สำหรับการติดต่อราชการ
                </p>
              </div>
            </div>
            <div className="luxury-panel-soft rounded-3xl p-8 transition-all hover:shadow-md">
              <div className="flex items-start">
                <MapPin className="mr-4 mt-0.5 h-5 w-5 shrink-0 text-[var(--app-gold)]" />
                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                    ที่อยู่หน่วยงาน
                  </h4>
                  <div className="space-y-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                    <p>กองบัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี 1 (บก.สอท.1)</p>
                    <p>อาคารเฉลิมพระเกียรติฯ ศูนย์ราชการแจ้งวัฒนะ อาคาร B ชั้น 4</p>
                    <p>ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
