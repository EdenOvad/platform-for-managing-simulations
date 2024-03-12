export const getToken = (): any => {
    return localStorage.getItem('accessToken');
};

export const getUserData = (): any => {
    return localStorage.getItem('userData') || null;
};

export const removeToken = (): void => {
    localStorage.removeItem('accessToken');
};

export const setToken = (val: string): void => {
    localStorage.setItem('accessToken', val);
};
