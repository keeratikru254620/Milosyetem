import { ShieldCheck } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Navbar from '../components/common/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { APP_PATHS, getPageTitle } from '../constants/views';
import {
  previewCurrentUser,
  previewDocTypes,
  previewDocuments,
  previewUsers,
} from '../data/previewData';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { useAppState } from '../hooks/useAppState';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import { useIdleLogout } from '../hooks/useIdleLogout';
import type { SaveDocTypeInput, SaveDocumentInput, SaveUserInput } from '../types';
import AppRoutes from './AppRoutes';

export default function AppContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    setCurrentUser,
    users,
    setUsers,
    docTypes,
    setDocTypes,
    documents,
    setDocuments,
    isSidebarOpen,
    setIsSidebarOpen,
    isDarkMode,
    setIsDarkMode,
  } = useAppState();
  const isLegacyPreviewRoute =
    location.pathname === APP_PATHS.preview ||
    location.pathname.startsWith(`${APP_PATHS.preview}/`);
  const isPreviewMode = !currentUser && isLegacyPreviewRoute;
  const routePrefix = isLegacyPreviewRoute ? APP_PATHS.preview : '';
  const {
    loadAllData,
    handleDeleteDocType,
    handleDeleteDocument,
    handleDeleteUser,
    handleIdleLogout,
    handleLogin,
    handleLogout,
    handleSaveDocType,
    handleSaveDocument,
    handleSaveUser,
  } = useAppHandlers({
    currentUser,
    navigate,
    setCurrentUser,
    setDocTypes,
    setDocuments,
    setIsSidebarOpen,
    setUsers,
  });

  const isAppReady = useAppBootstrap({
    initialPathname: location.pathname,
    loadAllData,
    navigate,
    setCurrentUser,
  });

  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    document.title = pageTitle === 'Milosystem' ? pageTitle : `${pageTitle} | Milosystem`;
  }, [location.pathname]);

  useIdleLogout(currentUser, handleIdleLogout);

  const handlePreviewExit = useCallback(() => {
    setIsSidebarOpen(false);
    navigate(APP_PATHS.login);
  }, [navigate, setIsSidebarOpen]);

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

  const effectiveCurrentUser = currentUser ?? (isPreviewMode ? previewCurrentUser : null);
  const effectiveUsers = isPreviewMode && users.length === 0 ? previewUsers : users;
  const effectiveDocTypes = isPreviewMode && docTypes.length === 0 ? previewDocTypes : docTypes;
  const effectiveDocuments =
    isPreviewMode && documents.length === 0 ? previewDocuments : documents;

  if (!isAppReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
        <div className="luxury-panel flex animate-pulse flex-col items-center rounded-[2rem] px-10 py-8 text-center">
          <div className="metal-icon-shell mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem]">
            <ShieldCheck className="h-10 w-10 text-[var(--app-navy)]" />
          </div>
          <p className="luxury-kicker mb-2 text-[11px]">System Core</p>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--app-text-soft)]">
            Loading...
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
    <div className="relative flex min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_18%),radial-gradient(circle_at_82%_22%,_rgba(171,134,219,0.16),_transparent_14%),linear-gradient(180deg,_rgba(255,255,255,0.05),_transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] opacity-50" />
      <Sidebar
        currentUser={effectiveCurrentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={isPreviewMode ? handlePreviewExit : handleLogout}
        routePrefix={routePrefix}
      />

      <main className="relative z-10 flex h-screen flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="relative flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(171,134,219,0.28),transparent)] opacity-50" />
          <AppRoutes
            currentUser={effectiveCurrentUser}
            docTypes={effectiveDocTypes}
            documents={effectiveDocuments}
            isDarkMode={isDarkMode}
            onDeleteDocType={isPreviewMode ? handlePreviewDelete : handleDeleteDocType}
            onDeleteDocument={isPreviewMode ? handlePreviewDelete : handleDeleteDocument}
            onDeleteUser={isPreviewMode ? handlePreviewDelete : handleDeleteUser}
            onLogin={handleLogin}
            onSaveDocType={isPreviewMode ? handlePreviewSaveDocType : handleSaveDocType}
            onSaveDocument={isPreviewMode ? handlePreviewSaveDocument : handleSaveDocument}
            onSaveUser={isPreviewMode ? handlePreviewSaveUser : handleSaveUser}
            routePrefix={routePrefix}
            setIsDarkMode={setIsDarkMode}
            users={effectiveUsers}
          />
        </div>
      </main>
    </div>
  );
}
