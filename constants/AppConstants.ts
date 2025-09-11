// AppConstants.ts
import { Dimensions } from "react-native";

export type Mode = "regular" | "deal" | "tracker";

// === CONFIG — CHANGE THESE ===
export const WEBHOOK_URL_FULL =
  "https://netlify-proxy-daksh.netlify.app/.netlify/functions/proxy"; // <-- existing proxy for posting

export const BASIC_AUTH_USER = "SanjayJain12";
export const BASIC_AUTH_PASSWORD = "SanjayJain12";
// ==============================

export const STATUS_OPTIONS = ["Done", "Pending", "Future Task"] as const;
export type Status = (typeof STATUS_OPTIONS)[number];

export const { width, height } = Dimensions.get("window");

export const colors = {
  // Premium Real Estate Color Palette
  background: "#0a0e13",
  backgroundLight: "#1a1f26",
  cardBackground: "#ffffff",
  textPrimary: "#1a202c",
  textSecondary: "#4a5568",
  textLight: "#a0aec0",
  textWhite: "#ffffff",

  // Brand Colors
  primary: "#2b6cb0", // Professional Blue
  primaryLight: "#3182ce",
  primaryDark: "#2c5282",
  accent: "#d69e2e", // Gold Accent
  accentLight: "#ecc94b",

  // Status Colors
  success: "#38a169",
  warning: "#d69e2e",
  error: "#e53e3e",
  info: "#3182ce",

  // UI Colors
  border: "#e2e8f0",
  borderLight: "#f7fafc",
  inputBg: "#ffffff",
  chipBg: "#f7fafc",
  chipText: "#4a5568",
  chipTextActive: "#ffffff",
  disabled: "#cbd5e0",

  // Gradients
  primaryGradient: ["#2b6cb0", "#3182ce"] as const,
  accentGradient: ["#d69e2e", "#ecc94b"] as const,
  heroGradient: ["rgba(43, 108, 176, 0.9)", "rgba(49, 130, 206, 0.8)"] as const,
  cardGradient: ["#ffffff", "#f8fafc"] as const,
};

// Form field interface types
export interface RegularFormData {
  senderName: string;
  receiverName: string;
  amountTransferred: string;
}

export interface DealFormData {
  dealer: string;
  customer: string;
  amount: string;
}

export interface SharedFormData {
  dealDate: Date;
  status: Status | "";
}

export interface NormalizedResult {
  type: string;
  dealDate: string;
  dealer: string;
  customer: string;
  senderName: string;
  receiverName: string;
  amountTransferred: string;
  amount: string;
  status: string;
  __raw?: any;
}
