import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const AUTH_URL = '/auth/realms/template/protocol/openid-connect';
const CLIENT_ID = 'microservice-template';
const CLIENT_SECRET = 'template-secret';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const parseToken = useCallback((accessToken) => {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return {
        username: payload.preferred_username || payload.sub,
        email: payload.email,
        roles: payload.realm_access?.roles || [],
        exp: payload.exp,
      };
    } catch { return null; }
  }, []);

  const saveTokens = useCallback((accessToken, refresh) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refresh);
    const u = parseToken(accessToken);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(accessToken);
    setRefreshToken(refresh);
    setUser(u);
  }, [parseToken]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(AUTH_URL + '/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || 'Login failed');
    }
    const data = await res.json();
    saveTokens(data.access_token, data.refresh_token);
    return true;
  }, [saveTokens]);

  const loginWithGoogle = useCallback(() => {
    // Redirect to Keycloak's Google IdP
    const redirectUri = window.location.origin + '/devconsole/';
    const url = `/auth/realms/template/protocol/openid-connect/auth?` +
      `client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=openid&kc_idp_hint=google`;
    window.location.href = url;
  }, []);

  const logout = useCallback(async () => {
    if (refreshToken) {
      await fetch(AUTH_URL + '/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, [refreshToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;
    try {
      const res = await fetch(AUTH_URL + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      });
      if (!res.ok) { logout(); return false; }
      const data = await res.json();
      saveTokens(data.access_token, data.refresh_token);
      return true;
    } catch { logout(); return false; }
  }, [refreshToken, saveTokens, logout]);

  // Auto-refresh before expiry
  useEffect(() => {
    if (!user?.exp) return;
    const msUntilExpiry = (user.exp * 1000) - Date.now() - 30000; // refresh 30s before
    if (msUntilExpiry <= 0) { refreshAccessToken(); return; }
    const timer = setTimeout(refreshAccessToken, msUntilExpiry);
    return () => clearTimeout(timer);
  }, [user, refreshAccessToken]);

  // Fetch helper that includes auth header
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
        return fetch(url, { ...options, headers });
      }
    }
    return res;
  }, [token, refreshAccessToken]);

  return (
    <AuthContext.Provider value={{
      token, user, isAuthenticated: !!token,
      login, loginWithGoogle, logout, authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
