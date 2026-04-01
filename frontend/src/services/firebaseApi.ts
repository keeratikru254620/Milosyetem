import {
  createUserWithEmailAndPassword,
  deleteUser as deleteCurrentAuthUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import type { SaveUserInput, User, UserRole } from '../types';
import {
  createSecondaryFirebaseApp,
  disposeFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  hasFirebaseConfig,
} from './firebaseConfig';

const USERS_COLLECTION = 'appUsers';

const nowIso = () => new Date().toISOString();

const normalizeRole = (role?: string): UserRole =>
  role === 'admin' || role === 'officer' || role === 'general' ? role : 'general';

const normalizeEmail = (value?: string) => (value || '').trim().toLowerCase();

const getFieldString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const toIsoString = (value: unknown, fallback = nowIso()) => {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return fallback;
};

const ensureFirebaseEnabled = () => {
  if (!hasFirebaseConfig) {
    throw new Error('ยังไม่ได้ตั้งค่า Firebase สำหรับ frontend กรุณาเพิ่มค่าใน frontend/.env.local ก่อน');
  }
};

const sanitizeUserRecord = (
  id: string,
  data: Partial<User> & { createdAt?: unknown; updatedAt?: unknown },
): User => ({
  _id: id,
  username: getFieldString(data.username, getFieldString(data.email, id)),
  name: getFieldString(data.name, getFieldString(data.email, 'ผู้ใช้งาน')),
  role: normalizeRole(data.role),
  avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
  phone: typeof data.phone === 'string' ? data.phone : undefined,
  email: typeof data.email === 'string' ? data.email : undefined,
});

const buildUserRecord = ({
  email,
  name,
  role,
  username,
  avatar,
  phone,
  createdAt,
}: {
  avatar?: string;
  createdAt?: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  username?: string;
}) => {
  const timestamp = nowIso();
  const normalizedEmail = normalizeEmail(email);

  return {
    username: normalizeEmail(username || normalizedEmail),
    email: normalizedEmail,
    name: name.trim(),
    role: normalizeRole(role),
    avatar: avatar?.trim() || '',
    phone: phone?.trim() || '',
    createdAt: createdAt || timestamp,
    updatedAt: timestamp,
  };
};

let initialAuthResolved = false;
let initialAuthPromise: Promise<void> | null = null;

const waitForInitialAuthState = async () => {
  ensureFirebaseEnabled();

  if (initialAuthResolved) {
    return;
  }

  if (!initialAuthPromise) {
    const auth = getFirebaseAuth();
    initialAuthPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        initialAuthResolved = true;
        unsubscribe();
        resolve();
      });
    });
  }

  await initialAuthPromise;
};

const getProfileRef = (userId: string) => doc(getFirebaseDb(), USERS_COLLECTION, userId);

const syncUserProfile = async (
  userId: string,
  payload: {
    avatar?: string;
    createdAt?: string;
    email: string;
    name: string;
    phone?: string;
    role?: string;
    username?: string;
  },
) => {
  const profileRef = getProfileRef(userId);
  const snapshot = await getDoc(profileRef);
  const existing = snapshot.exists() ? snapshot.data() : {};
  const nextRecord = {
    ...existing,
    ...buildUserRecord({
      createdAt: toIsoString(existing.createdAt, payload.createdAt || nowIso()),
      email: payload.email,
      name: payload.name,
      phone: payload.phone ?? getFieldString(existing.phone),
      role: payload.role ?? getFieldString(existing.role),
      username: payload.username ?? getFieldString(existing.username, payload.email),
      avatar: payload.avatar ?? getFieldString(existing.avatar),
    }),
  };

  await setDoc(profileRef, nextRecord, { merge: true });
  return sanitizeUserRecord(userId, nextRecord);
};

const ensureCurrentUserProfile = async () => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser || !currentUser.email) {
    return null;
  }

  return syncUserProfile(currentUser.uid, {
    avatar: currentUser.photoURL || undefined,
    email: currentUser.email,
    name: currentUser.displayName || currentUser.email.split('@')[0] || 'ผู้ใช้งาน',
    username: currentUser.email,
  });
};

const ensureVerifiedUser = async () => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  await currentUser.reload();

  if (!currentUser.emailVerified) {
    await signOut(auth);
    throw new Error('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ กรุณาตรวจสอบกล่องข้อความของคุณ');
  }

  return currentUser;
};

