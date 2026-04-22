import type { UserRole } from '../types';

export const formatThaiDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('th-TH') : '-';

export const getRoleText = (role: UserRole) => {
  if (role === 'admin') {
    return 'ผู้ดูแลระบบ';
  }

  if (role === 'general') {
    return 'เจ้าหน้าที่ตำรวจ';
  }

  return 'เจ้าหน้าที่';
};
