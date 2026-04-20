export const APP_PATHS = {
  root: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  terms: '/terms',
  privacy: '/privacy',
  dashboard: '/dashboard',
  documents: '/documents',
  docTypes: '/doctypes',
  users: '/users',
  settings: '/settings',
  settingsProfile: '/settings/profile',
  settingsGeneral: '/settings/general',
  settingsSecurity: '/settings/security',
  settingsSupport: '/settings/support',
  preview: '/preview',
} as const;

export const PAGE_TITLES: Record<string, string> = {
  [APP_PATHS.root]: 'Milosystem',
  [APP_PATHS.login]: 'เข้าสู่ระบบ',
  [APP_PATHS.register]: 'สมัครสมาชิก',
  [APP_PATHS.forgotPassword]: 'รีเซ็ตรหัสผ่าน',
  [APP_PATHS.terms]: 'เงื่อนไขการใช้งาน',
  [APP_PATHS.privacy]: 'นโยบายความเป็นส่วนตัว',
  [APP_PATHS.dashboard]: 'ภาพรวมระบบ',
  [APP_PATHS.documents]: 'ทะเบียนรับ-ส่งเอกสาร',
  [APP_PATHS.docTypes]: 'ประเภทเอกสาร',
  [APP_PATHS.users]: 'จัดการบุคลากร',
  [APP_PATHS.settings]: 'การตั้งค่าระบบ',
  [APP_PATHS.settingsProfile]: 'ข้อมูลบัญชี',
  [APP_PATHS.settingsGeneral]: 'การตั้งค่าทั่วไป',
  [APP_PATHS.settingsSecurity]: 'ความปลอดภัย',
  [APP_PATHS.settingsSupport]: 'ช่วยเหลือ',
};

export const PUBLIC_PATHS = new Set<string>([
  APP_PATHS.root,
  APP_PATHS.login,
  APP_PATHS.register,
  APP_PATHS.forgotPassword,
  APP_PATHS.terms,
  APP_PATHS.privacy,
  APP_PATHS.dashboard,
  APP_PATHS.documents,
  APP_PATHS.docTypes,
  APP_PATHS.users,
  APP_PATHS.settings,
  APP_PATHS.settingsProfile,
  APP_PATHS.settingsGeneral,
  APP_PATHS.settingsSecurity,
  APP_PATHS.settingsSupport,
]);

export const SETTINGS_TABS = [
  { id: 'profile', label: 'ข้อมูลบัญชีผู้ใช้', path: APP_PATHS.settingsProfile },
  { id: 'general', label: 'การตั้งค่าทั่วไป', path: APP_PATHS.settingsGeneral },
  { id: 'security', label: 'ความปลอดภัย', path: APP_PATHS.settingsSecurity },
  { id: 'support', label: 'ช่วยเหลือ', path: APP_PATHS.settingsSupport },
] as const;

export const normalizeAppPath = (pathname: string) => {
  if (pathname === APP_PATHS.preview || pathname.startsWith(`${APP_PATHS.preview}/`)) {
    const normalizedPreviewPath = pathname.replace(/^\/preview/, '') || APP_PATHS.root;
    return normalizedPreviewPath;
  }

  return pathname || APP_PATHS.root;
};

export const isPublicPath = (pathname: string) => {
  const normalizedPath = normalizeAppPath(pathname);
  return PUBLIC_PATHS.has(normalizedPath);
};

export const getPageTitle = (pathname: string) => {
  const normalizedPath = normalizeAppPath(pathname);
  return PAGE_TITLES[normalizedPath] ?? 'Milosystem';
};
