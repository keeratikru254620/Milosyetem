import type { ReactElement } from 'react';
import {
  BarChart3,
  CalendarPlus,
  ChevronRight,
  Clock3,
  Files,
  PieChart,
  Tag,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import StatCard from '../components/common/StatCard';
import type { DocType, DocumentData, User } from '../types';
import { formatThaiDate } from '../utils/format';

interface DashboardViewProps {
  currentUser: User;
  documents: DocumentData[];
  docTypes: DocType[];
  routePrefix?: string;
}

export default function DashboardView({
  currentUser,
  documents,
  docTypes,
  routePrefix = '',
}: DashboardViewProps) {
  const navigate = useNavigate();
  const resolveRoute = (path: string) => `${routePrefix}${path}`;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const newDocsCount = documents.filter(
    (document) => document.date && document.date.startsWith(currentMonth),
  ).length;
  const myDocsCount = documents.filter(
    (document) =>
      document.ownerId === currentUser.username || document.ownerId === currentUser._id,
  ).length;

  const stats = [
    {
      label: 'เอกสารทั้งหมด',
      value: documents.length,
      icon: Files,
      backgroundClassName:
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.04)_28%),linear-gradient(135deg,rgba(120,128,140,0.76),rgba(78,86,97,0.96))]',
      iconClassName: 'text-[var(--app-gold-soft)]',
    },
    {
      label: 'เอกสารใหม่เดือนนี้',
      value: newDocsCount,
      icon: CalendarPlus,
      backgroundClassName:
        'bg-[linear-gradient(180deg,rgba(255,235,217,0.22),rgba(255,255,255,0.03)_28%),linear-gradient(135deg,rgba(143,96,56,0.9),rgba(97,67,44,0.98))]',
      iconClassName: 'text-[#fff2e6]',
    },
    {
      label: 'ประเภทเอกสาร',
      value: docTypes.length,
      icon: Tag,
      backgroundClassName:
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_28%),linear-gradient(135deg,rgba(153,121,82,0.84),rgba(94,74,51,0.96))]',
      iconClassName: 'text-[var(--app-gold-soft)]',
    },
    {
      label: 'เอกสารที่รับผิดชอบ',
      value: myDocsCount,
      icon: UserCheck,
      backgroundClassName:
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04)_28%),linear-gradient(135deg,rgba(132,140,152,0.72),rgba(86,94,106,0.96))]',
      iconClassName: 'text-white',
    },
  ] as const;

  const typeCounts = docTypes
    .map((docType) => ({
      ...docType,
      count: documents.filter((document) => document.typeId === docType._id).length,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'th'));

  const recentDocuments = [...documents]
    .sort(
      (left, right) =>
        new Date(right.createdAt || right.date).getTime() -
        new Date(left.createdAt || left.date).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="animate-slide-blur space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 lg:gap-6">
        {stats.map((stat) => (
          <StatCard
            backgroundClassName={stat.backgroundClassName}
            icon={stat.icon}
            iconClassName={stat.iconClassName}
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="luxury-panel rounded-[1.9rem] p-8 lg:col-span-2">
          <h3 className="luxury-heading mb-6 flex items-center text-xl font-bold text-slate-900 dark:text-white">
            <PieChart className="mr-3 h-6 w-6 text-[var(--app-gold)]" /> สัดส่วนเอกสาร
          </h3>
          <div className="flex flex-col items-center gap-10 sm:flex-row">
            <div className="flex w-full max-w-[14rem] shrink-0 flex-col items-center justify-center gap-5 sm:w-56">
              <div className="group relative h-44 w-44 sm:h-48 sm:w-48">
                <svg
                  className="h-full w-full -rotate-90 rounded-full drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                  viewBox="0 0 100 100"
                >
                  {typeCounts.reduce<{ elements: ReactElement[]; offset: number }>(
                    (accumulator, docType, index) => {
                      if (docType.count === 0 || documents.length === 0) {
                        return accumulator;
                      }

                      const percentage = (docType.count / documents.length) * 100;
                      accumulator.elements.push(
                        <circle
                          className="cursor-pointer transition-all duration-1000 ease-out hover:opacity-80"
                          cx="50"
                          cy="50"
                          fill="transparent"
                          key={`${docType._id}-${index}`}
                          r="25"
                          stroke={docType.color}
                          strokeDasharray={`${percentage} 100`}
                          strokeDashoffset={-accumulator.offset}
                          strokeWidth="50"
                        />,
                      );
                      accumulator.offset += percentage;
                      return accumulator;
                    },
                    { elements: [], offset: 0 },
                  ).elements}
                  {documents.length === 0 ? (
                    <circle
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="25"
                      stroke="#e2e8f0"
                      strokeWidth="50"
                    />
                  ) : null}
                </svg>
              </div>

              <div className="luxury-panel-soft flex min-w-[7.5rem] flex-col items-center justify-center rounded-[1.75rem] px-5 py-3 text-center">
                <span className="leading-none text-[1.9rem] font-bold text-[var(--app-title)] dark:text-white sm:text-[2.05rem]">
                  {documents.length}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-soft)] dark:text-slate-300">
                  Total
                </span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-4">
              {typeCounts.slice(0, 4).map((docType) => {
                const percentage = documents.length
                  ? ((docType.count / documents.length) * 100).toFixed(1)
                  : '0';

                return (
                  <div
                    className="luxury-panel-soft flex items-center justify-between rounded-2xl p-4 transition-colors hover:border-white/18"
                    key={docType._id}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="h-4 w-4 rounded-full shadow-sm"
                        style={{ backgroundColor: docType.color }}
                      />
                      <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                        {docType.name}
                      </span>
                    </div>
                    <span className="metal-badge rounded-xl px-4 py-1.5 text-base font-bold text-slate-900 dark:text-white">
                      {docType.count}
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        ({percentage}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="luxury-panel rounded-[1.9rem] p-8">
          <h3 className="luxury-heading mb-6 flex items-center text-xl font-bold text-slate-900 dark:text-white">
            <BarChart3 className="mr-3 h-6 w-6 text-[var(--app-gold)]" /> ปริมาณรายประเภท
          </h3>
          <div className="space-y-7">
            {typeCounts.map((docType) => {
              const percentage = documents.length
                ? ((docType.count / documents.length) * 100).toFixed(1)
                : '0';

              return (
                <div className="group" key={docType._id}>
                  <div className="mb-2.5 flex justify-between text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{docType.name}</span>
                    <span className="text-slate-500">{percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/12 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                      style={{ width: `${percentage}%`, backgroundColor: docType.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="luxury-panel overflow-hidden rounded-[1.9rem]">
        <div className="metal-section-band flex items-center justify-between border-b border-white/10 p-6">
          <h3 className="luxury-heading flex items-center text-lg font-bold text-slate-900 dark:text-white">
            <Clock3 className="mr-3 h-6 w-6 text-[var(--app-gold)]" /> เอกสารล่าสุด
          </h3>
          <button
            className="metal-link group flex items-center text-sm font-bold transition"
            onClick={() => navigate(resolveRoute('/documents'))}
            type="button"
          >
            ดูทั้งหมด
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/8 bg-white/6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-6 py-5">วันที่</th>
                <th className="px-6 py-5">เลขที่</th>
                <th className="px-6 py-5">เรื่อง</th>
                <th className="px-6 py-5">ประเภท</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm dark:divide-slate-800/50">
              {recentDocuments.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-base font-bold text-slate-400" colSpan={4}>
                    ยังไม่มีข้อมูลเอกสาร
                  </td>
                </tr>
              ) : (
                recentDocuments.map((document) => {
                  const docType = docTypes.find((item) => item._id === document.typeId);

                  return (
                    <tr
                      className="group cursor-pointer transition-colors hover:bg-white/6"
                      key={document._id}
                      onClick={() => navigate(resolveRoute('/documents'))}
                    >
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatThaiDate(document.date)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                        {document.docNo || '-'}
                      </td>
                      <td className="max-w-[250px] truncate px-6 py-4 text-base font-bold text-slate-900 transition-colors group-hover:text-[var(--app-gold)] dark:text-white">
                        {document.subject || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="rounded-xl border px-3.5 py-1.5 text-xs font-bold tracking-wide shadow-sm"
                          style={{
                            color: docType?.color || '#94a3b8',
                            borderColor: `${docType?.color || '#94a3b8'}30`,
                            backgroundColor: `${docType?.color || '#94a3b8'}10`,
                          }}
                        >
                          {docType?.name || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
