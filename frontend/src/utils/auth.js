const TOKEN_KEY = 'studhelp_token';
const USER_KEY = 'studhelp_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
    const user = getUser();
    return user?.role === 'ADMIN';
};

export const isVerified = () => {
    const user = getUser();
    return user?.status === 'VERIFIED' || user?.role === 'ADMIN';
};
