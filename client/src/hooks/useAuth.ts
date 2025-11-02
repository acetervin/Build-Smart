import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Login failed');
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) throw new Error('Signup failed');
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Failed to send magic link');
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-magic-link?token=${token}`);
      if (!response.ok) throw new Error('Invalid magic link');
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    // Redirect to backend Google OAuth login route
    window.location.href = "/auth/google";
  };
  const signInWithGithub = async () => {
    // Redirect to backend GitHub OAuth login route
    window.location.href = "/auth/github";
  };
  const signInWithApple = async () => {
    // Redirect to backend Apple OAuth login route
    window.location.href = "/auth/apple";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    sendMagicLink,
    verifyMagicLink,
    signInWithGoogle,
    signInWithGithub,
    signInWithApple,
  };
}