export const firebaseApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();
    const normalizedEmail = normalizeEmail(email);
    const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);

    await ensureVerifiedUser();

    const profile =
      (await ensureCurrentUserProfile()) ??
      sanitizeUserRecord(result.user.uid, {
        email: result.user.email || normalizedEmail,
        name: result.user.displayName || normalizedEmail,
        role: 'general',
        username: result.user.email || normalizedEmail,
      });

    return {
      user: profile,
      token: await result.user.getIdToken(),
    };
  },

  verifySession: async (): Promise<User | null> => {
    ensureFirebaseEnabled();
    await waitForInitialAuthState();

    try {
      await ensureVerifiedUser();
    } catch {
      return null;
    }

    return ensureCurrentUserProfile();
  },

  logout: () => {
    if (!hasFirebaseConfig) {
      return;
    }

    void signOut(getFirebaseAuth());
  },

  requestPasswordReset: async (email: string) => {
    ensureFirebaseEnabled();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error('กรุณาระบุอีเมลสำหรับรีเซ็ตรหัสผ่าน');
    }

    await sendPasswordResetEmail(getFirebaseAuth(), normalizedEmail);
    return true;
  },

  register: async (userData: Omit<User, '_id'>): Promise<{ user: User; token: string }> => {
    ensureFirebaseEnabled();

    const email = normalizeEmail(userData.email || userData.username);
    const password = userData.password?.trim();
    const name = userData.name?.trim();

    if (!email) {
      throw new Error('กรุณาระบุอีเมลสำหรับสมัครสมาชิก');
    }

    if (!password) {
      throw new Error('กรุณาระบุรหัสผ่าน');
    }

    if (!name) {
      throw new Error('กรุณาระบุชื่อผู้ใช้งาน');
    }

    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, {
      displayName: name,
      photoURL: userData.avatar || null,
    });

    const profile = await syncUserProfile(result.user.uid, {
      avatar: userData.avatar,
      email,
      name,
      phone: userData.phone,
      role: 'general',
      username: email,
    });

    await sendEmailVerification(result.user);
    await signOut(auth);

    return {
      user: profile,
      token: '',
    };
  },

  getUsers: async () => {
    ensureFirebaseEnabled();
    const snapshot = await getDocs(collection(getFirebaseDb(), USERS_COLLECTION));

    return snapshot.docs
      .map((docSnapshot) => sanitizeUserRecord(docSnapshot.id, docSnapshot.data()))
      .sort((left, right) => left.name.localeCompare(right.name, 'th'));
  },

  saveUser: async (payload: SaveUserInput, id?: string) => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    if (!id) {
      const email = normalizeEmail(payload.email || payload.username);
      const password = payload.password?.trim();
      const name = payload.name?.trim();

      if (!email || !password || !name) {
        throw new Error('กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบ');
      }

      const secondaryApp = createSecondaryFirebaseApp();
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);

        await updateProfile(result.user, {
          displayName: name,
          photoURL: payload.avatar || null,
        });

        await sendEmailVerification(result.user);

        const record = buildUserRecord({
          avatar: payload.avatar,
          email,
          name,
          phone: payload.phone,
          role: payload.role,
          username: email,
        });

        await setDoc(doc(db, USERS_COLLECTION, result.user.uid), record, { merge: true });
        return sanitizeUserRecord(result.user.uid, record);
      } finally {
        await signOut(secondaryAuth).catch(() => undefined);
        await disposeFirebaseApp(secondaryApp).catch(() => undefined);
      }
    }

    const profileRef = doc(db, USERS_COLLECTION, id);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข');
    }

    const existing = snapshot.data();
    const isCurrentUser = auth.currentUser?.uid === id;
    const nextRecord = {
      ...existing,
      name: payload.name !== undefined ? payload.name.trim() : getFieldString(existing.name),
      role:
        payload.role !== undefined ? normalizeRole(payload.role) : normalizeRole(existing.role),
      phone:
        payload.phone !== undefined ? payload.phone.trim() : getFieldString(existing.phone),
      avatar:
        payload.avatar !== undefined ? payload.avatar.trim() : getFieldString(existing.avatar),
      updatedAt: nowIso(),
    };

    if (payload.password?.trim()) {
      if (!isCurrentUser || !auth.currentUser) {
        throw new Error(
          'การเปลี่ยนรหัสผ่านผู้ใช้อื่นต้องทำผ่านระบบหลังบ้านหรือ Firebase Admin SDK',
        );
      }

      await updatePassword(auth.currentUser, payload.password.trim());
    }

    if (isCurrentUser && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: nextRecord.name,
        photoURL: nextRecord.avatar || null,
      });
    }

    await setDoc(profileRef, nextRecord, { merge: true });
    return sanitizeUserRecord(id, nextRecord);
  },

  deleteUser: async (id: string) => {
    ensureFirebaseEnabled();
    const auth = getFirebaseAuth();

    if (!auth.currentUser || auth.currentUser.uid !== id) {
      throw new Error('การลบผู้ใช้อื่นต้องทำผ่านระบบหลังบ้านหรือ Firebase Admin SDK');
    }

    await deleteDoc(doc(getFirebaseDb(), USERS_COLLECTION, id));
    await deleteCurrentAuthUser(auth.currentUser);
    return true;
  },
};
