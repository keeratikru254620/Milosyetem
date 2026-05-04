import type { Dispatch, SetStateAction } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { APP_PATHS } from '../constants/views';
import DashboardPage from '../pages/admin/DashboardPage';
import DocumentsPage from '../pages/admin/DocumentsPage';
import DocTypesPage from '../pages/admin/DocTypesPage';
import UsersPage from '../pages/admin/UsersPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import LegalPage from '../pages/shared/LegalPage';
import SettingsPage from '../pages/shared/SettingsPage';
import NotFoundPage from '../pages/system/NotFoundPage';
import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  User,
} from '../types';

interface AppRoutesProps {
  currentUser: User | null;
  docTypes: DocType[];
  documents: DocumentData[];
  isDarkMode: boolean;
  onDeleteDocType: (id: string) => Promise<unknown> | unknown;
  onDeleteDocument: (id: string) => Promise<unknown> | unknown;
  onDeleteUser: (id: string) => Promise<unknown> | unknown;
  onLogin: (user: User) => Promise<void> | void;
  onSaveDocType: (data: SaveDocTypeInput, id?: string) => Promise<unknown> | unknown;
  onSaveDocument: (data: SaveDocumentInput, id?: string) => Promise<unknown> | unknown;
  onSaveUser: (data: SaveUserInput, id?: string) => Promise<unknown> | unknown;
  routePrefix?: string;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  users: User[];
}

export default function AppRoutes({
  currentUser,
  docTypes,
  documents,
  isDarkMode,
  onDeleteDocType,
  onDeleteDocument,
  onDeleteUser,
  onLogin,
  onSaveDocType,
  onSaveDocument,
  onSaveUser,
  routePrefix = '',
  setIsDarkMode,
  users,
}: AppRoutesProps) {
  const resolveRoute = (path: string) =>
    path === APP_PATHS.root ? routePrefix || APP_PATHS.root : `${routePrefix}${path}`;
  const settingsBasePath = resolveRoute(APP_PATHS.settings);

  if (!currentUser) {
    return (
      <Routes>
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.root)} />
        <Route element={<LoginPage onLogin={onLogin} />} path={resolveRoute(APP_PATHS.login)} />
        <Route element={<RegisterPage onLogin={onLogin} />} path={resolveRoute(APP_PATHS.register)} />
        <Route
          element={<ForgotPasswordPage onLogin={onLogin} />}
          path={resolveRoute(APP_PATHS.forgotPassword)}
        />
        <Route element={<LegalPage variant="terms" />} path={resolveRoute(APP_PATHS.terms)} />
        <Route element={<LegalPage variant="privacy" />} path={resolveRoute(APP_PATHS.privacy)} />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.dashboard)} />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.documents)} />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.docTypes)} />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.users)} />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.admin)} />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.adminDocuments)}
        />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.adminDocTypes)}
        />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.adminUsers)}
        />
        <Route element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />} path={resolveRoute(APP_PATHS.settings)} />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.settingsProfile)}
        />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.settingsGeneral)}
        />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.settingsSecurity)}
        />
        <Route
          element={<Navigate to={resolveRoute(APP_PATHS.login)} replace />}
          path={resolveRoute(APP_PATHS.settingsSupport)}
        />
        <Route
          element={<NotFoundPage backLabel="กลับสู่หน้าเข้าสู่ระบบ" backTo={resolveRoute(APP_PATHS.login)} />}
          path="*"
        />
      </Routes>
    );
  }

  const dashboardElement = (
    <DashboardPage
      currentUser={currentUser}
      documents={documents}
      docTypes={docTypes}
      routePrefix={routePrefix}
    />
  );
  const documentsElement = (
    <DocumentsPage
      currentUser={currentUser}
      documents={documents}
      docTypes={docTypes}
      onDeleteDocument={onDeleteDocument}
      onSaveDocument={onSaveDocument}
    />
  );
  const docTypesElement = (
    <DocTypesPage
      documents={documents}
      docTypes={docTypes}
      onDeleteDocType={onDeleteDocType}
      onSaveDocType={onSaveDocType}
    />
  );
  const usersElement =
    currentUser.role === 'admin' ? (
      <UsersPage
        currentUser={currentUser}
        onDeleteUser={onDeleteUser}
        onSaveUser={onSaveUser}
        users={users}
      />
    ) : (
      <Navigate to={resolveRoute(APP_PATHS.dashboard)} replace />
    );
  const adminOnlyDocumentsElement =
    currentUser.role === 'admin' ? (
      documentsElement
    ) : (
      <Navigate to={resolveRoute(APP_PATHS.dashboard)} replace />
    );
  const adminOnlyDocTypesElement =
    currentUser.role === 'admin' ? (
      docTypesElement
    ) : (
      <Navigate to={resolveRoute(APP_PATHS.dashboard)} replace />
    );
  const adminHomeRoute =
    currentUser.role === 'admin'
      ? resolveRoute(APP_PATHS.adminUsers)
      : resolveRoute(APP_PATHS.dashboard);

  return (
    <Routes>
      <Route
        element={<Navigate to={adminHomeRoute} replace />}
        path={resolveRoute(APP_PATHS.admin)}
      />
      <Route
        element={adminOnlyDocumentsElement}
        path={resolveRoute(APP_PATHS.adminDocuments)}
      />
      <Route
        element={adminOnlyDocTypesElement}
        path={resolveRoute(APP_PATHS.adminDocTypes)}
      />
      <Route
        element={usersElement}
        path={resolveRoute(APP_PATHS.adminUsers)}
      />
      <Route
        element={dashboardElement}
        path={routePrefix || APP_PATHS.root}
      />
      <Route
        element={dashboardElement}
        path={resolveRoute(APP_PATHS.dashboard)}
      />
      <Route
        element={documentsElement}
        path={resolveRoute(APP_PATHS.documents)}
      />
      <Route
        element={docTypesElement}
        path={resolveRoute(APP_PATHS.docTypes)}
      />
      <Route
        element={usersElement}
        path={resolveRoute(APP_PATHS.users)}
      />
      <Route
        element={
          <SettingsPage
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="profile"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={settingsBasePath}
      />
      <Route
        element={
          <SettingsPage
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="profile"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute(APP_PATHS.settingsProfile)}
      />
      <Route
        element={
          <SettingsPage
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="general"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute(APP_PATHS.settingsGeneral)}
      />
      <Route
        element={
          <SettingsPage
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="security"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute(APP_PATHS.settingsSecurity)}
      />
      <Route
        element={
          <SettingsPage
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="support"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute(APP_PATHS.settingsSupport)}
      />
      <Route
        element={
          <NotFoundPage
            backLabel="กลับสู่หน้าแดชบอร์ด"
            backTo={resolveRoute(APP_PATHS.dashboard)}
          />
        }
        path="*"
      />
    </Routes>
  );
}
