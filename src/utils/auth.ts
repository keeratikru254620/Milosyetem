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

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());

export const isStrongPassword = (password: string) => {
  const trimmed = (password || '').trim();
  return (
    trimmed.length >= 8 &&
    /[a-z]/.test(trimmed) &&
    /[A-Z]/.test(trimmed) &&
    /[0-9]/.test(trimmed) &&
    /[^A-Za-z0-9]/.test(trimmed)
  );
};

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

    if (message === 'email_not_verified_verification_sent') {
      return 'ส่งอีเมลยืนยันให้ใหม่แล้ว กรุณาตรวจสอบกล่องจดหมายหรือ Spam ก่อนเข้าสู่ระบบ';
    }

    if (message === 'account_disabled') {
      return disabledAccountMessage || 'บัญชีนี้ถูกปิดการใช้งานแล้ว';
    }

    if (message === 'password_too_short') {
      return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
    }

    if (message === 'password_too_weak') {
      return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
    }

    if (message === 'email_password_not_enabled') {
      return 'กรุณาเปิด Email/Password ใน Firebase Console ก่อนใช้งาน';
    }

    if (message === 'firebase_not_configured') {
      return 'ยังไม่ได้ตั้งค่า Firebase สำหรับโปรเจ็กต์นี้';
    }

    if (message === 'firebase_unauthorized_domain') {
      return 'This domain is not authorized in Firebase Authentication (Authorized domains).';
    }

    if (message === 'firebase_network_failed') {
      return 'ไม่สามารถเชื่อมต่อ Firebase ได้ในขณะนี้';
    }

    if (message === 'firebase_profile_access_denied') {
      return 'Firestore ยังไม่อนุญาตให้เข้าถึงข้อมูลผู้ใช้';
    }

    if (message === 'firebase_data_access_denied') {
      return 'บัญชีนี้ยังไม่มีสิทธิ์อ่านหรือเขียนข้อมูลใน Firestore หรือ Storage';
    }

    if (message === 'firebase_quota_exceeded') {
      return 'พื้นที่หรือโควต้าของ Firebase ไม่เพียงพอสำหรับการดำเนินการนี้';
    }

    if (message === 'storage_upload_timeout') {
      return 'อัปโหลดไฟล์ไป Firebase Storage นานเกินไป กรุณาตรวจสอบอินเทอร์เน็ตหรือสิทธิ์ Storage แล้วลองใหม่';
    }

    if (message === 'storage_download_url_timeout') {
      return 'อัปโหลดไฟล์สำเร็จแต่ขอ URL ไฟล์ไม่สำเร็จ กรุณาตรวจสอบ Firebase Storage rules';
    }

    if (message === 'firestore_save_timeout') {
      return 'บันทึกข้อมูลลง Firestore นานเกินไป กรุณาตรวจสอบสิทธิ์ Firestore แล้วลองใหม่';
    }

    if (message === 'record_not_found') {
      return 'ไม่พบข้อมูลที่ต้องการ';
    }

    if (message === 'role_change_requires_admin') {
      return 'การเปลี่ยนสิทธิ์ผู้ใช้งานต้องดำเนินการโดยผู้ดูแลระบบ';
    }

    if (message === 'registered_role_mismatch') {
      return 'Unable to assign the selected account role. Please try another email or contact an admin.';
    }

    if (message === 'firebase_user_creation_requires_backend') {
      return 'โหมด Firebase ยังไม่รองรับการสร้างผู้ใช้ใหม่จากหน้าแอดมินโดยตรง ต้องให้ผู้ใช้สมัครเองหรือมี backend/admin SDK';
    }

    if (message === 'firebase_user_deletion_requires_backend') {
      return 'โหมด Firebase ยังไม่รองรับการลบผู้ใช้จากหน้าแอดมินโดยตรง ต้องมี backend/admin SDK';
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

