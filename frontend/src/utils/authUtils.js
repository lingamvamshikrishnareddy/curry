import { refreshTokens } from '../services/api';

export const getStoredAuth = () => {
  const storedAuth = localStorage.getItem('auth');
  return storedAuth ? JSON.parse(storedAuth) : null;
};

export const setStoredAuth = (auth) => {
  localStorage.setItem('auth', JSON.stringify(auth));
};

export const removeStoredAuth = () => {
  localStorage.removeItem('auth');
};

export const refreshAuthToken = async (refreshToken) => {
  try {
    const { token, refreshToken: newRefreshToken } = await refreshTokens(refreshToken);
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      storedAuth.token = token;
      storedAuth.refreshToken = newRefreshToken;
      setStoredAuth(storedAuth);
    }
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    removeStoredAuth();
    return false;
  }
};