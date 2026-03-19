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
  setIsDarkMode,
  users,
}: AppRoutesProps) {
  if (!currentUser) {
    return <AuthView onLogin={onLogin} />;
  }

  return (
    <Routes>
      <Route
        element={
          <DashboardView currentUser={currentUser} documents={documents} docTypes={docTypes} />
        }
        path="/dashboard"
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
        path="/documents"
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
        path="/doctypes"
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
            <Navigate to="/dashboard" />
          )
        }
        path="/users"
      />
      <Route
        element={
          <SettingsView
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            onSaveUser={onSaveUser}
            setIsDarkMode={setIsDarkMode}
          />
        }
        path="/settings"
      />
      <Route element={<Navigate to="/dashboard" />} path="*" />
    </Routes>
  );
}
