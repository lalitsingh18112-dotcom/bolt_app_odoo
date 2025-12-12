import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  uid: number | null;
  username: string | null;
  password: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [uid, setUid] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const storedUid = localStorage.getItem('uid');
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');

    if (storedUid && storedUsername && storedPassword) {
      setUid(parseInt(storedUid));
      setUsername(storedUsername);
      setPassword(storedPassword);
    }
  }, []);

  const login = async (user: string, pass: string): Promise<boolean> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/odoo-auth`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const data = await response.json();

      if (data.uid) {
        setUid(data.uid);
        setUsername(user);
        setPassword(pass);
        localStorage.setItem('uid', data.uid.toString());
        localStorage.setItem('username', user);
        localStorage.setItem('password', pass);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUid(null);
    setUsername(null);
    setPassword(null);
    localStorage.removeItem('uid');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
  };

  return (
    <AuthContext.Provider
      value={{
        uid,
        username,
        password,
        login,
        logout,
        isAuthenticated: !!uid,
      }}
    >
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
