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

export interface ProviderService {
  serviceId: string;
  customPrice: number;
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
  providerServices?: ProviderService[];
  bio: string;
  isVerified: boolean;
  walletBalance: number;
  phone?: string;
  idVerified?: boolean;
  status: "pending" | "approved" | "suspended";
  suspensionReason?: string;
  joinedAt: string;
  commission: number;
  freeServicesLeft: number;
  city?: string;
  photoUri?: string;
  attachments?: { name: string; type: string; uploadedAt: string }[];
  blockedCustomers?: string[];
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
  scheduledLater?: boolean;
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
  couponCode?: string;
  giftRecipientPhone?: string;
  giftRecipientName?: string;
}

export interface Offer {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerFirstName?: string;
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
  type: "credit" | "debit" | "topup_request";
  amount: number;
  description: string;
  date: string;
}

export interface WalletTopupRequest {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  note?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: "customer" | "provider" | "admin";
  type:
    | "offer_received"
    | "offer_accepted"
    | "offer_rejected"
    | "wallet_topup_request"
    | "wallet_topup_approved"
    | "wallet_topup_rejected"
    | "service_started"
    | "service_completed"
    | "account_suspended"
    | "account_approved"
    | "package_approved"
    | "new_request";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percent";
  value: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  description?: string;
}

