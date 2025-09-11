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

// Removed duplicate colors export to fix redeclaration error.

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

export const colors = {
  background: "#F8FAFC",
  backgroundLight: "#FFFFFF",
  cardBackground: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textLight: "#94A3B8",
  textWhite: "#FFF",
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  accent: "#F59E0B",
  accentLight: "#FCD34D",
  error: "#DC2626",
  warning: "#F59E0B",
  info: "#0EA5E9",
  success: "#10B981",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  divider: "#F1F5F9",
  overlay: "rgba(0,0,0,0.4)",
  cardGradient: ["#FFFFFF", "#F8FAFC"],
  splashGradient: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"] as [
    string,
    string,
    ...string[]
  ],
  // Light theme colors
  inputBg: "#F1F5F9",
  chipBg: "#F1F5F9",
  chipText: "#64748B",
  disabled: "#94A3B8",
}; // Add your desired splash gradient colors here
