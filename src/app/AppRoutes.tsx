import type { Dispatch, SetStateAction } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import type {
  DocType,
  DocumentData,
  SaveDocTypeInput,
  SaveDocumentInput,
  SaveUserInput,
  User,
} from '../types';
import AuthView from '../views/AuthView';
import DashboardView from '../views/DashboardView';
import DocumentsView from '../views/DocumentsView';
import DocTypesView from '../views/DocTypesView';
import SettingsView from '../views/SettingsView';
import UsersView from '../views/UsersView';

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
  const settingsBasePath = resolveRoute('/settings');

  if (!currentUser) {
    return (
      <Routes>
        <Route element={<Navigate to="/preview/dashboard" replace />} path="/" />
        <Route element={<AuthView initialMode="login" onLogin={onLogin} />} path="/login" />
        <Route
          element={<AuthView initialMode="register" onLogin={onLogin} />}
          path="/register"
        />
        <Route
          element={<AuthView initialMode="forgot" onLogin={onLogin} />}
          path="/forgot-password"
        />
        <Route element={<Navigate to="/preview/dashboard" replace />} path="/dashboard" />
        <Route element={<Navigate to="/preview/documents" replace />} path="/documents" />
        <Route element={<Navigate to="/preview/doctypes" replace />} path="/doctypes" />
        <Route element={<Navigate to="/preview/users" replace />} path="/users" />
        <Route
          element={<Navigate to="/preview/settings/profile" replace />}
          path="/settings"
        />
        <Route
          element={<Navigate to="/preview/settings/profile" replace />}
          path="/settings/profile"
        />
        <Route
          element={<Navigate to="/preview/settings/general" replace />}
          path="/settings/general"
        />
        <Route
          element={<Navigate to="/preview/settings/security" replace />}
          path="/settings/security"
        />
        <Route
          element={<Navigate to="/preview/settings/support" replace />}
          path="/settings/support"
        />
        <Route element={<Navigate to="/preview/dashboard" replace />} path="*" />
      </Routes>
    );
  }

  return (
    <Routes>
      {routePrefix ? (
        <Route element={<Navigate to={resolveRoute('/dashboard')} replace />} path={routePrefix} />
      ) : null}
      <Route
        element={
          <DashboardView
            currentUser={currentUser}
            documents={documents}
            docTypes={docTypes}
            routePrefix={routePrefix}
          />
        }
        path={resolveRoute('/dashboard')}
      />
      <Route
        element={
          <DocumentsView
            currentUser={currentUser}
            documents={documents}
            docTypes={docTypes}
            onDeleteDocument={onDeleteDocument}
            onSaveDocument={onSaveDocument}
          />
        }
        path={resolveRoute('/documents')}
      />
      <Route
        element={
          <DocTypesView
            documents={documents}
            docTypes={docTypes}
            onDeleteDocType={onDeleteDocType}
            onSaveDocType={onSaveDocType}
          />
        }
        path={resolveRoute('/doctypes')}
      />
      <Route
        element={
          currentUser.role === 'admin' ? (
            <UsersView
              currentUser={currentUser}
              onDeleteUser={onDeleteUser}
              onSaveUser={onSaveUser}
              users={users}
            />
          ) : (
            <Navigate to={resolveRoute('/dashboard')} replace />
          )
        }
        path={resolveRoute('/users')}
      />
      <Route
        element={
          <SettingsView
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
          <SettingsView
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="profile"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute('/settings/profile')}
      />
      <Route
        element={
          <SettingsView
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="general"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute('/settings/general')}
      />
      <Route
        element={
          <SettingsView
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="security"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute('/settings/security')}
      />
      <Route
        element={
          <SettingsView
            basePath={settingsBasePath}
            currentUser={currentUser}
            initialTab="support"
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path={resolveRoute('/settings/support')}
      />
      <Route element={<Navigate to={resolveRoute('/dashboard')} replace />} path="*" />
    </Routes>
  );
}