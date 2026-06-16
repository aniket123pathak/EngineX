import { createContext, useContext, useState, useMemo } from "react";

const AuthContext = createContext(null);

/**
 * Provides authentication state and helpers to the component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, logout }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume the auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
