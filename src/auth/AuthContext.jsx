import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((r) => {
        if (cancelled) return;
        setUserState(r.user);
        setAccounts(r.accounts ?? []);
      })
      .catch(() => !cancelled && setUserState(null))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Pulls the signed-in account and the other accounts on the same email from the server.
  const refresh = useCallback(async () => {
    const r = await api.me();
    setUserState(r.user);
    setAccounts(r.accounts ?? []);
    return r.user;
  }, []);

  // Called after login/sign-up with the account that is now signed in.
  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) api.me().then((r) => setAccounts(r.accounts ?? [])).catch(() => {});
    else setAccounts([]);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUserState(null);
      setAccounts([]);
    }
  }, []);

  const switchTo = useCallback(async (role) => {
    const r = await api.switchAccount(role);
    await refresh();
    return r.user;
  }, [refresh]);

  const value = useMemo(() => ({ user, accounts, ready, setUser, refresh, switchTo, logout }), [user, accounts, ready, setUser, refresh, switchTo, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
