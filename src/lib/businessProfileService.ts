export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessProfile {
  userId: string;
  isEnabled: boolean;
  businessName: string;
  address: string;
  phone: string;
  website: string;
  hours: BusinessHours[];
  welcomeMessage: string;
  awayMessage: string;
  awayEnabled: boolean;
  awayStartTime: string;
  awayEndTime: string;
}

const STORAGE_KEY = "echat_business_profile";

const DEFAULT_HOURS: BusinessHours[] = [
  { day: "Monday", open: "09:00", close: "18:00", closed: false },
  { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
  { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
  { day: "Thursday", open: "09:00", close: "18:00", closed: false },
  { day: "Friday", open: "09:00", close: "18:00", closed: false },
  { day: "Saturday", open: "10:00", close: "15:00", closed: false },
  { day: "Sunday", open: "09:00", close: "18:00", closed: true },
];

export function getBusinessProfile(userId: string): BusinessProfile {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    userId,
    isEnabled: false,
    businessName: "",
    address: "",
    phone: "",
    website: "",
    hours: DEFAULT_HOURS,
    welcomeMessage: "Welcome! Thanks for contacting us. How can we help you?",
    awayMessage: "We're currently away. We'll get back to you as soon as possible!",
    awayEnabled: false,
    awayStartTime: "18:00",
    awayEndTime: "09:00",
  };
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  localStorage.setItem(`${STORAGE_KEY}_${profile.userId}`, JSON.stringify(profile));
}

export function isBusinessOpen(profile: BusinessProfile): boolean {
  if (!profile.isEnabled) return false;
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const hours = profile.hours.find(h => h.day === dayName);
  if (!hours || hours.closed) return false;
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current <= close;
}

export function isAway(profile: BusinessProfile): boolean {
  if (!profile.awayEnabled) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = profile.awayStartTime.split(":").map(Number);
  const [endH, endM] = profile.awayEndTime.split(":").map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  if (start > end) {
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
}
