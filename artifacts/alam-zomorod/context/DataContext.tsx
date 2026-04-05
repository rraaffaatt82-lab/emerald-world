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
  image?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: "salon" | "freelancer";
  avatar?: string;
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
}

export interface Order {
  id: string;
  customerId: string;
  providerId?: string;
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
  price?: number;
  address: string;
  scheduledAt: string;
  notes?: string;
  rating?: number;
  review?: string;
  providerName?: string;
  createdAt: string;
  offers?: Offer[];
}

export interface Offer {
  id: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  price: number;
  eta: number;
  note?: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

interface DataContextType {
  categories: Category[];
  services: Service[];
  providers: Provider[];
  orders: Order[];
  walletTransactions: WalletTransaction[];
  addOrder: (order: Omit<Order, "id" | "createdAt" | "offers">) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  acceptOffer: (orderId: string, offerId: string) => void;
  addToFavorites: (providerId: string) => void;
  favorites: string[];
  getOrdersByUser: (userId: string) => Order[];
  getOrdersByProvider: (providerId: string) => Order[];
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

export const PROVIDERS: Provider[] = [
  {
    id: "p1",
    name: "نور الجمال",
    type: "freelancer",
    rating: 4.9,
    reviewsCount: 152,
    totalOrders: 234,
    distance: 1.2,
    isAvailable: true,
    location: { lat: 24.72, lng: 46.68, address: "الرياض، حي الملك فهد" },
    services: ["s1", "s2", "s3", "s4"],
    bio: "متخصصة في تصفيف وصبغ الشعر مع خبرة 8 سنوات",
    isVerified: true,
    walletBalance: 1250,
  },
  {
    id: "p2",
    name: "صالون لمسة",
    type: "salon",
    rating: 4.7,
    reviewsCount: 89,
    totalOrders: 456,
    distance: 2.5,
    isAvailable: true,
    location: { lat: 24.71, lng: 46.67, address: "الرياض، حي العليا" },
    services: ["s5", "s6", "s7", "s8", "s9"],
    bio: "صالون متخصص في المكياج والأظافر للمناسبات",
    isVerified: true,
    walletBalance: 3200,
  },
  {
    id: "p3",
    name: "هناء الجمالية",
    type: "freelancer",
    rating: 4.6,
    reviewsCount: 67,
    totalOrders: 123,
    distance: 3.1,
    isAvailable: true,
    location: { lat: 24.73, lng: 46.69, address: "الرياض، حي الروضة" },
    services: ["s10", "s11", "s12"],
    bio: "خبيرة عناية بالبشرة وفن الحناء",
    isVerified: true,
    walletBalance: 890,
  },
  {
    id: "p4",
    name: "أميرة ستايل",
    type: "freelancer",
    rating: 4.8,
    reviewsCount: 201,
    totalOrders: 312,
    distance: 0.8,
    isAvailable: false,
    location: { lat: 24.715, lng: 46.672, address: "الرياض، حي النزهة" },
    services: ["s1", "s2", "s5", "s6"],
    bio: "مصففة شعر ومتخصصة في المكياج للعرائس",
    isVerified: true,
    walletBalance: 2100,
  },
  {
    id: "p5",
    name: "صالون رويال",
    type: "salon",
    rating: 4.5,
    reviewsCount: 134,
    totalOrders: 789,
    distance: 4.2,
    isAvailable: true,
    location: { lat: 24.705, lng: 46.66, address: "الرياض، حي السليمانية" },
    services: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
    bio: "صالون متكامل لجميع خدمات التجميل",
    isVerified: true,
    walletBalance: 5600,
  },
];

const MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    customerId: "1",
    providerId: "p1",
    serviceId: "s2",
    serviceName: "صبغ الشعر",
    categoryName: "الشعر",
    status: "completed",
    price: 220,
    address: "الرياض، حي النزهة",
    scheduledAt: "2024-12-20T10:00:00",
    providerName: "نور الجمال",
    rating: 5,
    review: "خدمة ممتازة جداً، شكراً جزيلاً",
    createdAt: "2024-12-19T20:00:00",
  },
  {
    id: "o2",
    customerId: "1",
    providerId: "p2",
    serviceId: "s6",
    serviceName: "مكياج مناسبات",
    categoryName: "المكياج",
    status: "accepted",
    price: 280,
    address: "الرياض، حي النزهة",
    scheduledAt: "2024-12-25T14:00:00",
    providerName: "صالون لمسة",
    createdAt: "2024-12-24T18:00:00",
  },
];

const FAV_KEY = "alam_zomorod_favorites";
const ORDERS_KEY = "alam_zomorod_orders";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [favStr, ordersStr] = await Promise.all([
        AsyncStorage.getItem(FAV_KEY),
        AsyncStorage.getItem(ORDERS_KEY),
      ]);
      if (favStr) setFavorites(JSON.parse(favStr));
      if (ordersStr) setOrders(JSON.parse(ordersStr));
    } catch {}
  }

  const addOrder = useCallback((order: Omit<Order, "id" | "createdAt" | "offers">) => {
    const newOrder: Order = {
      ...order,
      id: "o" + Date.now(),
      createdAt: new Date().toISOString(),
      offers: [],
    };
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      setTimeout(() => {
        setOrders((prev2) => {
          const withOffers = prev2.map((o) => {
            if (o.id !== newOrder.id) return o;
            const generatedOffers: Offer[] = PROVIDERS.slice(0, 3).map((p, i) => ({
              id: "of" + Date.now() + i,
              providerId: p.id,
              providerName: p.name,
              providerRating: p.rating,
              price: order.price || 150 + i * 30,
              eta: 15 + i * 10,
            }));
            return { ...o, status: "offers_received" as const, offers: generatedOffers };
          });
          AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(withOffers));
          return withOffers;
        });
      }, 3000);
      return updated;
    });
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const acceptOffer = useCallback((orderId: string, offerId: string) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        const offer = o.offers?.find((of) => of.id === offerId);
        return {
          ...o,
          status: "accepted" as const,
          providerId: offer?.providerId,
          providerName: offer?.providerName,
          price: offer?.price,
        };
      });
      AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToFavorites = useCallback((providerId: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId];
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  const getOrdersByUser = useCallback(
    (userId: string) => orders.filter((o) => o.customerId === userId),
    [orders]
  );

  const getOrdersByProvider = useCallback(
    (providerId: string) => orders.filter((o) => o.providerId === providerId),
    [orders]
  );

  const walletTransactions: WalletTransaction[] = [
    { id: "t1", type: "debit", amount: 30, description: "عمولة خدمة صبغ الشعر", date: "2024-12-20" },
    { id: "t2", type: "credit", amount: 500, description: "شحن رصيد", date: "2024-12-15" },
    { id: "t3", type: "debit", amount: 45, description: "عمولة مكياج مناسبات", date: "2024-12-10" },
    { id: "t4", type: "credit", amount: 1000, description: "شحن رصيد", date: "2024-12-01" },
  ];

  return (
    <DataContext.Provider
      value={{
        categories: CATEGORIES,
        services: SERVICES,
        providers: PROVIDERS,
        orders,
        walletTransactions,
        addOrder,
        updateOrder,
        acceptOffer,
        addToFavorites,
        favorites,
        getOrdersByUser,
        getOrdersByProvider,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
