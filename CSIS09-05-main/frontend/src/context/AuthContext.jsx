import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, setToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    apiFetch("/api/auth/me")
      .then((u) => setUser(u))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function signin(email, password) {
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function signup(email, password, name = null, avatar = null, age = null, phone = null, location = null) {
    try {
      const data = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, name, avatar, age, phone, location }),
      });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function updateProfile(updates) {
    try {
      const data = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function changePassword(oldPassword, newPassword) {
    try {
      await apiFetch("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function signout() {
    setUser(null);
    setToken(null);
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, signin, signup, signout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
