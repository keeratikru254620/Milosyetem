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
  const resolveRoute = (path: string) => `${routePrefix}${path}`;
  const settingsBasePath = resolveRoute(APP_PATHS.settings);

  if (!currentUser) {
    return (
      <Routes>
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.root} />
        <Route element={<LoginPage onLogin={onLogin} />} path={APP_PATHS.login} />
        <Route element={<RegisterPage onLogin={onLogin} />} path={APP_PATHS.register} />
        <Route
          element={<ForgotPasswordPage onLogin={onLogin} />}
          path={APP_PATHS.forgotPassword}
        />
        <Route element={<LegalPage variant="terms" />} path={APP_PATHS.terms} />
        <Route element={<LegalPage variant="privacy" />} path={APP_PATHS.privacy} />
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.dashboard} />
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.documents} />
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.docTypes} />
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.users} />
        <Route element={<Navigate to={APP_PATHS.login} replace />} path={APP_PATHS.settings} />
        <Route
          element={<Navigate to={APP_PATHS.login} replace />}
          path={APP_PATHS.settingsProfile}
        />
        <Route
          element={<Navigate to={APP_PATHS.login} replace />}
          path={APP_PATHS.settingsGeneral}
        />
        <Route
          element={<Navigate to={APP_PATHS.login} replace />}
          path={APP_PATHS.settingsSecurity}
        />
        <Route
          element={<Navigate to={APP_PATHS.login} replace />}
          path={APP_PATHS.settingsSupport}
        />
        <Route
          element={<NotFoundPage backLabel="กลับสู่หน้าเข้าสู่ระบบ" backTo={APP_PATHS.login} />}
          path="*"
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <DashboardPage
            currentUser={currentUser}
            documents={documents}
            docTypes={docTypes}
            routePrefix={routePrefix}
          />
        }
        path={routePrefix || APP_PATHS.root}
      />
      <Route
        element={
          <DashboardPage
            currentUser={currentUser}
            documents={documents}
            docTypes={docTypes}
            routePrefix={routePrefix}
          />
        }
        path={resolveRoute(APP_PATHS.dashboard)}
      />
      <Route
        element={
          <DocumentsPage
            currentUser={currentUser}
            documents={documents}
            docTypes={docTypes}
            onDeleteDocument={onDeleteDocument}
            onSaveDocument={onSaveDocument}
          />
        }
        path={resolveRoute(APP_PATHS.documents)}
      />
      <Route
        element={
          <DocTypesPage
            documents={documents}
            docTypes={docTypes}
            onDeleteDocType={onDeleteDocType}
            onSaveDocType={onSaveDocType}
          />
        }
        path={resolveRoute(APP_PATHS.docTypes)}
      />
      <Route
        element={
          currentUser.role === 'admin' ? (
            <UsersPage
              currentUser={currentUser}
              onDeleteUser={onDeleteUser}
              onSaveUser={onSaveUser}
              users={users}
            />
          ) : (
            <Navigate to={resolveRoute(APP_PATHS.dashboard)} replace />
          )
        }
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
