import type { UserRole } from '../types';

export const formatThaiDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('th-TH') : '-';

export const getRoleText = (role: UserRole) => {
  if (role === 'admin') {
    return 'ADMINISTRATOR';
  }

  if (role === 'general') {
    return 'GENERAL USER';
  }

  return 'OFFICER';
};

const normalizePagePath = (pathname: string) => {
  const previewPath = pathname.startsWith('/preview')
    ? pathname.replace('/preview', '') || '/'
    : pathname;

  if (previewPath.startsWith('/settings')) {
    return '/settings';
  }

  return previewPath;
};

export const getPageTitle = (pathname: string) => {
  const normalizedPath = normalizePagePath(pathname);
  const titles: Record<string, string> = {
    '/dashboard': 'ภาพรวมระบบ',
    '/documents': 'ทะเบียนรับ-ส่งเอกสาร',
    '/doctypes': 'ประเภทเอกสาร',
    '/users': 'จัดการบุคลากร',
    '/settings': 'การตั้งค่าระบบ',
  };

  return titles[normalizedPath] ?? '';
};