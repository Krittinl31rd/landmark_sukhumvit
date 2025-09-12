import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAuth({ token, user: decoded });
      } catch (e) {
        localStorage.removeItem("token");
        setAuth(null);
      }
    }
  }, []);

  const login = (token) => {
    const user = jwtDecode(token);
    setAuth({ token, user });
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider value={{ auth, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);