export interface ServicePackage {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  serviceIds: string[];
  serviceNames: string[];
  price: number;
  originalPrice: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface SystemSettings {
  radiusKm: number;
  offerWindowMinutes: number;
  commissionPercent: number;
  minOfferAmount: number;
  defaultFreeServices: number;
}

interface DataContextType {
  categories: Category[];
  services: Service[];
  providers: Provider[];
  requests: ServiceRequest[];
  walletTransactions: WalletTransaction[];
  walletTopupRequests: WalletTopupRequest[];
  notifications: Notification[];
  coupons: Coupon[];
  packages: ServicePackage[];
  systemSettings: SystemSettings;
  addRequest: (req: Omit<ServiceRequest, "id" | "createdAt" | "offers" | "contactRevealed">) => ServiceRequest;
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  submitOffer: (offer: Omit<Offer, "id" | "submittedAt" | "status">) => void;
  acceptOffer: (requestId: string, offerId: string) => void;
  startService: (requestId: string) => void;
  completeService: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  suspendProvider: (id: string, reason: string) => void;
  addToFavorites: (providerId: string) => void;
  favorites: string[];
  getRequestsByCustomer: (userId: string) => ServiceRequest[];
  getRequestsByProvider: (providerId: string) => ServiceRequest[];
  getPendingOfferRequests: (providerId: string) => ServiceRequest[];
  getProviderOffers: (providerId: string) => Offer[];
  addWalletTransaction: (tx: Omit<WalletTransaction, "id">) => void;
  requestWalletTopup: (providerId: string, providerName: string, amount: number, note?: string) => void;
  approveWalletTopup: (requestId: string) => void;
  rejectWalletTopup: (requestId: string) => void;
  updateSystemSettings: (s: Partial<SystemSettings>) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  addCoupon: (c: Omit<Coupon, "id" | "usedCount">) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  validateCoupon: (code: string) => Coupon | null;
  addPackage: (pkg: Omit<ServicePackage, "id" | "createdAt" | "status">) => void;
  approvePackage: (id: string) => void;
  rejectPackage: (id: string) => void;
  blockCustomer: (providerId: string, customerId: string) => void;
  unblockCustomer: (providerId: string, customerId: string) => void;
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
    city: "الرياض",
    services: ["s1", "s2", "s3", "s4"],
    providerServices: [
      { serviceId: "s1", customPrice: 90 },
      { serviceId: "s2", customPrice: 220 },
      { serviceId: "s3", customPrice: 380 },
      { serviceId: "s4", customPrice: 190 },
    ],
    bio: "متخصصة في تصفيف وصبغ الشعر مع خبرة 8 سنوات",
    isVerified: true, walletBalance: 1250, phone: "0501234001",
    idVerified: true, status: "approved", joinedAt: "2024-01-15", commission: 15, freeServicesLeft: 0,
    attachments: [
      { name: "بطاقة الهوية", type: "id", uploadedAt: "2024-01-15" },
      { name: "شهادة تدريب", type: "certificate", uploadedAt: "2024-01-15" },
    ],
    blockedCustomers: [],
  },
  {
    id: "p2", name: "صالون لمسة", type: "salon", avatarColor: "#9c27b0",
    rating: 4.7, reviewsCount: 89, totalOrders: 456, distance: 2.5,
    isAvailable: true, location: { lat: 24.71, lng: 46.67, address: "الرياض، حي العليا" },
    city: "الرياض",
    services: ["s5", "s6", "s7", "s8", "s9"],
    providerServices: [
      { serviceId: "s5", customPrice: 550 },
      { serviceId: "s6", customPrice: 260 },
      { serviceId: "s7", customPrice: 130 },
      { serviceId: "s8", customPrice: 70 },
      { serviceId: "s9", customPrice: 165 },
    ],
    bio: "صالون متخصص في المكياج والأظافر للمناسبات",
    isVerified: true, walletBalance: 3200, phone: "0501234002",
    idVerified: true, status: "approved", joinedAt: "2023-09-10", commission: 15, freeServicesLeft: 2,
    attachments: [
      { name: "رخصة الصالون", type: "license", uploadedAt: "2023-09-10" },
      { name: "بطاقة هوية المالك", type: "id", uploadedAt: "2023-09-10" },
    ],
    blockedCustomers: [],
  },
  {
    id: "p3", name: "هناء الجمالية", type: "freelancer", avatarColor: "#f06292",
    rating: 4.6, reviewsCount: 67, totalOrders: 123, distance: 3.1,
    isAvailable: true, location: { lat: 24.73, lng: 46.69, address: "الرياض، حي الروضة" },
    city: "الرياض",
    services: ["s10", "s11", "s12"],
    providerServices: [
      { serviceId: "s10", customPrice: 190 },
      { serviceId: "s11", customPrice: 55 },
      { serviceId: "s12", customPrice: 110 },
    ],
    bio: "خبيرة عناية بالبشرة وفن الحناء",
    isVerified: true, walletBalance: 890, phone: "0501234003",
    idVerified: false, status: "pending", joinedAt: "2024-12-01", commission: 15, freeServicesLeft: 5,
    attachments: [
      { name: "بطاقة الهوية", type: "id", uploadedAt: "2024-12-01" },
    ],
    blockedCustomers: [],
  },
  {
    id: "p4", name: "أميرة ستايل", type: "freelancer", avatarColor: "#ab47bc",
    rating: 4.8, reviewsCount: 201, totalOrders: 312, distance: 0.8,
    isAvailable: false, location: { lat: 24.715, lng: 46.672, address: "الرياض، حي النزهة" },
    city: "الرياض",
    services: ["s1", "s2", "s5", "s6"],
    providerServices: [
      { serviceId: "s1", customPrice: 85 },
      { serviceId: "s2", customPrice: 210 },
      { serviceId: "s5", customPrice: 520 },
      { serviceId: "s6", customPrice: 255 },
    ],
    bio: "مصففة شعر ومتخصصة في المكياج للعرائس",
    isVerified: true, walletBalance: 2100, phone: "0501234004",
    idVerified: true, status: "approved", joinedAt: "2023-06-20", commission: 15, freeServicesLeft: 0,
    attachments: [
      { name: "بطاقة الهوية", type: "id", uploadedAt: "2023-06-20" },
      { name: "شهادة حلاقة", type: "certificate", uploadedAt: "2023-06-20" },
    ],
    blockedCustomers: [],
  },
  {
    id: "p5", name: "ريم بيوتي", type: "freelancer", avatarColor: "#ec407a",
    rating: 0, reviewsCount: 0, totalOrders: 0, distance: 1.5,
    isAvailable: false, location: { lat: 24.718, lng: 46.671, address: "الرياض، حي الياسمين" },
    city: "الرياض",
    services: ["s8", "s9", "s11"],
    providerServices: [
      { serviceId: "s8", customPrice: 65 },
      { serviceId: "s9", customPrice: 155 },
      { serviceId: "s11", customPrice: 50 },
    ],
    bio: "متخصصة في الأظافر والحواجب، جديدة في المنصة",
    isVerified: false, walletBalance: 0, phone: "0501234005",
    idVerified: false, status: "pending", joinedAt: "2026-04-01", commission: 15, freeServicesLeft: 5,
    attachments: [
      { name: "بطاقة الهوية", type: "id", uploadedAt: "2026-04-01" },
    ],
    blockedCustomers: [],
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
        providerFirstName: "صالون",
        providerRating: 4.7, providerTotalOrders: 456, providerType: "salon", isVerified: true,
        price: 230, eta: 20, note: "لدينا أفضل المكياجات للمناسبات وفريق محترف",
        status: "pending", submittedAt: "2026-04-05T18:30:00",
      },
      {
        id: "of2", requestId: "r2", providerId: "p3", providerName: "هناء الجمالية",
        providerFirstName: "هناء",
        providerRating: 4.6, providerTotalOrders: 123, providerType: "freelancer", isVerified: true,
        price: 200, eta: 30, note: "سأكون لديك في نصف ساعة",
        status: "pending", submittedAt: "2026-04-05T18:45:00",
      },
    ],
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", userId: "1", role: "customer", type: "offer_received",
    title: "عرض جديد!", body: "وصلك عرض جديد لطلب مكياج مناسبات",
    isRead: false, createdAt: "2026-04-05T18:30:00", relatedId: "r2",
  },
  {
    id: "n2", userId: "p1", role: "provider", type: "offer_accepted",
    title: "تم قبول عرضك!", body: "قبلت العميلة سارة عرضك لخدمة صبغ الشعر",
    isRead: true, createdAt: "2024-12-20T09:00:00", relatedId: "r1",
  },
  {
    id: "n3", userId: "3", role: "admin", type: "wallet_topup_request",
    title: "طلب شحن رصيد", body: "نور الجمال تطلب شحن 500 ر.س في المحفظة",
    isRead: false, createdAt: "2026-04-05T17:00:00", relatedId: "wt1",
  },
];

