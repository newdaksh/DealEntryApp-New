// index.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { encode as btoa } from "base-64";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Mode = "regular" | "deal" | "tracker";

// === CONFIG — CHANGE THESE ===
const WEBHOOK_URL_FULL =
  "https://netlify-proxy-daksh.netlify.app/.netlify/functions/proxy"; // <-- existing proxy for posting

const BASIC_AUTH_USER = "SanjayJain12";
const BASIC_AUTH_PASSWORD = "SanjayJain12";
// ==============================

const STATUS_OPTIONS = ["Done", "Pending", "Future Task"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const { width, height } = Dimensions.get("window");

const colors = {
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

// Helper functions
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function getStatusColor(status: Status | string) {
  switch (status) {
    case "Done":
      return "#27ae60";
    case "Pending":
      return "#f39c12";
    case "Future Task":
      return "#3498db";
    default:
      return colors.primary;
  }
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);

  // Shared form states (existing)
  const [dealDate, setDealDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<Status | "">("");

  // Regular form
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [amountTransferred, setAmountTransferred] = useState("");
  // Deal form
  const [dealer, setDealer] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Success Popup State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const submitScale = useRef(new Animated.Value(1)).current;
  const resetScale = useRef(new Animated.Value(1)).current;

  // Success Popup Animations
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.3)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode) {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      formOpacity.setValue(0);
      formTranslateY.setValue(20);
    }
  }, [mode]);

  const canSubmit = useMemo(() => {
    if (!mode) return false;
    if (!dealDate || !status) return false;
    if (mode === "regular") {
      return !!senderName.trim() && !!receiverName.trim();
    }
    if (mode === "deal") {
      return !!dealer.trim() && !!customer.trim();
    }
    return false;
  }, [mode, dealDate, status, senderName, receiverName, dealer, customer]);

  function resetAll() {
    setDealDate(new Date());
    setStatus("");
    setSenderName("");
    setReceiverName("");
    setAmountTransferred("");
    setDealer("");
    setCustomer("");
    setAmount("");
  }

  // Impressive Success Popup Animation
  function showImpressiveSuccess() {
    setShowSuccessPopup(true);

    // Reset all animation values
    popupOpacity.setValue(0);
    popupScale.setValue(0.3);
    checkmarkScale.setValue(0);
    confettiOpacity.setValue(0);

    // Sequence of impressive animations
    Animated.sequence([
      // 1. Popup appears with scale and fade
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(popupScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),

      // 2. Checkmark bounces in
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 6,
        tension: 150,
        useNativeDriver: true,
      }),

      // 3. Confetti effect
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      // 4. Wait a moment
      Animated.delay(1500),

      // 5. Hide popup with fade out
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(popupScale, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowSuccessPopup(false);
      resetAll();
    });
  }

  async function submit() {
    if (!mode) {
      Alert.alert(
        "Choose mode",
        "Please select Regular Entry or Deal Entry first."
      );
      return;
    }
    if (!dealDate) {
      Alert.alert("Missing field", "Please select a date.");
      return;
    }
    if (!status) {
      Alert.alert("Missing field", "Please select Status.");
      return;
    }

    // Build payload to match your webhook expectations
    let payload: any = {};
    if (mode === "regular") {
      if (!senderName.trim() || !receiverName.trim()) {
        Alert.alert("Missing fields", "Please fill Sender and Receiver names.");
        return;
      }
      payload = {
        type: "regular",
        senderName: senderName.trim(),
        receiverName: receiverName.trim(),
        amountTransferred: (amountTransferred || "0").trim(),
        dealDate: formatDateISO(dealDate),
        status: status.trim(),
      };
    } else if (mode === "deal") {
      if (!dealer.trim() || !customer.trim()) {
        Alert.alert("Missing fields", "Please fill Dealer and Customer names.");
        return;
      }
      payload = {
        type: "deal",
        dealer: dealer.trim(),
        customer: customer.trim(),
        amount: (amount || "0").trim(),
        dealDate: formatDateISO(dealDate),
        status: status.trim(),
      };
    }

    // Auth header (as you use BasicAuth currently)
    const basicAuthHeader =
      BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
        ? "Basic " + btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)
        : "";

    try {
      setSubmitting(true);
      const res = await fetch(WEBHOOK_URL_FULL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        Alert.alert(`Failed (${res.status})`, text || "Request failed.");
        return;
      }

      // Show impressive success popup instead of alert
      showImpressiveSuccess();
    } catch (e: any) {
      Alert.alert("Network error", e?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  //
  // TRACKER: UI + logic
  //
  const [trackerQuery, setTrackerQuery] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerResults, setTrackerResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Robust extractor helper
  function extractNamesFromResultsArray(itemsArr: any[]): string[] {
    const names = new Set<string>();
    const dealKeys = ["dealer", "customer"];
    const regularKeys = [
      "senderName",
      "receiverName",
      "sender name",
      "receiver name",
      "sender",
      "receiver",
    ];
    const allKeys = [...dealKeys, ...regularKeys];

    for (const it of itemsArr) {
      const obj = it?.json ?? it;
      if (!obj) continue;

      const lower: Record<string, any> = {};
      for (const k of Object.keys(obj)) {
        lower[k.trim().toLowerCase()] = obj[k];
      }

      for (const key of allKeys) {
        if (lower[key.toLowerCase()]) {
          const name = String(lower[key.toLowerCase()]).trim();
          if (name) names.add(name);
        }
      }
    }
    return Array.from(names).filter(Boolean);
  }

  // Parse wrapper flexibly and return suggestions array (or empty)
  // Replace the existing parseSuggestionsFromWrapper function with this:
  function parseSuggestionsFromWrapper(wrapper: any): string[] {
    try {
      if (!wrapper) return [];

      let dataToParse: any = wrapper;

      // Proxy wraps upstream response in `upstreamBody` (string or object).
      if (wrapper.upstreamBody) {
        const ub = wrapper.upstreamBody;

        // If it's already an object (proxy may forward parsed JSON), use it.
        if (typeof ub === "object" && ub !== null) {
          dataToParse = ub;
        } else if (typeof ub === "string") {
          // Try smart parsing: 1) direct JSON.parse, 2) extract JSON array substring, 3) fallback to raw string
          try {
            dataToParse = JSON.parse(ub);
          } catch (e) {
            // try to extract first JSON array/object substring
            const firstBracket = ub.indexOf("[");
            const lastBracket = ub.lastIndexOf("]");
            const firstBrace = ub.indexOf("{");
            const lastBrace = ub.lastIndexOf("}");
            if (
              firstBracket !== -1 &&
              lastBracket !== -1 &&
              lastBracket > firstBracket
            ) {
              const candidate = ub.slice(firstBracket, lastBracket + 1);
              try {
                dataToParse = JSON.parse(candidate);
              } catch (e2) {
                // try object substring
                if (
                  firstBrace !== -1 &&
                  lastBrace !== -1 &&
                  lastBrace > firstBrace
                ) {
                  const cand2 = ub.slice(firstBrace, lastBrace + 1);
                  try {
                    dataToParse = JSON.parse(cand2);
                  } catch (e3) {
                    // leave as string
                    dataToParse = ub;
                  }
                } else {
                  dataToParse = ub;
                }
              }
            } else {
              dataToParse = ub;
            }
          }
        } else {
          dataToParse = ub;
        }
      }

      // If there's a direct `suggestions` array
      if (dataToParse && Array.isArray((dataToParse as any).suggestions)) {
        const arr = (dataToParse as any).suggestions;
        // if array of strings:
        if (arr.every((a: any) => typeof a === "string")) {
          return arr.map((s: string) => s.trim()).filter(Boolean);
        }
        // if array of objects -> extract names
        return extractNamesFromResultsArray(arr);
      }

      // If top-level is an array (could be array of strings or objects)
      if (Array.isArray(dataToParse)) {
        if (dataToParse.every((a) => typeof a === "string")) {
          return dataToParse.map((s: string) => s.trim()).filter(Boolean);
        }
        return extractNamesFromResultsArray(dataToParse);
      }

      // If it contains `results` or `rows`
      if (dataToParse && Array.isArray((dataToParse as any).results)) {
        return extractNamesFromResultsArray((dataToParse as any).results);
      }
      if (dataToParse && Array.isArray((dataToParse as any).rows)) {
        return extractNamesFromResultsArray((dataToParse as any).rows);
      }

      // deeper inspection: find any nested array and try extracting names
      if (typeof dataToParse === "object" && dataToParse !== null) {
        for (const key in dataToParse) {
          const val = (dataToParse as any)[key];
          if (Array.isArray(val)) {
            const names = extractNamesFromResultsArray(val);
            if (names.length) return names;
          }
        }
      }

      return [];
    } catch (err) {
      console.warn("parseSuggestionsFromWrapper error:", err);
      return [];
    }
  }

  // Fetch suggestions (unique names) from server to populate dropdown
  async function fetchSuggestions() {
    try {
      setTrackerLoading(true);
      const basicAuthHeader =
        BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
          ? "Basic " + btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)
          : "";

      // primary call: tracker/suggestions (n8n function merges both sheets)
      const res = await fetch(`${WEBHOOK_URL_FULL}?path=tracker/suggestions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        console.warn("suggestions endpoint failed:", res.status, txt);
        // Try fallback to regular tracker endpoint
        return await fetchSuggestionsFallback();
      }

      const wrapper = await res.json();
      console.log("Suggestions response wrapper:", wrapper);

      const found = parseSuggestionsFromWrapper(wrapper);
      console.log("Parsed suggestions:", found);

      if (found && found.length) {
        const deduped = Array.from(new Set(found))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setSuggestions(deduped);
        return;
      }

      // If no suggestions found, try fallback
      await fetchSuggestionsFallback();
    } catch (e: any) {
      console.warn("fetchSuggestions error:", e);
      Alert.alert("Network error", e?.message ?? "Couldn't load suggestions");
      setSuggestions([]);
    } finally {
      setTrackerLoading(false);
    }
  }

  // Fallback method to fetch suggestions from tracker endpoint
  async function fetchSuggestionsFallback() {
    try {
      const basicAuthHeader =
        BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
          ? "Basic " + btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)
          : "";

      // fallback: call main tracker endpoint (no q) and extract names from results
      const res = await fetch(`${WEBHOOK_URL_FULL}?path=tracker`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
        },
      });

      if (!res.ok) {
        console.warn("fallback tracker endpoint failed:", res.status);
        setSuggestions([]);
        return;
      }

      const wrapper = await res.json();
      console.log("Fallback tracker response:", wrapper);

      let resultsArray: any[] = [];

      // Try to extract results from various possible locations
      if (wrapper.upstreamBody) {
        try {
          const upstream =
            typeof wrapper.upstreamBody === "string"
              ? JSON.parse(wrapper.upstreamBody)
              : wrapper.upstreamBody;

          if (Array.isArray(upstream)) {
            resultsArray = upstream;
          } else if (upstream && Array.isArray(upstream.results)) {
            resultsArray = upstream.results;
          } else if (upstream && Array.isArray(upstream.rows)) {
            resultsArray = upstream.rows;
          }
        } catch (e) {
          console.warn("Failed to parse upstreamBody in fallback:", e);
        }
      } else if (Array.isArray(wrapper.results)) {
        resultsArray = wrapper.results;
      } else if (Array.isArray(wrapper.rows)) {
        resultsArray = wrapper.rows;
      } else if (Array.isArray(wrapper)) {
        resultsArray = wrapper;
      }

      console.log("Extracted results for fallback suggestions:", resultsArray);

      const names = extractNamesFromResultsArray(resultsArray);
      const deduped = Array.from(new Set(names))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      setSuggestions(deduped);
    } catch (err) {
      console.warn("fetchSuggestionsFallback error:", err);
      setSuggestions([]);
    }
  }

  // Helper to normalize arbitrary upstream result objects to the shape the UI expects.
  function normalizeResult(raw: any) {
    if (!raw || typeof raw !== "object") return raw;

    // helper to retrieve values from various key forms
    const rawKeys = Object.keys(raw);
    const lowerMap: Record<string, any> = {};
    for (const k of rawKeys) {
      lowerMap[k.trim().toLowerCase()] = raw[k];
    }

    const getVal = (variants: string[]) => {
      for (const v of variants) {
        // try exact key
        if (raw[v] !== undefined) return raw[v];
        // try lowercased match
        const low = v.toLowerCase();
        if (lowerMap[low] !== undefined) return lowerMap[low];
      }
      return undefined;
    };

    const typeRaw = getVal(["type", "Type", "Type "]) ?? getVal(["Type"]);
    const dealerRaw =
      getVal(["dealer", "Dealer", "Dealer Name", "DealerName"]) ?? undefined;
    const customerRaw =
      getVal(["customer", "Customer", "Customer Name", "CustomerName"]) ??
      undefined;
    const senderRaw =
      getVal(["senderName", "sender name", "Sender Name", "sender"]) ??
      undefined;
    const receiverRaw =
      getVal(["receiverName", "receiver name", "Receiver Name", "receiver"]) ??
      undefined;
    const amountTransferredRaw =
      getVal([
        "amountTransferred",
        "Amount Transferred",
        "AmountTransferred",
        "amount transferred",
      ]) ?? undefined;
    const amountRaw = getVal(["amount", "Amount"]) ?? undefined;
    const dealDateRaw =
      getVal(["dealDate", "Deal Date", "deal_date", "deal date"]) ?? undefined;
    const statusRaw = getVal(["status", "Status"]) ?? undefined;

    // convert to strings and trim where applicable
    const tidy = (v: any) =>
      v === null || v === undefined ? "" : String(v).trim();

    const normalizedType = (() => {
      const t = tidy(typeRaw);
      if (!t) {
        // infer from presence of dealer/customer vs sender/receiver
        if (dealerRaw || customerRaw) return "Deal";
        return "Regular";
      }
      const lower = t.toLowerCase();
      if (lower.includes("deal")) return "Deal";
      if (lower.includes("regular")) return "Regular";
      return t;
    })();

    return {
      // UI expects these keys:
      type: normalizedType,
      dealDate: tidy(dealDateRaw),
      dealer: tidy(dealerRaw),
      customer: tidy(customerRaw),
      senderName: tidy(senderRaw),
      receiverName: tidy(receiverRaw),
      amountTransferred: tidy(amountTransferredRaw),
      amount: tidy(amountRaw),
      status: tidy(statusRaw),
      // also keep original in case you need it
      __raw: raw,
    };
  }

  // Fetch combined results for a given name q (case-insensitive)
  async function fetchTracker(q: string) {
    if (!q || !q.trim()) {
      Alert.alert("Enter name", "Please enter or select a name to search.");
      return;
    }
    try {
      setTrackerLoading(true);
      setTrackerResults([]);
      const basicAuthHeader =
        BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
          ? "Basic " + btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)
          : "";

      // GET /tracker?q=name
      const res = await fetch(
        `${WEBHOOK_URL_FULL}?path=tracker&q=${encodeURIComponent(q.trim())}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(basicAuthHeader ? { Authorization: basicAuthHeader } : {}),
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        Alert.alert("Failed", txt || `${res.status}`);
        return;
      }

      // The proxy returns a wrapper, parse it
      const wrapper = await res.json();
      console.log("raw proxy wrapper:", wrapper);

      let results: any[] = [];

      // Extract results from upstreamBody (string or object) or other fields
      if (wrapper.upstreamBody) {
        try {
          const upstream =
            typeof wrapper.upstreamBody === "string"
              ? // sometimes upstreamBody is a stringified JSON; try parse
                (() => {
                  try {
                    return JSON.parse(wrapper.upstreamBody);
                  } catch {
                    // attempt to extract a JSON array substring if wrapper.upstreamBody contains extra text
                    const ub: string = wrapper.upstreamBody;
                    const firstBracket = ub.indexOf("[");
                    const lastBracket = ub.lastIndexOf("]");
                    if (
                      firstBracket !== -1 &&
                      lastBracket !== -1 &&
                      lastBracket > firstBracket
                    ) {
                      const cand = ub.slice(firstBracket, lastBracket + 1);
                      try {
                        return JSON.parse(cand);
                      } catch {
                        return ub;
                      }
                    }
                    return ub;
                  }
                })()
              : wrapper.upstreamBody;

          if (Array.isArray(upstream)) {
            results = upstream;
          } else if (upstream && Array.isArray(upstream.results)) {
            results = upstream.results;
          } else if (upstream && Array.isArray(upstream.rows)) {
            results = upstream.rows;
          } else if (typeof upstream === "object" && upstream !== null) {
            // maybe single object -> wrap
            results = [upstream];
          }
        } catch (e) {
          console.warn("Failed to parse upstreamBody:", e);
        }
      } else if (Array.isArray(wrapper.results)) {
        results = wrapper.results;
      } else if (Array.isArray(wrapper.rows)) {
        results = wrapper.rows;
      } else if (Array.isArray(wrapper)) {
        results = wrapper;
      }

      console.log("Final raw results:", results);

      // Normalize each result so the UI can render predictable keys
      const normalized = results.map((r) => normalizeResult(r));
      console.log("Normalized results:", normalized);
      setTrackerResults(normalized);
    } catch (e: any) {
      console.warn("fetchTracker error:", e);
      Alert.alert("Network error", e?.message ?? "Couldn't fetch tracker data");
    } finally {
      setTrackerLoading(false);
    }
  }

  // When user opens tracker mode, load suggestions
  useEffect(() => {
    if (mode === "tracker") fetchSuggestions();
  }, [mode]);

  // Enhanced premium result item renderer
  function renderResultItem({ item }: { item: any }) {
    const isDeal = item.type === "Deal";

    return (
      <Animated.View style={styles.resultCard}>
        {/* Header with type and date */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={isDeal ? "business" : "document-text"}
              size={20}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.resultType}>{item.type}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {item.dealDate}
            </Text>
          </View>
        </View>

        {/* Content based on type */}
        {isDeal ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="storefront-outline"
                size={16}
                color={colors.accent}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Dealer: <Text style={styles.resultBold}>{item.dealer}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.accent}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Customer: <Text style={styles.resultBold}>{item.customer}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={colors.success}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Amount:{" "}
                <Text style={[styles.resultBold, { color: colors.success }]}>
                  ₹{item.amount}
                </Text>
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={colors.info}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Sender: <Text style={styles.resultBold}>{item.senderName}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="arrow-down-outline"
                size={16}
                color={colors.info}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Receiver:{" "}
                <Text style={styles.resultBold}>{item.receiverName}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={colors.success}
                style={{ marginRight: 8, width: 20 }}
              />
              <Text style={styles.resultLine}>
                Amount:{" "}
                <Text style={[styles.resultBold, { color: colors.success }]}>
                  ₹{item.amountTransferred}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Status Badge */}
        <View
          style={{
            marginTop: 16,
            alignSelf: "flex-end",
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: colors.textWhite,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {item.status}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Premium Hero Section */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80",
        }}
        style={styles.heroBackground}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={colors.heroGradient}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Animated.View
              style={[styles.heroTextContainer, { opacity: formOpacity }]}
            >
              <Text style={styles.heroTitle}>पार्श्वनाथ Properties</Text>
              <Text style={styles.heroSubtitle}>
                Premium Real Estate Solutions
              </Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroDescription}>
                Professional property management and deal tracking platform
              </Text>
            </Animated.View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Mode Selector */}
          <View style={styles.modeSection}>
            <Text style={styles.sectionHeader}>Select Service</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === "regular" && styles.modeBtnActive,
                ]}
                onPress={() => setMode("regular")}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={mode === "regular" ? colors.textWhite : colors.primary}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === "regular" && styles.modeTextActive,
                  ]}
                >
                  Regular Entry
                </Text>
                <Text
                  style={[
                    styles.modeDescription,
                    mode === "regular" && styles.modeDescriptionActive,
                  ]}
                >
                  Money Transfer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === "deal" && styles.modeBtnActive,
                ]}
                onPress={() => setMode("deal")}
              >
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={mode === "deal" ? colors.textWhite : colors.primary}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === "deal" && styles.modeTextActive,
                  ]}
                >
                  Deal Entry
                </Text>
                <Text
                  style={[
                    styles.modeDescription,
                    mode === "deal" && styles.modeDescriptionActive,
                  ]}
                >
                  Property Deals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  mode === "tracker" && styles.modeBtnActive,
                ]}
                onPress={() => setMode("tracker")}
              >
                <Ionicons
                  name="search-outline"
                  size={24}
                  color={mode === "tracker" ? colors.textWhite : colors.primary}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === "tracker" && styles.modeTextActive,
                  ]}
                >
                  Tracker
                </Text>
                <Text
                  style={[
                    styles.modeDescription,
                    mode === "tracker" && styles.modeDescriptionActive,
                  ]}
                >
                  Search Records
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!mode && (
            <Text style={styles.noModeText}>Choose an option to start.</Text>
          )}

          {/* Regular form (unchanged) */}
          {mode === "regular" && (
            <Animated.View
              style={[
                styles.form,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <Text style={styles.sectionTitle}>Regular Entry</Text>

              <Text style={styles.label}>Sender Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={senderName}
                onChangeText={setSenderName}
                placeholder="e.g., Rohan Verma"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Receiver Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder="e.g., Aman Singh"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Amount Transferred</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={amountTransferred}
                onChangeText={(t) =>
                  setAmountTransferred(t.replace(/[^\d.]/g, ""))
                }
                keyboardType="decimal-pad"
                placeholder="e.g., 1500"
                placeholderTextColor={colors.textSecondary}
              />
            </Animated.View>
          )}

          {/* Deal form (unchanged) */}
          {mode === "deal" && (
            <Animated.View
              style={[
                styles.form,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <Text style={styles.sectionTitle}>Deal Entry</Text>

              <Text style={styles.label}>Dealer Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={dealer}
                onChangeText={setDealer}
                placeholder="e.g., M/S Sharma Traders"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={customer}
                onChangeText={setCustomer}
                placeholder="e.g., Rahul Jain"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
                keyboardType="decimal-pad"
                placeholder="e.g., 25000"
                placeholderTextColor={colors.textSecondary}
              />
            </Animated.View>
          )}

          {/* Shared fields for regular/deal */}
          {mode && mode !== "tracker" && (
            <Animated.View
              style={{
                width: "100%",
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              }}
            >
              <Text style={styles.label}>Deal Date</Text>
              <TouchableOpacity
                style={[styles.input, styles.datePickerButton]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formatDateDisplay(dealDate)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dealDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) setDealDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Status</Text>
              <View style={styles.chipRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setStatus(opt)}
                    style={[
                      styles.chip,
                      status === opt && [
                        styles.chipActive,
                        {
                          backgroundColor: getStatusColor(opt),
                          borderColor: getStatusColor(opt),
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        status === opt && styles.chipTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.footerRow}>
                <AnimatedTouchable
                  style={[
                    styles.btn,
                    styles.btnSecondary,
                    { transform: [{ scale: resetScale }] },
                  ]}
                  onPressIn={() =>
                    Animated.timing(resetScale, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.timing(resetScale, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }).start()
                  }
                  onPress={resetAll}
                  disabled={submitting}
                >
                  <Text style={styles.btnTextSecondary}>Reset</Text>
                </AnimatedTouchable>

                <AnimatedTouchable
                  style={[
                    styles.btn,
                    canSubmit ? styles.btnPrimary : styles.btnDisabled,
                    { transform: [{ scale: submitScale }] },
                  ]}
                  onPressIn={() =>
                    Animated.timing(submitScale, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.timing(submitScale, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    }).start()
                  }
                  onPress={submit}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.btnTextPrimary}>Submit</Text>
                  )}
                </AnimatedTouchable>
              </View>
            </Animated.View>
          )}

          {/* ENHANCED TRACKER UI */}
          {mode === "tracker" && (
            <Animated.View
              style={[
                styles.form,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <View style={styles.trackerHeader}>
                <Ionicons name="search" size={28} color={colors.primary} />
                <Text style={styles.sectionTitle}>Property Tracker</Text>
              </View>

              <Text style={styles.label}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.textPrimary}
                />{" "}
                Search Name
              </Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.input, styles.searchInput]}
                  value={trackerQuery}
                  onChangeText={setTrackerQuery}
                  placeholder="Type name e.g., Ramesh Kumar"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setShowSuggestionsModal(true);
                    fetchSuggestions();
                  }}
                >
                  {trackerLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.trackerBtnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, styles.searchBtn]}
                  onPress={() => fetchTracker(trackerQuery)}
                >
                  {trackerLoading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons
                        name="search"
                        size={16}
                        color={colors.textWhite}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.btnTextPrimary}>Search</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, styles.clearBtn]}
                  onPress={() => {
                    setTrackerQuery("");
                    setTrackerResults([]);
                  }}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={colors.textPrimary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.btnTextSecondary}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.resultsSection}>
                {trackerLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Searching records...</Text>
                  </View>
                ) : trackerResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="document-outline"
                      size={48}
                      color={colors.textLight}
                    />
                    <Text style={styles.emptyStateText}>No records found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Try searching with a different name or use the dropdown to
                      select from available options
                    </Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.resultsHeader}>
                      <Text style={styles.resultsCount}>
                        {trackerResults.length} record
                        {trackerResults.length !== 1 ? "s" : ""} found
                      </Text>
                    </View>
                    <FlatList
                      data={trackerResults}
                      keyExtractor={(_, i) => String(i)}
                      renderItem={renderResultItem}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Enhanced Suggestions Modal */}
          <Modal
            visible={showSuggestionsModal}
            animationType="slide"
            onRequestClose={() => setShowSuggestionsModal(false)}
            presentationStyle="pageSheet"
          >
            <LinearGradient
              colors={[colors.cardBackground, colors.background]}
              style={{ flex: 1 }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <Ionicons
                      name="people-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.modalTitle}>Select Name</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowSuggestionsModal(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  {trackerLoading ? (
                    <View style={styles.modalLoading}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.modalLoadingText}>
                        Loading suggestions...
                      </Text>
                    </View>
                  ) : suggestions.length === 0 ? (
                    <View style={styles.modalEmpty}>
                      <Ionicons
                        name="person-add-outline"
                        size={48}
                        color={colors.textLight}
                      />
                      <Text style={styles.modalEmptyText}>
                        No suggestions available
                      </Text>
                      <Text style={styles.modalEmptySubtext}>
                        Start typing to search or add new entries
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.suggestionsList}
                      showsVerticalScrollIndicator={false}
                    >
                      {suggestions.map((s, index) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.suggestionItem,
                            index === suggestions.length - 1 && {
                              borderBottomWidth: 0,
                            },
                          ]}
                          onPress={() => {
                            setTrackerQuery(s);
                            setShowSuggestionsModal(false);
                          }}
                        >
                          <View style={styles.suggestionContent}>
                            <Ionicons
                              name="person-outline"
                              size={20}
                              color={colors.primary}
                            />
                            <Text style={styles.suggestionText}>{s}</Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textLight}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Modal>

          {/* IMPRESSIVE SUCCESS POPUP */}
          <Modal
            visible={showSuccessPopup}
            transparent={true}
            animationType="none"
            onRequestClose={() => setShowSuccessPopup(false)}
          >
            <View style={styles.successOverlay}>
              <Animated.View
                style={[
                  styles.successPopup,
                  {
                    opacity: popupOpacity,
                    transform: [{ scale: popupScale }],
                  },
                ]}
              >
                {/* Background Gradient */}
                <LinearGradient
                  colors={[colors.success, colors.primaryLight]}
                  style={styles.successGradient}
                >
                  {/* Confetti Animation */}
                  <Animated.View
                    style={[
                      styles.confettiContainer,
                      { opacity: confettiOpacity },
                    ]}
                  >
                    {[...Array(12)].map((_, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.confettiPiece,
                          {
                            left: `${i * 8 + 10}%`,
                            backgroundColor:
                              i % 3 === 0
                                ? colors.accentLight
                                : i % 3 === 1
                                ? colors.textWhite
                                : colors.primaryLight,
                            transform: [
                              {
                                translateY: confettiOpacity.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-50, 200],
                                }),
                              },
                              {
                                rotate: confettiOpacity.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0deg", "360deg"],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                  </Animated.View>

                  {/* Main Content */}
                  <View style={styles.successContent}>
                    {/* Animated Checkmark */}
                    <Animated.View
                      style={[
                        styles.checkmarkContainer,
                        { transform: [{ scale: checkmarkScale }] },
                      ]}
                    >
                      <View style={styles.checkmarkCircle}>
                        <Ionicons
                          name="checkmark"
                          size={40}
                          color={colors.textWhite}
                        />
                      </View>
                    </Animated.View>

                    {/* Success Text */}
                    <Text style={styles.successTitle}>Entry Submitted ✅</Text>
                    <Text style={styles.successSubtitle}>
                      Your data has been saved successfully!
                    </Text>

                    {/* Decorative Elements */}
                    <View style={styles.successDivider} />

                    <View style={styles.successBadge}>
                      <Ionicons
                        name="cloud-done-outline"
                        size={20}
                        color={colors.success}
                      />
                      <Text style={styles.successBadgeText}>
                        Synced to Cloud
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  // Hero Section Styles
  heroBackground: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    opacity: 0.8,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  heroTextContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 24,
    backdropFilter: "blur(10px)",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textWhite,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 12,
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.accentLight,
    borderRadius: 2,
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 20,
  },

  // Main Container
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Mode Section
  modeSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.02 }],
  },
  modeText: {
    fontWeight: "700",
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: "center",
  },
  modeTextActive: { color: colors.textWhite },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
  modeDescriptionActive: {
    color: colors.textWhite,
    opacity: 0.9,
  },
  noModeText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Form Styles
  form: {
    width: "100%",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.primary,
    textAlign: "center",
  },

  label: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.textPrimary,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  datePickerButton: {
    justifyContent: "center",
    backgroundColor: colors.inputBg,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
    justifyContent: "center",
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.chipBg,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    transform: [{ scale: 1.05 }],
  },
  chipText: {
    color: colors.chipText,
    fontWeight: "600",
    fontSize: 14,
  },
  chipTextActive: { color: colors.textWhite },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 32,
    marginBottom: 20,
  },

  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDisabled: { backgroundColor: colors.disabled },
  btnSecondary: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
  },
  btnTextPrimary: {
    color: colors.textWhite,
    fontWeight: "bold",
    fontSize: 16,
  },
  btnTextSecondary: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },

  // Tracker Styles
  trackerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
  },
  dropdownBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trackerBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Results Section
  resultsSection: {
    marginTop: 24,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  resultsHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 120,
  },

  // Premium Result Cards
  resultCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  resultType: {
    fontWeight: "800",
    color: colors.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  resultLine: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  resultBold: {
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // Premium Modal Styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.chipBg,
  },
  modalContent: {
    flex: 1,
  },
  modalLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  modalEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  // IMPRESSIVE SUCCESS POPUP STYLES
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successPopup: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  successGradient: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: "center",
    position: "relative",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  successContent: {
    alignItems: "center",
    zIndex: 1,
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.textWhite,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textWhite,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 24,
  },
  successDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.textWhite,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.8,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  successBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
});
