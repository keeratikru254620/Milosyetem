import type { UserRole } from '../types';

export const formatThaiDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('th-TH') : '-';

export const getRoleText = (role: UserRole) => {
  if (role === 'admin') {
    return 'ผู้จัดการบุคลากร';
  }

  if (role === 'officer') {
    return 'เจ้าหน้าที่ตำรวจ';
  }

  return 'ผู้ใช้งานทั่วไป';
};
