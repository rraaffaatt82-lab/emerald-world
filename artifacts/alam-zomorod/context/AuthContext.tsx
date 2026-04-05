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
  location?: { lat: number; lng: number; address: string };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
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
    rating: 4.8,
    totalOrders: 23,
    walletBalance: 0,
    isVerified: true,
    location: { lat: 24.7136, lng: 46.6753, address: "الرياض، حي النزهة" },
  },
  {
    id: "2",
    name: "فاطمة محمد",
    phone: "0507654321",
    role: "customer",
    rating: 4.5,
    totalOrders: 10,
    walletBalance: 50,
    isVerified: true,
    location: { lat: 24.714, lng: 46.672, address: "الرياض، حي الملز" },
  },
  {
    id: "p1",
    name: "نور الجمال",
    phone: "0501234001",
    role: "provider",
    providerType: "freelancer",
    rating: 4.9,
    totalOrders: 234,
    walletBalance: 1250,
    isVerified: true,
    location: { lat: 24.72, lng: 46.68, address: "الرياض، حي الملك فهد" },
  },
  {
    id: "p2",
    name: "صالون لمسة",
    phone: "0501234002",
    role: "provider",
    providerType: "salon",
    rating: 4.7,
    totalOrders: 456,
    walletBalance: 3200,
    isVerified: true,
    location: { lat: 24.71, lng: 46.67, address: "الرياض، حي العليا" },
  },
  {
    id: "p3",
    name: "هناء الجمالية",
    phone: "0501234003",
    role: "provider",
    providerType: "freelancer",
    rating: 4.6,
    totalOrders: 123,
    walletBalance: 890,
    isVerified: true,
    location: { lat: 24.73, lng: 46.69, address: "الرياض، حي الروضة" },
  },
  {
    id: "p5",
    name: "ريم بيوتي",
    phone: "0501234005",
    role: "provider",
    providerType: "freelancer",
    rating: 0,
    totalOrders: 0,
    walletBalance: 0,
    isVerified: false,
    location: { lat: 24.718, lng: 46.671, address: "الرياض، حي الياسمين" },
  },
  {
    id: "admin1",
    name: "مدير النظام",
    phone: "0500000000",
    role: "admin",
    isVerified: true,
  },
];

const MOCK_PASSWORDS: Record<string, string> = {
  "0501234567": "1234",
  "0507654321": "1234",
  "0501234001": "1234",
  "0501234002": "1234",
  "0501234003": "1234",
  "0501234005": "1234",
  "0500000000": "admin123",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {} finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const found = MOCK_USERS.find((u) => u.phone === phone);
      if (!found) {
        return { success: false, error: "رقم الهاتف غير مسجل" };
      }
      const expectedPass = MOCK_PASSWORDS[phone];
      if (expectedPass && password !== expectedPass) {
        return { success: false, error: "كلمة المرور غير صحيحة" };
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      setUser(found);
      return { success: true, role: found.role };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const newUser: User = {
        id: data.role === "provider" ? "p" + Date.now() : String(Date.now()),
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
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
