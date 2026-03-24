import { ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useDarkMode } from '../hooks/useDarkMode';
import { useIdleLogout } from '../hooks/useIdleLogout';
import { api } from '../services/api';
import { confirmDialog } from '../services/confirmService';
import type {
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  User,
} from '../types';
import AppRoutes from './AppRoutes';
import {
  previewCurrentUser,
  previewDocTypes,
  previewDocuments,
  previewUsers,
} from './previewData';

export default function AppContainer() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [docTypes, setDocTypes] = useState(previewDocTypes.slice(0, 0));
  const [documents, setDocuments] = useState(previewDocuments.slice(0, 0));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const isPreviewRoute =
    location.pathname === '/preview' || location.pathname.startsWith('/preview/');
  const routePrefix = isPreviewRoute ? '/preview' : '';

  const loadAllData = useCallback(async () => {
    const [loadedUsers, loadedDocTypes, loadedDocuments] = await Promise.all([
      api.getUsers(),
      api.getDocTypes(),
      api.getDocuments(),
    ]);
    setUsers(loadedUsers);
    setDocTypes(loadedDocTypes);
    setDocuments(loadedDocuments);
  }, []);

  const isAppReady = useAppBootstrap({
    initialPathname: location.pathname,
    loadAllData,
    navigate,
    setCurrentUser,
  });

  const handleLogout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  const handleIdleLogout = useCallback(async () => {
    const confirmed = await confirmDialog(
      'เซสชันหมดอายุ',
      'ระบบจะตัดการเชื่อมต่ออัตโนมัติเนื่องจากไม่มีการใช้งานเกิน 15 นาที เพื่อความปลอดภัย',
    );

    if (confirmed || !confirmed) {
      handleLogout();
    }
  }, [handleLogout]);

  useIdleLogout(currentUser, handleIdleLogout);

  const handleLogin = useCallback(
    async (user: User) => {
      setCurrentUser(user);
      await loadAllData();
      navigate('/dashboard');
    },
    [loadAllData, navigate],
  );

  const handleSaveUser = useCallback(
    async (data: SaveUserInput, id?: string) => {
      const savedUser = await api.saveUser(data, id);
      await loadAllData();
      setCurrentUser((previous) =>
        previous && previous._id === savedUser._id ? { ...previous, ...savedUser } : previous,
      );
      return savedUser;
    },
    [loadAllData],
  );

  const handleDeleteUser = useCallback(
    async (id: string) => {
      await api.deleteUser(id);
      await loadAllData();
    },
    [loadAllData],
  );

  const handleSaveDocType = useCallback(
    async (data: SaveDocTypeInput, id?: string) => {
      const savedDocType = await api.saveDocType(data, id);
      await loadAllData();
      return savedDocType;
    },
    [loadAllData],
  );

  const handleDeleteDocType = useCallback(
    async (id: string) => {
      await api.deleteDocType(id);
      await loadAllData();
    },
    [loadAllData],
  );

  const handleSaveDocument = useCallback(
    async (data: SaveDocumentInput, id?: string) => {
      const savedDocument = await api.saveDocument(data, id);
      await loadAllData();
      return savedDocument;
    },
    [loadAllData],
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      await api.deleteDocument(id);
      await loadAllData();
    },
    [loadAllData],
  );

  const handlePreviewExit = useCallback(() => {
    setIsSidebarOpen(false);
    navigate('/login');
  }, [navigate]);

  const handlePreviewDelete = useCallback(async (_id: string) => true, []);

  const handlePreviewSaveUser = useCallback(async (data: SaveUserInput, id?: string) => {
    const baseUser = previewUsers.find((item) => item._id === id) ?? previewCurrentUser;

    return {
      ...baseUser,
      ...data,
      _id: id ?? baseUser._id,
      username: data.username ?? baseUser.username,
      name: data.name ?? baseUser.name,
      role: data.role ?? baseUser.role,
    };
  }, []);

  const handlePreviewSaveDocType = useCallback(async (data: SaveDocTypeInput, id?: string) => {
    const baseDocType = previewDocTypes.find((item) => item._id === id) ?? previewDocTypes[0];

    return {
      ...baseDocType,
      ...data,
      _id: id ?? baseDocType._id,
      name: data.name ?? baseDocType.name,
      color: data.color ?? baseDocType.color,
    };
  }, []);

  const handlePreviewSaveDocument = useCallback(
    async (data: SaveDocumentInput, id?: string) => {
      const baseDocument =
        previewDocuments.find((item) => item._id === id) ?? previewDocuments[0];

      return {
        ...baseDocument,
        ...data,
        _id: id ?? baseDocument._id,
        createdAt: baseDocument.createdAt,
        files: data.files ?? baseDocument.files,
      };
    },
    [],
  );

  const effectiveCurrentUser = currentUser ?? (isPreviewRoute ? previewCurrentUser : null);
  const effectiveUsers = isPreviewRoute && users.length === 0 ? previewUsers : users;
  const effectiveDocTypes = isPreviewRoute && docTypes.length === 0 ? previewDocTypes : docTypes;
  const effectiveDocuments =
    isPreviewRoute && documents.length === 0 ? previewDocuments : documents;

  if (!isAppReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex animate-pulse flex-col items-center">
          <div className="relative">
            <ShieldCheck className="mb-4 h-16 w-16 text-amber-500" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveCurrentUser) {
    return (
      <AppRoutes
        currentUser={null}
        docTypes={[]}
        documents={[]}
        isDarkMode={isDarkMode}
        onDeleteDocType={handleDeleteDocType}
        onDeleteDocument={handleDeleteDocument}
        onDeleteUser={handleDeleteUser}
        onLogin={handleLogin}
        onSaveDocType={handleSaveDocType}
        onSaveDocument={handleSaveDocument}
        onSaveUser={handleSaveUser}
        setIsDarkMode={setIsDarkMode}
        users={[]}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 transition-colors duration-300 dark:bg-[#0B1120] dark:text-slate-200">
      <Sidebar
        currentUser={effectiveCurrentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={isPreviewRoute ? handlePreviewExit : handleLogout}
        routePrefix={routePrefix}
      />

      <main className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="relative flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AppRoutes
            currentUser={effectiveCurrentUser}
            docTypes={effectiveDocTypes}
            documents={effectiveDocuments}
            isDarkMode={isDarkMode}
            onDeleteDocType={isPreviewRoute ? handlePreviewDelete : handleDeleteDocType}
            onDeleteDocument={isPreviewRoute ? handlePreviewDelete : handleDeleteDocument}
            onDeleteUser={isPreviewRoute ? handlePreviewDelete : handleDeleteUser}
            onLogin={handleLogin}
            onSaveDocType={isPreviewRoute ? handlePreviewSaveDocType : handleSaveDocType}
            onSaveDocument={isPreviewRoute ? handlePreviewSaveDocument : handleSaveDocument}
            onSaveUser={isPreviewRoute ? handlePreviewSaveUser : handleSaveUser}
            routePrefix={routePrefix}
            setIsDarkMode={setIsDarkMode}
            users={effectiveUsers}
          />
        </div>
      </main>
    </div>
  );
}