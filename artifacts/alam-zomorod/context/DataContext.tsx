import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  servicesCount: number;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  duration: number;
}

export interface Provider {
  id: string;
  name: string;
  type: "salon" | "freelancer";
  avatarColor?: string;
  rating: number;
  reviewsCount: number;
  totalOrders: number;
  distance: number;
  isAvailable: boolean;
  location: { lat: number; lng: number; address: string };
  services: string[];
  bio: string;
  isVerified: boolean;
  walletBalance: number;
  phone?: string;
  idVerified?: boolean;
  status: "pending" | "approved" | "suspended";
  joinedAt: string;
  commission: number;
  freeServicesLeft: number;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  status:
    | "pending"
    | "offers_received"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled";
  address: string;
  scheduledAt: string;
  notes?: string;
  rating?: number;
  review?: string;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  price?: number;
  contactRevealed: boolean;
  createdAt: string;
  offers: Offer[];
  radiusKm: number;
}

export interface Offer {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerTotalOrders: number;
  providerType: "salon" | "freelancer";
  isVerified: boolean;
  price: number;
  eta: number;
  note?: string;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  contactPhone?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

export interface SystemSettings {
  radiusKm: number;
  offerWindowMinutes: number;
  commissionPercent: number;
  minOfferAmount: number;
}

interface DataContextType {
  categories: Category[];
  services: Service[];
  providers: Provider[];
  requests: ServiceRequest[];
  walletTransactions: WalletTransaction[];
  systemSettings: SystemSettings;
  addRequest: (req: Omit<ServiceRequest, "id" | "createdAt" | "offers" | "contactRevealed">) => ServiceRequest;
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  submitOffer: (offer: Omit<Offer, "id" | "submittedAt" | "status">) => void;
  acceptOffer: (requestId: string, offerId: string) => void;
  startService: (requestId: string) => void;
  completeService: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  addToFavorites: (providerId: string) => void;
  favorites: string[];
  getRequestsByCustomer: (userId: string) => ServiceRequest[];
  getRequestsByProvider: (providerId: string) => ServiceRequest[];
  getPendingOfferRequests: (providerId: string) => ServiceRequest[];
  getProviderOffers: (providerId: string) => Offer[];
  addWalletTransaction: (tx: Omit<WalletTransaction, "id">) => void;
  updateSystemSettings: (s: Partial<SystemSettings>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const CATEGORIES: Category[] = [
  { id: "hair", name: "الشعر", icon: "scissors", color: "#9c27b0", servicesCount: 12 },
  { id: "makeup", name: "المكياج", icon: "star", color: "#e91e63", servicesCount: 8 },
  { id: "nails", name: "الأظافر", icon: "award", color: "#ff5722", servicesCount: 10 },
  { id: "skincare", name: "العناية بالبشرة", icon: "droplet", color: "#2196f3", servicesCount: 6 },
  { id: "eyebrows", name: "الحواجب", icon: "eye", color: "#795548", servicesCount: 5 },
  { id: "eyelashes", name: "الرموش", icon: "eye", color: "#607d8b", servicesCount: 4 },
  { id: "waxing", name: "إزالة الشعر", icon: "zap", color: "#ff9800", servicesCount: 7 },
  { id: "henna", name: "الحناء", icon: "feather", color: "#4caf50", servicesCount: 3 },
  { id: "massage", name: "المساج", icon: "heart", color: "#009688", servicesCount: 5 },
  { id: "other", name: "أخرى", icon: "more-horizontal", color: "#9e9e9e", servicesCount: 2 },
];

export const SERVICES: Service[] = [
  { id: "s1", categoryId: "hair", name: "قص الشعر", description: "قص وتشكيل الشعر", basePrice: 80, duration: 45 },
  { id: "s2", categoryId: "hair", name: "صبغ الشعر", description: "صبغ كامل أو جزئي", basePrice: 200, duration: 120 },
  { id: "s3", categoryId: "hair", name: "بروتين الشعر", description: "علاج البروتين للشعر التالف", basePrice: 350, duration: 150 },
  { id: "s4", categoryId: "hair", name: "تمليس الشعر", description: "تمليس وترطيب", basePrice: 180, duration: 90 },
  { id: "s5", categoryId: "makeup", name: "مكياج عرائس", description: "مكياج كامل للعرائس", basePrice: 500, duration: 120 },
  { id: "s6", categoryId: "makeup", name: "مكياج مناسبات", description: "مكياج للمناسبات الخاصة", basePrice: 250, duration: 60 },
  { id: "s7", categoryId: "makeup", name: "مكياج يومي", description: "مكياج طبيعي ويومي", basePrice: 120, duration: 45 },
  { id: "s8", categoryId: "nails", name: "مناكير كامل", description: "تنظيف وتلوين الأظافر", basePrice: 60, duration: 45 },
  { id: "s9", categoryId: "nails", name: "جيل نيلز", description: "أظافر جيل طويلة الأمد", basePrice: 150, duration: 90 },
  { id: "s10", categoryId: "skincare", name: "تنظيف بشرة", description: "تنظيف عميق للبشرة", basePrice: 180, duration: 60 },
  { id: "s11", categoryId: "eyebrows", name: "رسم الحواجب", description: "تشكيل وتلوين الحواجب", basePrice: 50, duration: 30 },
  { id: "s12", categoryId: "henna", name: "نقش حناء", description: "نقش حناء يدوي", basePrice: 100, duration: 60 },
];

export const PROVIDERS_DATA: Provider[] = [
  {
    id: "p1", name: "نور الجمال", type: "freelancer", avatarColor: "#e91e63",
    rating: 4.9, reviewsCount: 152, totalOrders: 234, distance: 1.2,
    isAvailable: true, location: { lat: 24.72, lng: 46.68, address: "الرياض، حي الملك فهد" },
    services: ["s1", "s2", "s3", "s4"], bio: "متخصصة في تصفيف وصبغ الشعر مع خبرة 8 سنوات",
    isVerified: true, walletBalance: 1250, phone: "0501234001",
    idVerified: true, status: "approved", joinedAt: "2024-01-15", commission: 15, freeServicesLeft: 0,
  },
  {
    id: "p2", name: "صالون لمسة", type: "salon", avatarColor: "#9c27b0",
    rating: 4.7, reviewsCount: 89, totalOrders: 456, distance: 2.5,
    isAvailable: true, location: { lat: 24.71, lng: 46.67, address: "الرياض، حي العليا" },
    services: ["s5", "s6", "s7", "s8", "s9"], bio: "صالون متخصص في المكياج والأظافر للمناسبات",
    isVerified: true, walletBalance: 3200, phone: "0501234002",
    idVerified: true, status: "approved", joinedAt: "2023-09-10", commission: 15, freeServicesLeft: 2,
  },
  {
    id: "p3", name: "هناء الجمالية", type: "freelancer", avatarColor: "#f06292",
    rating: 4.6, reviewsCount: 67, totalOrders: 123, distance: 3.1,
    isAvailable: true, location: { lat: 24.73, lng: 46.69, address: "الرياض، حي الروضة" },
    services: ["s10", "s11", "s12"], bio: "خبيرة عناية بالبشرة وفن الحناء",
    isVerified: true, walletBalance: 890, phone: "0501234003",
    idVerified: false, status: "pending", joinedAt: "2024-12-01", commission: 15, freeServicesLeft: 5,
  },
  {
    id: "p4", name: "أميرة ستايل", type: "freelancer", avatarColor: "#ab47bc",
    rating: 4.8, reviewsCount: 201, totalOrders: 312, distance: 0.8,
    isAvailable: false, location: { lat: 24.715, lng: 46.672, address: "الرياض، حي النزهة" },
    services: ["s1", "s2", "s5", "s6"], bio: "مصففة شعر ومتخصصة في المكياج للعرائس",
    isVerified: true, walletBalance: 2100, phone: "0501234004",
    idVerified: true, status: "approved", joinedAt: "2023-06-20", commission: 15, freeServicesLeft: 0,
  },
  {
    id: "p5", name: "ريم بيوتي", type: "freelancer", avatarColor: "#ec407a",
    rating: 0, reviewsCount: 0, totalOrders: 0, distance: 1.5,
    isAvailable: false, location: { lat: 24.718, lng: 46.671, address: "الرياض، حي الياسمين" },
    services: ["s8", "s9", "s11"], bio: "متخصصة في الأظافر والحواجب، جديدة في المنصة",
    isVerified: false, walletBalance: 0, phone: "0501234005",
    idVerified: false, status: "pending", joinedAt: "2026-04-01", commission: 15, freeServicesLeft: 5,
  },
];

export const PROVIDERS = PROVIDERS_DATA;

const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: "r1", customerId: "1", customerName: "سارة أحمد",
    serviceId: "s2", serviceName: "صبغ الشعر", categoryName: "الشعر",
    status: "completed", price: 220, address: "الرياض، حي النزهة",
    scheduledAt: "2024-12-20T10:00:00", providerId: "p1", providerName: "نور الجمال",
    rating: 5, review: "خدمة ممتازة جداً",
    contactRevealed: true, createdAt: "2024-12-19T20:00:00",
    offers: [], radiusKm: 10,
  },
  {
    id: "r2", customerId: "1", customerName: "سارة أحمد",
    serviceId: "s6", serviceName: "مكياج مناسبات", categoryName: "المكياج",
    status: "offers_received", price: 250, address: "الرياض، حي النزهة",
    scheduledAt: "2026-04-06T14:00:00",
    contactRevealed: false, createdAt: "2026-04-05T18:00:00",
    radiusKm: 10,
    offers: [
      {
        id: "of1", requestId: "r2", providerId: "p2", providerName: "صالون لمسة",
        providerRating: 4.7, providerTotalOrders: 456, providerType: "salon", isVerified: true,
        price: 230, eta: 20, note: "لدينا أفضل المكياجات للمناسبات وفريق محترف",
        status: "pending", submittedAt: "2026-04-05T18:30:00",
      },
      {
        id: "of2", requestId: "r2", providerId: "p3", providerName: "هناء الجمالية",
        providerRating: 4.6, providerTotalOrders: 123, providerType: "freelancer", isVerified: true,
        price: 200, eta: 30, note: "سأكون لديك في نصف ساعة",
        status: "pending", submittedAt: "2026-04-05T18:45:00",
      },
    ],
  },
];

const FAV_KEY = "azom_favorites";
const REQUESTS_KEY = "azom_requests";
const PROVIDERS_KEY = "azom_providers";
const WALLET_KEY = "azom_wallet";
const SETTINGS_KEY = "azom_settings";

const DEFAULT_SETTINGS: SystemSettings = {
  radiusKm: 10,
  offerWindowMinutes: 5,
  commissionPercent: 15,
  minOfferAmount: 30,
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS_DATA);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: "t1", userId: "p1", type: "debit", amount: 30, description: "عمولة خدمة صبغ الشعر", date: "2024-12-20" },
    { id: "t2", userId: "p1", type: "credit", amount: 500, description: "شحن رصيد", date: "2024-12-15" },
    { id: "t3", userId: "p2", type: "debit", amount: 45, description: "عمولة مكياج مناسبات", date: "2024-12-10" },
    { id: "t4", userId: "p2", type: "credit", amount: 1000, description: "شحن رصيد", date: "2024-12-01" },
  ]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [favStr, reqStr, provStr, walStr, setStr] = await Promise.all([
        AsyncStorage.getItem(FAV_KEY),
        AsyncStorage.getItem(REQUESTS_KEY),
        AsyncStorage.getItem(PROVIDERS_KEY),
        AsyncStorage.getItem(WALLET_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      if (favStr) setFavorites(JSON.parse(favStr));
      if (reqStr) setRequests(JSON.parse(reqStr));
      if (provStr) setProviders(JSON.parse(provStr));
      if (walStr) setWalletTransactions(JSON.parse(walStr));
      if (setStr) setSystemSettings(JSON.parse(setStr));
    } catch {}
  }

  const save = useCallback(async (key: string, data: any) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, []);

  const addRequest = useCallback((req: Omit<ServiceRequest, "id" | "createdAt" | "offers" | "contactRevealed">): ServiceRequest => {
    const newReq: ServiceRequest = {
      ...req,
      id: "r" + Date.now(),
      createdAt: new Date().toISOString(),
      offers: [],
      contactRevealed: false,
    };
    setRequests((prev) => {
      const updated = [newReq, ...prev];
      save(REQUESTS_KEY, updated);
      return updated;
    });
    return newReq;
  }, [save]);

  const updateRequest = useCallback((id: string, updates: Partial<ServiceRequest>) => {
    setRequests((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, ...updates } : r);
      save(REQUESTS_KEY, updated);
      return updated;
    });
  }, [save]);

  const submitOffer = useCallback((offer: Omit<Offer, "id" | "submittedAt" | "status">) => {
    const newOffer: Offer = {
      ...offer,
      id: "of" + Date.now(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    setRequests((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== offer.requestId) return r;
        const alreadyOffered = r.offers.some((o) => o.providerId === offer.providerId);
        if (alreadyOffered) return r;
        return {
          ...r,
          status: "offers_received" as const,
          offers: [...r.offers, newOffer],
        };
      });
      save(REQUESTS_KEY, updated);
      return updated;
    });
  }, [save]);

  const acceptOffer = useCallback((requestId: string, offerId: string) => {
    setRequests((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== requestId) return r;
        const offer = r.offers.find((o) => o.id === offerId);
        if (!offer) return r;
        const provider = PROVIDERS_DATA.find((p) => p.id === offer.providerId);
        return {
          ...r,
          status: "accepted" as const,
          providerId: offer.providerId,
          providerName: offer.providerName,
          providerPhone: provider?.phone,
          price: offer.price,
          contactRevealed: true,
          offers: r.offers.map((o) => ({
            ...o,
            status: o.id === offerId ? ("accepted" as const) : ("rejected" as const),
            contactPhone: o.id === offerId ? provider?.phone : undefined,
          })),
        };
      });
      save(REQUESTS_KEY, updated);
      return updated;
    });
  }, [save]);

  const startService = useCallback((requestId: string) => {
    updateRequest(requestId, { status: "in_progress" });
  }, [updateRequest]);

  const completeService = useCallback((requestId: string) => {
    setRequests((prev) => {
      const req = prev.find((r) => r.id === requestId);
      if (!req || !req.providerId) return prev;
      const provider = providers.find((p) => p.id === req.providerId);
      if (provider) {
        const commission = (req.price || 0) * (provider.commission / 100);
        const isFree = provider.freeServicesLeft > 0;
        if (!isFree) {
          setWalletTransactions((wt) => {
            const newTx: WalletTransaction = {
              id: "tx" + Date.now(),
              userId: req.providerId!,
              type: "debit",
              amount: commission,
              description: `عمولة خدمة: ${req.serviceName}`,
              date: new Date().toISOString().split("T")[0],
            };
            const updated = [newTx, ...wt];
            save(WALLET_KEY, updated);
            return updated;
          });
          setProviders((pp) => {
            const updated = pp.map((p) =>
              p.id === req.providerId
                ? { ...p, walletBalance: Math.max(0, p.walletBalance - commission), totalOrders: p.totalOrders + 1 }
                : p
            );
            save(PROVIDERS_KEY, updated);
            return updated;
          });
        } else {
          setProviders((pp) => {
            const updated = pp.map((p) =>
              p.id === req.providerId
                ? { ...p, freeServicesLeft: p.freeServicesLeft - 1, totalOrders: p.totalOrders + 1 }
                : p
            );
            save(PROVIDERS_KEY, updated);
            return updated;
          });
        }
      }
      const updated = prev.map((r) => r.id === requestId ? { ...r, status: "completed" as const } : r);
      save(REQUESTS_KEY, updated);
      return updated;
    });
  }, [providers, save]);

  const cancelRequest = useCallback((requestId: string) => {
    updateRequest(requestId, { status: "cancelled" });
  }, [updateRequest]);

  const updateProvider = useCallback((id: string, updates: Partial<Provider>) => {
    setProviders((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, ...updates } : p);
      save(PROVIDERS_KEY, updated);
      return updated;
    });
  }, [save]);

  const addToFavorites = useCallback((providerId: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId];
      save(FAV_KEY, newFavs);
      return newFavs;
    });
  }, [save]);

  const addWalletTransaction = useCallback((tx: Omit<WalletTransaction, "id">) => {
    setWalletTransactions((prev) => {
      const newTx: WalletTransaction = { ...tx, id: "tx" + Date.now() };
      const updated = [newTx, ...prev];
      save(WALLET_KEY, updated);
      return updated;
    });
  }, [save]);

  const updateSystemSettings = useCallback((s: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...s };
      save(SETTINGS_KEY, updated);
      return updated;
    });
  }, [save]);

  const getRequestsByCustomer = useCallback((userId: string) =>
    requests.filter((r) => r.customerId === userId), [requests]);

  const getRequestsByProvider = useCallback((providerId: string) =>
    requests.filter((r) => r.providerId === providerId), [requests]);

  const getPendingOfferRequests = useCallback((providerId: string) =>
    requests.filter(
      (r) =>
        ["pending", "offers_received"].includes(r.status) &&
        !r.offers.some((o) => o.providerId === providerId) &&
        r.providerId !== providerId
    ), [requests]);

  const getProviderOffers = useCallback((providerId: string): Offer[] =>
    requests.flatMap((r) => r.offers.filter((o) => o.providerId === providerId)), [requests]);

  return (
    <DataContext.Provider value={{
      categories: CATEGORIES, services: SERVICES, providers, requests,
      walletTransactions, systemSettings,
      addRequest, updateRequest, submitOffer, acceptOffer,
      startService, completeService, cancelRequest, updateProvider,
      addToFavorites, favorites,
      getRequestsByCustomer, getRequestsByProvider,
      getPendingOfferRequests, getProviderOffers,
      addWalletTransaction, updateSystemSettings,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
