import { ArrowLeft, Home, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotFoundViewProps {
  backTo: string;
  backLabel: string;
}

export default function NotFoundView({ backTo, backLabel }: NotFoundViewProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="luxury-panel w-full max-w-2xl rounded-[2rem] p-8 text-center shadow-sm sm:p-12">
        <div className="metal-icon-shell mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-[var(--app-gold)]">
          <TriangleAlert className="h-10 w-10" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
          ไม่พบหน้าที่คุณต้องการ
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          ลิงก์ที่คุณเปิดอาจไม่ถูกต้อง ถูกย้ายตำแหน่ง หรือหมดอายุแล้ว คุณสามารถกลับไปยังหน้าหลักของระบบเพื่อเริ่มต้นใหม่ได้ทันที
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="metal-button-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:brightness-105"
            onClick={() => navigate(backTo)}
            type="button"
          >
            <Home className="h-4 w-4" />
            {backLabel}
          </button>
          <button
            className="metal-button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
