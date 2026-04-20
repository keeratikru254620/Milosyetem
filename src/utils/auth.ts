import type { User, UserRole } from '../types';

export const DEFAULT_LOCAL_PASSWORD = '1234';

interface ErrorMessageOptions {
  duplicateMessage?: string;
  invalidCredentialsMessage?: string;
  emailNotVerifiedMessage?: string;
  disabledAccountMessage?: string;
  fallbackMessage: string;
}

export const normalizeRole = (role?: string): UserRole =>
  role === 'admin' || role === 'officer' || role === 'general' ? role : 'general';

export const normalizeIdentity = (value?: string) => (value || '').trim().toLowerCase();

export const stripPassword = (user: User): User => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const getErrorMessage = (
  error: unknown,
  {
    duplicateMessage,
    invalidCredentialsMessage,
    emailNotVerifiedMessage,
    disabledAccountMessage,
    fallbackMessage,
  }: ErrorMessageOptions,
) => {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (!message) {
      return fallbackMessage;
    }

    if (message === 'duplicate_record') {
      return duplicateMessage || fallbackMessage;
    }

    if (message === 'invalid_credentials') {
      return invalidCredentialsMessage || fallbackMessage;
    }

    if (message === 'email_not_verified') {
      return (
        emailNotVerifiedMessage ||
        'กรุณายืนยันอีเมลจากกล่องจดหมายก่อนเข้าสู่ระบบ'
      );
    }

    if (message === 'account_disabled') {
      return disabledAccountMessage || 'บัญชีนี้ถูกปิดการใช้งานแล้ว';
    }

    if (message === 'password_too_short') {
      return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (message === 'email_password_not_enabled') {
      return 'กรุณาเปิด Email/Password ใน Firebase Console ก่อนใช้งาน';
    }

    if (message === 'firebase_not_configured') {
      return 'ยังไม่ได้ตั้งค่า Firebase สำหรับโปรเจกต์นี้';
    }

    if (message === 'firebase_network_failed') {
      return 'ไม่สามารถเชื่อมต่อ Firebase ได้ในขณะนี้';
    }

    if (message === 'firebase_profile_access_denied') {
      return 'Firestore ยังไม่อนุญาตให้เข้าถึงข้อมูลผู้ใช้';
    }

    if (message === 'too_many_requests') {
      return 'มีการพยายามใช้งานมากเกินไป กรุณาลองใหม่ภายหลัง';
    }

    if (message === 'requires_recent_login') {
      return 'เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่ก่อนดำเนินการต่อ';
    }

    if (message === 'local_password_reset_not_supported') {
      return 'โหมดทดสอบในเครื่องยังไม่รองรับการส่งอีเมลรีเซ็ตรหัสผ่าน';
    }

    return message;
  }

  return fallbackMessage;
};
