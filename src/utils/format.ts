import type { UserRole } from '../types';

export const formatThaiDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('th-TH') : '-';

export const getRoleText = (role: UserRole) => {
  if (role === 'admin') {
    return 'เจ้าหน้าที่ตำรวจ';
  }

  if (role === 'general') {
    return 'ผู้ใช้งานทั่วไป';
  }

  return 'เจ้าหน้าที่';
};
