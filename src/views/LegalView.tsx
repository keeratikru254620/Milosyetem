import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

type LegalVariant = 'privacy' | 'terms';

interface LegalViewProps {
  variant: LegalVariant;
}

const LEGAL_CONTENT: Record<
  LegalVariant,
  {
    eyebrow: string;
    title: string;
    description: string;
    sections: Array<{ title: string; body: string[] }>;
  }
> = {
  terms: {
    eyebrow: 'Terms of Use',
    title: 'เงื่อนไขการใช้งานระบบ',
    description:
      'ข้อกำหนดนี้อธิบายหลักเกณฑ์การใช้งานเว็บไซต์และระบบจัดเก็บเอกสาร เพื่อให้การใช้งานเป็นไปอย่างปลอดภัย เหมาะสม และตรวจสอบได้',
    sections: [
      {
        title: 'การเข้าถึงระบบ',
        body: [
          'ผู้ใช้งานต้องใช้บัญชีของตนเองในการเข้าสู่ระบบ และรับผิดชอบการเก็บรักษารหัสผ่านไม่ให้ผู้อื่นเข้าถึง',
          'ห้ามใช้งานระบบในลักษณะที่อาจก่อให้เกิดความเสียหายต่อข้อมูล เอกสาร หรือการทำงานของหน่วยงาน',
        ],
      },
      {
        title: 'การใช้งานเอกสาร',
        body: [
          'เอกสารและข้อมูลที่จัดเก็บในระบบถือเป็นข้อมูลสำหรับการปฏิบัติงาน ผู้ใช้งานต้องใช้งานตามสิทธิ์ที่ได้รับเท่านั้น',
          'ห้ามอัปโหลด เผยแพร่ หรือส่งต่อข้อมูลที่ผิดกฎหมาย ละเมิดสิทธิ์ผู้อื่น หรือไม่เกี่ยวข้องกับการใช้งานระบบ',
        ],
      },
      {
        title: 'การระงับสิทธิ์',
        body: [
          'ผู้ดูแลระบบมีสิทธิ์ปรับสิทธิ์ ระงับ หรือยกเลิกบัญชีผู้ใช้งานที่ฝ่าฝืนข้อกำหนดหรือสร้างความเสี่ยงต่อระบบ',
          'หน่วยงานอาจปรับปรุงข้อกำหนดนี้ตามความเหมาะสม และให้ถือว่าการใช้งานต่อเนื่องเป็นการยอมรับข้อกำหนดฉบับล่าสุด',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'นโยบายความเป็นส่วนตัว',
    description:
      'ระบบนี้เก็บข้อมูลเท่าที่จำเป็นต่อการยืนยันตัวตน การบริหารสิทธิ์ และการใช้งานเอกสารภายในหน่วยงาน โดยคำนึงถึงความปลอดภัยของข้อมูลเป็นสำคัญ',
    sections: [
      {
        title: 'ข้อมูลที่จัดเก็บ',
        body: [
          'ระบบอาจจัดเก็บข้อมูลบัญชีผู้ใช้ เช่น ชื่อ อีเมล เบอร์โทรศัพท์ สิทธิ์การใช้งาน และข้อมูลที่เกี่ยวข้องกับการเข้าสู่ระบบ',
          'ระบบอาจจัดเก็บข้อมูลเอกสารและกิจกรรมการใช้งานเท่าที่จำเป็นต่อการดำเนินงานและการตรวจสอบย้อนหลัง',
        ],
      },
      {
        title: 'วัตถุประสงค์การใช้ข้อมูล',
        body: [
          'ใช้เพื่อยืนยันตัวตน จัดการสิทธิ์ผู้ใช้ ปรับปรุงความปลอดภัย และสนับสนุนการใช้งานระบบอย่างมีประสิทธิภาพ',
          'ใช้เพื่อสนับสนุนการตรวจสอบเหตุการณ์ผิดปกติ การบำรุงรักษาระบบ และการให้ความช่วยเหลือแก่ผู้ใช้งาน',
        ],
      },
      {
        title: 'การคุ้มครองข้อมูล',
        body: [
          'หน่วยงานใช้มาตรการที่เหมาะสมในการป้องกันการเข้าถึง เปลี่ยนแปลง หรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต',
          'ผู้ใช้งานควรออกจากระบบเมื่อเลิกใช้งาน และไม่เปิดเผยข้อมูลบัญชีแก่บุคคลอื่น',
        ],
      },
    ],
  },
};

export default function LegalView({ variant }: LegalViewProps) {
  const navigate = useNavigate();
  const content = useMemo(() => LEGAL_CONTENT[variant], [variant]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10 dark:bg-[#0B1120] sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(30,58,138,0.16),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl">
        <button
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => navigate('/login')}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้าเข้าสู่ระบบ
        </button>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-8 dark:border-slate-800 dark:bg-slate-950/40 sm:px-10">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-amber-400">
              {variant === 'terms' ? <FileText className="h-7 w-7" /> : <Shield className="h-7 w-7" />}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {content.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {content.description}
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p
                      className="text-sm leading-7 text-slate-600 dark:text-slate-300"
                      key={paragraph}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
