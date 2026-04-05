import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "customer" | "provider" | "admin";
export type ProviderType = "salon" | "freelancer";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  providerType?: ProviderType;
  avatar?: string;
  rating?: number;
  totalOrders?: number;
  walletBalance?: number;
  isVerified?: boolean;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  providerType?: ProviderType;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "alam_zomorod_user";

const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "سارة أحمد",
    phone: "0501234567",
    role: "customer",
    avatar: undefined,
    rating: 4.8,
    totalOrders: 23,
    walletBalance: 0,
    isVerified: true,
    location: { lat: 24.7136, lng: 46.6753, address: "الرياض، حي النزهة" },
  },
  {
    id: "2",
    name: "نور الجمال",
    phone: "0509876543",
    role: "provider",
    providerType: "freelancer",
    avatar: undefined,
    rating: 4.9,
    totalOrders: 87,
    walletBalance: 1250,
    isVerified: true,
    location: { lat: 24.72, lng: 46.68, address: "الرياض، حي الملك فهد" },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const found = MOCK_USERS.find((u) => u.phone === phone) || MOCK_USERS[0];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      setUser(found);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        phone: data.phone,
        role: data.role,
        providerType: data.providerType,
        rating: 0,
        totalOrders: 0,
        walletBalance: 0,
        isVerified: false,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
