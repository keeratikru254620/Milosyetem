import type { LucideIcon } from 'lucide-react';
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

import type { DocType, DocumentData, User } from '../types';
import { formatThaiDate } from '../utils/format';

interface DashboardViewProps {
  currentUser: User;
  documents: DocumentData[];
  docTypes: DocType[];
  routePrefix?: string;
}

interface StatCard {
  bg: string;
  color: string;
  glow: string;
  icon: LucideIcon;
  label: string;
  value: number;
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

  const stats: StatCard[] = [
    {
      label: 'เอกสารทั้งหมด',
      value: documents.length,
      icon: Files,
      color: 'text-blue-900 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      glow: 'group-hover:shadow-blue-900/10',
    },
    {
      label: 'เอกสารใหม่เดือนนี้',
      value: newDocsCount,
      icon: CalendarPlus,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      glow: 'group-hover:shadow-amber-500/20',
    },
    {
      label: 'หมวดหมู่เอกสาร',
      value: docTypes.length,
      icon: Tag,
      color: 'text-slate-700 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      glow: 'group-hover:shadow-slate-500/10',
    },
    {
      label: 'เอกสารที่รับผิดชอบ',
      value: myDocsCount,
      icon: UserCheck,
      color: 'text-blue-800 dark:text-blue-300',
      bg: 'bg-blue-100 dark:bg-blue-800/30',
      glow: 'group-hover:shadow-blue-800/20',
    },
  ];

  const typeCounts = docTypes
    .map((docType) => ({
      ...docType,
      count: documents.filter((document) => document.typeId === docType._id).length,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'th'));

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
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className={`group relative flex items-center justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${stat.glow}`}
              key={stat.label}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative z-10">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </h3>
              </div>
              <div
                className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${stat.bg} ${stat.color}`}
              >
                <Icon className="h-8 w-8" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h3 className="mb-6 flex items-center text-lg font-bold text-slate-900 dark:text-white">
            <PieChart className="mr-3 h-6 w-6 text-amber-500" /> สัดส่วนเอกสาร
          </h3>
          <div className="flex flex-col items-center gap-10 sm:flex-row">
            <div className="group relative h-56 w-56 shrink-0">
              <svg
                className="h-full w-full -rotate-90 rounded-full drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                viewBox="0 0 100 100"
              >
                {typeCounts.reduce<{
                  elements: JSX.Element[];
                  offset: number;
                }>(
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
                {documents.length === 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="25"
                    stroke="#e2e8f0"
                    strokeWidth="50"
                  />
                )}
              </svg>
              <div className="absolute inset-0 z-10 m-10 flex flex-col items-center justify-center rounded-full border border-slate-100 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-900">
                <span className="text-4xl font-bold text-blue-900 dark:text-white">
                  {documents.length}
                </span>
                <span className="mt-1 text-xs font-bold uppercase text-amber-600 dark:text-amber-500">
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
                    className="flex items-center justify-between rounded-2xl border border-transparent bg-slate-50 p-4 transition-colors hover:border-slate-200 dark:bg-slate-800/50 dark:hover:border-slate-700"
                    key={docType._id}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="h-4 w-4 rounded-full shadow-sm"
                        style={{ backgroundColor: docType.color }}
                      ></span>
                      <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                        {docType.name}
                      </span>
                    </div>
                    <span className="rounded-xl border border-slate-100 bg-white px-4 py-1.5 text-base font-bold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      {docType.count}{' '}
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

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-6 flex items-center text-lg font-bold text-slate-900 dark:text-white">
            <BarChart3 className="mr-3 h-6 w-6 text-blue-900 dark:text-blue-500" /> ปริมาณรายประเภท
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
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                      style={{ width: `${percentage}%`, backgroundColor: docType.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/20">
          <h3 className="flex items-center text-base font-bold text-slate-900 dark:text-white">
            <Clock3 className="mr-3 h-6 w-6 text-amber-500" /> เอกสารล่าสุด
          </h3>
          <button
            className="group flex items-center text-sm font-bold text-blue-900 transition hover:text-blue-700 dark:text-amber-500 dark:hover:text-amber-400"
            onClick={() => navigate(resolveRoute('/documents'))}
          >
            ดูทั้งหมด{' '}
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                <th className="px-6 py-5">วันที่</th>
                <th className="px-6 py-5">เลขที่</th>
                <th className="px-6 py-5">เรื่อง</th>
                <th className="px-6 py-5">หมวดหมู่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm dark:divide-slate-800/50">
              {recentDocuments.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-base font-bold text-slate-400" colSpan={4}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                recentDocuments.map((document) => {
                  const docType = docTypes.find((item) => item._id === document.typeId);

                  return (
                    <tr
                      className="group cursor-pointer transition-colors hover:bg-amber-50/30 dark:hover:bg-slate-800/50"
                      key={document._id}
                      onClick={() => navigate(resolveRoute('/documents'))}
                    >
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatThaiDate(document.date)}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                        {document.docNo || '-'}
                      </td>
                      <td className="max-w-[250px] truncate px-6 py-4 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-900 dark:text-white dark:group-hover:text-amber-500">
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
