import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentSession();
    setUser(current);
    return current;
  }, []);

  useEffect(() => {
    refreshUser().then((current) => {
      if (!current) setLoginModalOpen(true);
    }).finally(() => setLoading(false));
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setLoginModalOpen(true);
  }, []);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        refreshUser,
        logout,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
