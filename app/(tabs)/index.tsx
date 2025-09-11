// index.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { encode as btoa } from "base-64";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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

const colors = {
  background: "#f4f7fa",
  textPrimary: "#2c3e50",
  textSecondary: "#7f8c8d",
  primary: "#3498db",
  accent: "#e67e22",
  border: "#d1d5db",
  inputBg: "#ffffff",
  chipBg: "#ecf0f1",
  chipText: "#34495e",
  chipTextActive: "#ffffff",
  btnPrimary: "#3498db",
  btnTextPrimary: "#ffffff",
  btnSecondary: "#ffffff",
  btnSecondaryBorder: "#bdc3c7",
  btnTextSecondary: "#2c3e50",
  disabled: "#bdc3c7",
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

  // Animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const submitScale = useRef(new Animated.Value(1)).current;
  const resetScale = useRef(new Animated.Value(1)).current;

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

      Alert.alert("Success", "Entry saved successfully.");
      resetAll();
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
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
              const candidate = ub.slice(firstBracket, lastBracket + 1);
              try {
                dataToParse = JSON.parse(candidate);
              } catch (e2) {
                // try object substring
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
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
      getVal(["senderName", "sender name", "Sender Name", "sender"]) ?? undefined;
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
                    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
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

  // small item renderer
  function renderResultItem({ item }: { item: any }) {
    return (
      <View style={styles.resultCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.resultType}>{item.type}</Text>
          <Text style={{ color: colors.textSecondary }}>{item.dealDate}</Text>
        </View>

        {item.type === "Deal" ? (
          <>
            <Text style={styles.resultLine}>
              Dealer: <Text style={styles.resultBold}>{item.dealer}</Text>
            </Text>
            <Text style={styles.resultLine}>
              Customer: <Text style={styles.resultBold}>{item.customer}</Text>
            </Text>
            <Text style={styles.resultLine}>
              Amount: <Text style={styles.resultBold}>{item.amount}</Text>
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.resultLine}>
              Sender: <Text style={styles.resultBold}>{item.senderName}</Text>
            </Text>
            <Text style={styles.resultLine}>
              Receiver:{" "}
              <Text style={styles.resultBold}>{item.receiverName}</Text>
            </Text>
            <Text style={styles.resultLine}>
              Amount:{" "}
              <Text style={styles.resultBold}>{item.amountTransferred}</Text>
            </Text>
          </>
        )}

        <View style={{ marginTop: 8, alignSelf: "flex-end" }}>
          <Text style={{ color: getStatusColor(item.status) }}>
            {item.status}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>पार्श्वनाथ Properties</Text>

        {/* Mode selector: Regular / Deal / Tracker */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "regular" && styles.modeBtnActive]}
            onPress={() => setMode("regular")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "regular" && styles.modeTextActive,
              ]}
            >
              Regular Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "deal" && styles.modeBtnActive]}
            onPress={() => setMode("deal")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "deal" && styles.modeTextActive,
              ]}
            >
              Deal Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "tracker" && styles.modeBtnActive]}
            onPress={() => setMode("tracker")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "tracker" && styles.modeTextActive,
              ]}
            >
              Tracker
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.dateText}>{formatDateDisplay(dealDate)}</Text>
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
                  <ActivityIndicator color={colors.btnTextPrimary} />
                ) : (
                  <Text style={styles.btnTextPrimary}>Submit</Text>
                )}
              </AnimatedTouchable>
            </View>
          </Animated.View>
        )}

        {/* TRACKER UI */}
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
            <Text style={styles.sectionTitle}>Tracker</Text>

            <Text style={styles.label}>Search / Select Name</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={trackerQuery}
                onChangeText={setTrackerQuery}
                placeholder="Type name e.g., Ramesh"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.btnSecondary,
                  { paddingHorizontal: 12, alignSelf: "center" },
                ]}
                onPress={() => {
                  // ensure suggestions are loaded when dropdown opens
                  setShowSuggestionsModal(true);
                  fetchSuggestions();
                }}
              >
                {trackerLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.btnTextSecondary}>Dropdown</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { marginRight: 8 }]}
                onPress={() => fetchTracker(trackerQuery)}
              >
                {trackerLoading ? (
                  <ActivityIndicator color={colors.btnTextPrimary} />
                ) : (
                  <Text style={styles.btnTextPrimary}>Search</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => {
                  setTrackerQuery("");
                  setTrackerResults([]);
                }}
              >
                <Text style={styles.btnTextSecondary}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 20 }}>
              {trackerLoading ? (
                <ActivityIndicator />
              ) : trackerResults.length === 0 ? (
                <Text style={{ color: colors.textSecondary }}>
                  No results yet. Try search or pick from dropdown.
                </Text>
              ) : (
                <FlatList
                  data={trackerResults}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={renderResultItem}
                />
              )}
            </View>
          </Animated.View>
        )}

        {/* Suggestions modal */}
        <Modal
          visible={showSuggestionsModal}
          animationType="slide"
          onRequestClose={() => setShowSuggestionsModal(false)}
        >
          <View style={[styles.container, { paddingTop: 30 }]}>
            <Text style={styles.sectionTitle}>Select Name</Text>
            {trackerLoading ? (
              <ActivityIndicator />
            ) : suggestions.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>
                No suggestions available.
              </Text>
            ) : (
              <ScrollView style={{ width: "100%" }}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => {
                      setTrackerQuery(s);
                      setShowSuggestionsModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.btnSecondary,
                styles.closeButton,
                { marginTop: 16 },
              ]}
              onPress={() => setShowSuggestionsModal(false)}
            >
              <Text style={styles.btnTextSecondary}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: colors.background,
    minHeight: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  modeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: { fontWeight: "600", color: colors.textPrimary },
  modeTextActive: { color: colors.btnTextPrimary },
  noModeText: { marginTop: 6, color: colors.textSecondary, fontSize: 16 },

  form: { width: "100%" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: colors.primary,
  },

  label: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  },

  datePickerButton: { justifyContent: "center" },
  dateText: { color: colors.textPrimary, fontSize: 16 },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chipBg,
  },
  chipActive: { borderColor: colors.primary },
  chipText: { color: colors.chipText, fontWeight: "600" },
  chipTextActive: { color: colors.chipTextActive },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 24,
    marginBottom: 20,
  },

  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnPrimary: { backgroundColor: colors.btnPrimary },
  btnDisabled: { backgroundColor: colors.disabled },
  btnSecondary: {
    backgroundColor: colors.btnSecondary,
    borderWidth: 1,
    borderColor: colors.btnSecondaryBorder,
  },
  btnTextPrimary: { color: colors.btnTextPrimary, fontWeight: "bold" },
  btnTextSecondary: { color: colors.btnTextSecondary, fontWeight: "600" },

  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 120,
  },

  resultCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultType: { fontWeight: "700", color: colors.primary },
  resultLine: { marginTop: 6, color: colors.textPrimary },
  resultBold: { fontWeight: "700" },
});
