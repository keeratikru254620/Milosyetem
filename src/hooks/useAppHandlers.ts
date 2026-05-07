import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { APP_PATHS } from '../constants/views';
import { previewDocTypes } from '../data/previewData';
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

interface UseAppHandlersArgs {
  currentUser: User | null;
  navigate: NavigateFunction;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  setDocTypes: Dispatch<SetStateAction<DocType[]>>;
  setDocuments: Dispatch<SetStateAction<DocumentData[]>>;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
}

const upsertById = <T extends { _id: string }>(items: T[], nextItem: T) => {
  const exists = items.some((item) => item._id === nextItem._id);

  return exists
    ? items.map((item) => (item._id === nextItem._id ? nextItem : item))
    : [nextItem, ...items];
};

export const useAppHandlers = ({
  currentUser,
  navigate,
  setCurrentUser,
  setDocTypes,
  setDocuments,
  setIsSidebarOpen,
  setUsers,
}: UseAppHandlersArgs) => {
  const loadUsersOnly = useCallback(
    async (targetUser: User | null = currentUser) => {
      if (targetUser?.role !== 'admin') {
        setUsers([]);
        return;
      }

      try {
        setUsers(await api.getUsers());
      } catch (error) {
        console.warn('Unable to load users:', error);
      }
    },
    [currentUser, setUsers],
  );

  const loadDocTypesOnly = useCallback(async () => {
    try {
      const loadedDocTypes = await api.getDocTypes();
      setDocTypes(loadedDocTypes.length > 0 ? loadedDocTypes : previewDocTypes);
    } catch (error) {
      console.warn('Unable to load document types:', error);
      setDocTypes(previewDocTypes);
    }
  }, [setDocTypes]);

  const loadDocumentsOnly = useCallback(async () => {
    try {
      setDocuments(await api.getDocuments());
    } catch (error) {
      console.warn('Unable to load documents:', error);
    }
  }, [setDocuments]);

  const loadAllData = useCallback(
    async (targetUser: User | null = currentUser) => {
      const [loadedUsers, loadedDocTypes, loadedDocuments] = await Promise.allSettled([
        targetUser?.role === 'admin' ? api.getUsers() : Promise.resolve([]),
        api.getDocTypes(),
        api.getDocuments(),
      ]);

      if (loadedUsers.status === 'fulfilled') {
        setUsers(loadedUsers.value);
      } else {
        console.warn('Unable to load users:', loadedUsers.reason);
      }

      if (loadedDocTypes.status === 'fulfilled') {
        setDocTypes(loadedDocTypes.value.length > 0 ? loadedDocTypes.value : previewDocTypes);
      } else {
        console.warn('Unable to load document types:', loadedDocTypes.reason);
        setDocTypes(previewDocTypes);
      }

      if (loadedDocuments.status === 'fulfilled') {
        setDocuments(loadedDocuments.value);
      } else {
        console.warn('Unable to load documents:', loadedDocuments.reason);
      }
    },
    [currentUser, setDocTypes, setDocuments, setUsers],
  );

  const handleLogout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
    setIsSidebarOpen(false);
    navigate(APP_PATHS.login);
  }, [navigate, setCurrentUser, setIsSidebarOpen]);

  const handleIdleLogout = useCallback(async () => {
    await confirmDialog(
      'เซสชันหมดอายุ',
      'ระบบจะออกจากระบบให้อัตโนมัติเมื่อไม่มีการใช้งานเป็นเวลา 15 นาทีเพื่อความปลอดภัย',
    );
    handleLogout();
  }, [handleLogout]);

  const handleLogin = useCallback(
    async (user: User) => {
      setCurrentUser(user);
      await loadAllData(user);
      navigate(user.role === 'admin' ? APP_PATHS.adminUsers : APP_PATHS.dashboard);
    },
    [loadAllData, navigate, setCurrentUser],
  );

  const handleSaveUser = useCallback(
    async (data: SaveUserInput, id?: string) => {
      const savedUser = await api.saveUser(data, id);
      await loadUsersOnly();
      setCurrentUser((previous) =>
        previous && previous._id === savedUser._id ? { ...previous, ...savedUser } : previous,
      );
      return savedUser;
    },
    [loadUsersOnly, setCurrentUser],
  );

  const handleDeleteUser = useCallback(
    async (id: string) => {
      await api.deleteUser(id);
      await loadUsersOnly();
    },
    [loadUsersOnly],
  );

  const handleSaveDocType = useCallback(
    async (data: SaveDocTypeInput, id?: string) => {
      const savedDocType = await api.saveDocType(data, id);
      await loadDocTypesOnly();
      return savedDocType;
    },
    [loadDocTypesOnly],
  );

  const handleDeleteDocType = useCallback(
    async (id: string) => {
      await api.deleteDocType(id);
      await loadDocTypesOnly();
    },
    [loadDocTypesOnly],
  );

  const handleSaveDocument = useCallback(
    async (data: SaveDocumentInput, id?: string) => {
      const savedDocument = await api.saveDocument(data, id);
      setDocuments((current) => upsertById(current, savedDocument));
      await loadDocumentsOnly();
      return savedDocument;
    },
    [loadDocumentsOnly, setDocuments],
  );

  const handleDeleteDocument = useCallback(
    async (id: string) => {
      await api.deleteDocument(id);
      await loadDocumentsOnly();
    },
    [loadDocumentsOnly],
  );

  return {
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
  };
};