const MOCK_COUPONS: Coupon[] = [
  {
    id: "c1", code: "WELCOME20", type: "percent", value: 20, maxUses: 100, usedCount: 34,
    isActive: true, expiresAt: "2026-12-31", description: "خصم 20% للمستخدمين الجدد",
  },
  {
    id: "c2", code: "FIXED50", type: "fixed", value: 50, maxUses: 50, usedCount: 12,
    isActive: true, description: "خصم 50 ريال على أي خدمة",
  },
];

const MOCK_TOPUP_REQUESTS: WalletTopupRequest[] = [
  {
    id: "wt1", providerId: "p1", providerName: "نور الجمال",
    amount: 500, status: "pending", createdAt: "2026-04-05T17:00:00",
    note: "أرجو شحن الرصيد عبر التحويل البنكي",
  },
  {
    id: "wt2", providerId: "p2", providerName: "صالون لمسة",
    amount: 1000, status: "approved", createdAt: "2026-04-01T10:00:00",
    resolvedAt: "2026-04-01T14:00:00",
  },
];

const MOCK_PACKAGES: ServicePackage[] = [
  {
    id: "pk1", providerId: "p1", providerName: "نور الجمال",
    title: "باقة العروس الكاملة", description: "قص وصبغ وتمليس الشعر في جلسة واحدة",
    serviceIds: ["s1", "s2", "s4"], serviceNames: ["قص الشعر", "صبغ الشعر", "تمليس الشعر"],
    price: 420, originalPrice: 490, status: "approved", createdAt: "2026-03-01T10:00:00",
  },
  {
    id: "pk2", providerId: "p2", providerName: "صالون لمسة",
    title: "باقة المناسبات", description: "مكياج عرائس + مناكير كامل بسعر مميز",
    serviceIds: ["s5", "s8"], serviceNames: ["مكياج عرائس", "مناكير كامل"],
    price: 580, originalPrice: 620, status: "pending", createdAt: "2026-04-04T12:00:00",
  },
];

