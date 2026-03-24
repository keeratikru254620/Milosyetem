import {
  ArrowRight,
  FileArchive,
  LockKeyhole,
  SearchCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { APP_LOGO_FALLBACK, APP_LOGO_SRC } from '../utils/assets';

const features = [
  {
    icon: FileArchive,
    title: 'จัดเก็บเอกสารเป็นระบบ',
    description: 'แยกทะเบียนรับ-ส่งเอกสาร พร้อมค้นหาข้อมูลย้อนหลังได้สะดวก',
  },
  {
    icon: SearchCheck,
    title: 'ค้นหาได้ทั้งชื่อและเนื้อหา',
    description: 'รองรับการค้นหาจากข้อมูลเอกสารและไฟล์ PDF ที่สกัดข้อความแล้ว',
  },
  {
    icon: LockKeyhole,
    title: 'ใช้งานแบบปลอดภัย',
    description: 'ควบคุมสิทธิ์ผู้ใช้ และจัดการข้อมูลผ่านระบบล็อกอินของหน่วยงาน',
  },
];

export default function LandingView() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between">
          <button
            className="flex items-center gap-4 text-left"
            onClick={() => navigate('/')}
            type="button"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.3)] backdrop-blur">
              <img
                alt="โลโก้ระบบ"
                className="h-full w-full object-contain"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = APP_LOGO_FALLBACK;
                }}
                src={APP_LOGO_SRC}
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
                GOV-DOC PRO
              </p>
              <h1 className="mt-1 text-lg font-bold text-white sm:text-xl">
                ระบบจัดเก็บเอกสารราชการ
              </h1>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              onClick={() => navigate('/login')}
              type="button"
            >
              เข้าสู่ระบบ
            </button>
            <button
              className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
              onClick={() => navigate('/register')}
              type="button"
            >
              สมัครสมาชิก
            </button>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <section>
            <div className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100">
              เว็บไซต์หลักของระบบ ก่อนเข้าสู่ส่วนจัดการภายใน
            </div>
            <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              เข้าหน้าเว็บแล้วเห็นข้อมูลระบบก่อน จากนั้นค่อยไปหน้า Login
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              หน้านี้ใช้เป็น public landing page สำหรับเว็บไซต์ เมื่อผู้ใช้ยังไม่ล็อกอินจะไม่ถูกพาไปหน้า
              login ทันทีอีกต่อไป และยังสามารถกดเข้าสู่ระบบหรือสมัครสมาชิกจากหน้านี้ได้โดยตรง
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-slate-950 transition hover:bg-slate-100"
                onClick={() => navigate('/login')}
                type="button"
              >
                ไปหน้า Login
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
                onClick={() => navigate('/register')}
                type="button"
              >
                ไปหน้าสมัครสมาชิก
              </button>
            </div>
          </section>

          <section className="grid gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  className="rounded-3xl border border-white/10 bg-white/8 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur"
                  key={feature.title}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{feature.description}</p>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
