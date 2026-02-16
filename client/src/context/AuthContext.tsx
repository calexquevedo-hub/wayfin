import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
    token: string;
    active: boolean;
    profile?: {
        _id: string;
        name: string;
        permissions: Record<string, boolean>;
    };
}

interface AuthContextType {
    user: User | null;
    login: (userInfo: User) => void;
    updateUser: (partial: Partial<User>) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = (userInfo: User) => {
        setUser(userInfo);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    };

    const updateUser = (partial: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...partial };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, login, updateUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
