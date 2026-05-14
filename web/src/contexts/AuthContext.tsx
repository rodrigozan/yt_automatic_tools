import React, { createContext, useContext, useState } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
    picture?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER = { id: 'demo', email: 'demo@example.com', name: 'Demo User' };
const DEMO_TOKEN = 'demo-token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>((() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try { return JSON.parse(savedUser); } catch { return DEMO_USER; }
        }
        return DEMO_USER;
    })());

    const [token, setToken] = useState<string | null>(() => {
        const savedToken = localStorage.getItem('token');
        return savedToken || DEMO_TOKEN;
    });

    const login = (newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setUser(DEMO_USER);
        setToken(DEMO_TOKEN);
        localStorage.setItem('user', JSON.stringify(DEMO_USER));
        localStorage.setItem('token', DEMO_TOKEN);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: true }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
