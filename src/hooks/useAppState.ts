import { useState } from 'react';

import { previewDocTypes, previewDocuments } from '../data/previewData';
import type { DocType, DocumentData, User } from '../types';
import { useDarkMode } from './useDarkMode';

export const useAppState = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>(() => previewDocTypes.slice(0, 0));
  const [documents, setDocuments] = useState<DocumentData[]>(() => previewDocuments.slice(0, 0));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDarkMode, setIsDarkMode } = useDarkMode();

  return {
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
  };
};
