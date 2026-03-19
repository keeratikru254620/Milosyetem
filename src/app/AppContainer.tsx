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
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  User,
} from '../types';
import AppRoutes from './AppRoutes';

export default function AppContainer() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, setIsDarkMode } = useDarkMode();

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

  if (!currentUser) {
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
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="relative flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AppRoutes
            currentUser={currentUser}
            docTypes={docTypes}
            documents={documents}
            isDarkMode={isDarkMode}
            onDeleteDocType={handleDeleteDocType}
            onDeleteDocument={handleDeleteDocument}
            onDeleteUser={handleDeleteUser}
            onLogin={handleLogin}
            onSaveDocType={handleSaveDocType}
            onSaveDocument={handleSaveDocument}
            onSaveUser={handleSaveUser}
            setIsDarkMode={setIsDarkMode}
            users={users}
          />
        </div>
      </main>
    </div>
  );
}
