"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  customerDisplayName,
  medusaBrowserFetch,
  type MedusaAddress,
  type MedusaCustomer,
} from "./medusa-browser";

const TOKEN_KEY = "photon-customer-token-v1";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  customer: MedusaCustomer | null;
  addresses: MedusaAddress[];
  displayName: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  createAddress: (body: Record<string, unknown>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (input: {
    email: string;
    password: string;
    token: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(token: string) {
  const data = await medusaBrowserFetch<{ customer: MedusaCustomer }>({
    path: "/store/customers/me",
    token,
  });
  return data.customer;
}

async function fetchAddresses(token: string) {
  const data = await medusaBrowserFetch<{ addresses: MedusaAddress[] }>({
    path: "/store/customers/me/addresses",
    token,
  });
  return data.addresses ?? [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<MedusaCustomer | null>(null);
  const [addresses, setAddresses] = useState<MedusaAddress[]>([]);

  const hydrate = useCallback(async (nextToken: string | null) => {
    if (!nextToken) {
      setToken(null);
      setCustomer(null);
      setAddresses([]);
      return;
    }
    try {
      const [me, addrs] = await Promise.all([
        fetchMe(nextToken),
        fetchAddresses(nextToken),
      ]);
      setToken(nextToken);
      setCustomer(me);
      setAddresses(addrs);
      localStorage.setItem(TOKEN_KEY, nextToken);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCustomer(null);
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    void hydrate(saved).finally(() => setReady(true));
  }, [hydrate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await medusaBrowserFetch<{ token: string }>({
        path: "/auth/customer/emailpass",
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      await hydrate(data.token);
    },
    [hydrate]
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
    }) => {
      const email = input.email.trim().toLowerCase();
      const { token: registerToken } = await medusaBrowserFetch<{
        token: string;
      }>({
        path: "/auth/customer/emailpass/register",
        method: "POST",
        body: { email, password: input.password },
      });

      await medusaBrowserFetch<{ customer: MedusaCustomer }>({
        path: "/store/customers",
        method: "POST",
        token: registerToken,
        body: {
          email,
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          phone: input.phone.trim(),
        },
      });

      const { token: loginToken } = await medusaBrowserFetch<{ token: string }>({
        path: "/auth/customer/emailpass",
        method: "POST",
        body: { email, password: input.password },
      });
      await hydrate(loginToken);
    },
    [hydrate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
    setAddresses([]);
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (!token) return;
    setCustomer(await fetchMe(token));
  }, [token]);

  const refreshAddresses = useCallback(async () => {
    if (!token) return;
    setAddresses(await fetchAddresses(token));
  }, [token]);

  const createAddress = useCallback(
    async (body: Record<string, unknown>) => {
      if (!token) throw new Error("Not signed in");
      await medusaBrowserFetch({
        path: "/store/customers/me/addresses",
        method: "POST",
        token,
        body,
      });
      await refreshAddresses();
    },
    [token, refreshAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Not signed in");
      await medusaBrowserFetch({
        path: `/store/customers/me/addresses/${id}`,
        method: "DELETE",
        token,
      });
      await refreshAddresses();
    },
    [token, refreshAddresses]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await medusaBrowserFetch({
      path: "/auth/customer/emailpass/reset-password",
      method: "POST",
      body: { identifier: email.trim().toLowerCase() },
    });
  }, []);

  const resetPassword = useCallback(
    async (input: { email: string; password: string; token: string }) => {
      await medusaBrowserFetch({
        path: "/auth/customer/emailpass/update",
        method: "POST",
        token: input.token,
        body: {
          email: input.email.trim().toLowerCase(),
          password: input.password,
        },
      });
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      customer,
      addresses,
      displayName: customer ? customerDisplayName(customer) : null,
      login,
      register,
      logout,
      refreshCustomer,
      refreshAddresses,
      createAddress,
      deleteAddress,
      requestPasswordReset,
      resetPassword,
    }),
    [
      ready,
      token,
      customer,
      addresses,
      login,
      register,
      logout,
      refreshCustomer,
      refreshAddresses,
      createAddress,
      deleteAddress,
      requestPasswordReset,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