const FAV_KEY = "azom_favorites";
const REQUESTS_KEY = "azom_requests";
const PROVIDERS_KEY = "azom_providers";
const WALLET_KEY = "azom_wallet";
const SETTINGS_KEY = "azom_settings";
const NOTIF_KEY = "azom_notifications";
const COUPONS_KEY = "azom_coupons";
const TOPUP_KEY = "azom_topup";
const PACKAGES_KEY = "azom_packages";

const DEFAULT_SETTINGS: SystemSettings = {
  radiusKm: 10,
  offerWindowMinutes: 5,
  commissionPercent: 15,
  minOfferAmount: 30,
  defaultFreeServices: 5,
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [providers, setProviders] = useState<Provider[]>(PROVIDERS_DATA);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: "t1", userId: "p1", type: "debit", amount: 30, description: "عمولة خدمة صبغ الشعر", date: "2024-12-20" },
    { id: "t2", userId: "p1", type: "credit", amount: 500, description: "شحن رصيد معتمد من الإدارة", date: "2024-12-15" },
    { id: "t3", userId: "p2", type: "debit", amount: 45, description: "عمولة مكياج مناسبات", date: "2024-12-10" },
    { id: "t4", userId: "p2", type: "credit", amount: 1000, description: "شحن رصيد معتمد من الإدارة", date: "2024-12-01" },
  ]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  const [walletTopupRequests, setWalletTopupRequests] = useState<WalletTopupRequest[]>(MOCK_TOPUP_REQUESTS);
  const [packages, setPackages] = useState<ServicePackage[]>(MOCK_PACKAGES);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [favStr, reqStr, provStr, walStr, setStr, notifStr, cpnStr, topStr, pkgStr] = await Promise.all([
        AsyncStorage.getItem(FAV_KEY),
        AsyncStorage.getItem(REQUESTS_KEY),
        AsyncStorage.getItem(PROVIDERS_KEY),
        AsyncStorage.getItem(WALLET_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(NOTIF_KEY),
        AsyncStorage.getItem(COUPONS_KEY),
        AsyncStorage.getItem(TOPUP_KEY),
        AsyncStorage.getItem(PACKAGES_KEY),
      ]);
      if (favStr) setFavorites(JSON.parse(favStr));
      if (reqStr) setRequests(JSON.parse(reqStr));
      if (provStr) setProviders(JSON.parse(provStr));
      if (walStr) setWalletTransactions(JSON.parse(walStr));
      if (setStr) setSystemSettings(JSON.parse(setStr));
      if (notifStr) setNotifications(JSON.parse(notifStr));
      if (cpnStr) setCoupons(JSON.parse(cpnStr));
      if (topStr) setWalletTopupRequests(JSON.parse(topStr));
      if (pkgStr) setPackages(JSON.parse(pkgStr));
    } catch {}
  }

  const save = useCallback(async (key: string, data: any) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id" | "createdAt">) => {
    setNotifications((prev) => {
      const newN: Notification = { ...n, id: "n" + Date.now(), createdAt: new Date().toISOString() };
      const updated = [newN, ...prev];
      save(NOTIF_KEY, updated);
      return updated;
    });
  }, [save]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      save(NOTIF_KEY, updated);
      return updated;
    });
  }, [save]);

  const markAllRead = useCallback((userId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.userId === userId ? { ...n, isRead: true } : n);
      save(NOTIF_KEY, updated);
      return updated;
    });
  }, [save]);

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
    const firstName = offer.providerName.split(" ")[0];
    const newOffer: Offer = {
      ...offer,
      providerFirstName: firstName,
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
    addNotification({
      userId: "1", role: "customer", type: "offer_received",
      title: "عرض جديد!", body: `وصلك عرض جديد بسعر ${offer.price} ر.س`,
      isRead: false, relatedId: offer.requestId,
    });
    addNotification({
      userId: "3", role: "admin", type: "new_request",
      title: "عرض مُقدَّم", body: `${offer.providerName} قدّمت عرضاً للطلب`,
      isRead: false, relatedId: offer.requestId,
    });
  }, [save, addNotification]);

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
    addNotification({
      userId: offerId, role: "provider", type: "offer_accepted",
      title: "تم قبول عرضك!", body: "قبلت العميلة عرضك — يمكنك التواصل معها الآن",
      isRead: false, relatedId: requestId,
    });
    addNotification({
      userId: "3", role: "admin", type: "offer_accepted",
      title: "عرض مقبول — تنبيه دفع مسبق", body: "تم قبول عرض — اتصل بالعميل لتحصيل الدفعة المسبقة",
      isRead: false, relatedId: requestId,
    });
  }, [save, addNotification]);

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

  const suspendProvider = useCallback((id: string, reason: string) => {
    setProviders((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, status: "suspended" as const, isAvailable: false, suspensionReason: reason } : p
      );
      save(PROVIDERS_KEY, updated);
      return updated;
    });
    addNotification({
      userId: id, role: "provider", type: "account_suspended",
      title: "تم تعليق حسابك", body: `سبب التعليق: ${reason}`,
      isRead: false,
    });
  }, [save, addNotification]);

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

  const requestWalletTopup = useCallback((providerId: string, providerName: string, amount: number, note?: string) => {
    const newReq: WalletTopupRequest = {
      id: "wt" + Date.now(), providerId, providerName, amount,
      status: "pending", createdAt: new Date().toISOString(), note,
    };
    setWalletTopupRequests((prev) => {
      const updated = [newReq, ...prev];
      save(TOPUP_KEY, updated);
      return updated;
    });
    addNotification({
      userId: "3", role: "admin", type: "wallet_topup_request",
      title: "طلب شحن رصيد", body: `${providerName} تطلب شحن ${amount} ر.س`,
      isRead: false, relatedId: newReq.id,
    });
  }, [save, addNotification]);

  const approveWalletTopup = useCallback((requestId: string) => {
    setWalletTopupRequests((prev) => {
      const req = prev.find((r) => r.id === requestId);
      if (!req) return prev;
      const updated = prev.map((r) =>
        r.id === requestId ? { ...r, status: "approved" as const, resolvedAt: new Date().toISOString() } : r
      );
      save(TOPUP_KEY, updated);
      if (req) {
        setProviders((pp) => {
          const upd = pp.map((p) =>
            p.id === req.providerId ? { ...p, walletBalance: p.walletBalance + req.amount } : p
          );
          save(PROVIDERS_KEY, upd);
          return upd;
        });
        setWalletTransactions((wt) => {
          const newTx: WalletTransaction = {
            id: "tx" + Date.now(), userId: req.providerId,
            type: "credit", amount: req.amount,
            description: "شحن رصيد معتمد من الإدارة",
            date: new Date().toISOString().split("T")[0],
          };
          const upd = [newTx, ...wt];
          save(WALLET_KEY, upd);
          return upd;
        });
        addNotification({
          userId: req.providerId, role: "provider", type: "wallet_topup_approved",
          title: "تم شحن رصيدك!", body: `تم إضافة ${req.amount} ر.س إلى محفظتك`,
          isRead: false, relatedId: requestId,
        });
      }
      return updated;
    });
  }, [save, addNotification]);

  const rejectWalletTopup = useCallback((requestId: string) => {
    setWalletTopupRequests((prev) => {
      const req = prev.find((r) => r.id === requestId);
      const updated = prev.map((r) =>
        r.id === requestId ? { ...r, status: "rejected" as const, resolvedAt: new Date().toISOString() } : r
      );
      save(TOPUP_KEY, updated);
      if (req) {
        addNotification({
          userId: req.providerId, role: "provider", type: "wallet_topup_rejected",
          title: "تم رفض طلب الشحن", body: "تم رفض طلب شحن رصيدك — تواصل مع الإدارة",
          isRead: false, relatedId: requestId,
        });
      }
      return updated;
    });
  }, [save, addNotification]);

  const updateSystemSettings = useCallback((s: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...s };
      save(SETTINGS_KEY, updated);
      return updated;
    });
  }, [save]);

  const addCoupon = useCallback((c: Omit<Coupon, "id" | "usedCount">) => {
    setCoupons((prev) => {
      const newC: Coupon = { ...c, id: "c" + Date.now(), usedCount: 0 };
      const updated = [newC, ...prev];
      save(COUPONS_KEY, updated);
      return updated;
    });
  }, [save]);

  const updateCoupon = useCallback((id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, ...updates } : c);
      save(COUPONS_KEY, updated);
      return updated;
    });
  }, [save]);

  const deleteCoupon = useCallback((id: string) => {
    setCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      save(COUPONS_KEY, updated);
      return updated;
    });
  }, [save]);

  const validateCoupon = useCallback((code: string): Coupon | null => {
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive && c.usedCount < c.maxUses);
    return coupon || null;
  }, [coupons]);

  const addPackage = useCallback((pkg: Omit<ServicePackage, "id" | "createdAt" | "status">) => {
    setPackages((prev) => {
      const newPkg: ServicePackage = { ...pkg, id: "pk" + Date.now(), createdAt: new Date().toISOString(), status: "pending" };
      const updated = [newPkg, ...prev];
      save(PACKAGES_KEY, updated);
      return updated;
    });
    addNotification({
      userId: "3", role: "admin", type: "new_request",
      title: "باقة جديدة بانتظار الموافقة", body: `${pkg.providerName} أضافت باقة: ${pkg.title}`,
      isRead: false,
    });
  }, [save, addNotification]);

  const approvePackage = useCallback((id: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, status: "approved" as const } : p);
      save(PACKAGES_KEY, updated);
      return updated;
    });
  }, [save]);

  const rejectPackage = useCallback((id: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, status: "rejected" as const } : p);
      save(PACKAGES_KEY, updated);
      return updated;
    });
  }, [save]);

  const blockCustomer = useCallback((providerId: string, customerId: string) => {
    setProviders((prev) => {
      const updated = prev.map((p) =>
        p.id === providerId
          ? { ...p, blockedCustomers: [...(p.blockedCustomers || []), customerId] }
          : p
      );
      save(PROVIDERS_KEY, updated);
      return updated;
    });
  }, [save]);

  const unblockCustomer = useCallback((providerId: string, customerId: string) => {
    setProviders((prev) => {
      const updated = prev.map((p) =>
        p.id === providerId
          ? { ...p, blockedCustomers: (p.blockedCustomers || []).filter((id) => id !== customerId) }
          : p
      );
      save(PROVIDERS_KEY, updated);
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
      walletTransactions, walletTopupRequests, notifications, coupons, packages, systemSettings,
      addRequest, updateRequest, submitOffer, acceptOffer,
      startService, completeService, cancelRequest,
      updateProvider, suspendProvider,
      addToFavorites, favorites,
      getRequestsByCustomer, getRequestsByProvider,
      getPendingOfferRequests, getProviderOffers,
      addWalletTransaction, requestWalletTopup, approveWalletTopup, rejectWalletTopup,
      updateSystemSettings,
      addNotification, markNotificationRead, markAllRead,
      addCoupon, updateCoupon, deleteCoupon, validateCoupon,
      addPackage, approvePackage, rejectPackage,
      blockCustomer, unblockCustomer,
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
