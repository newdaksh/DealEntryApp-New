// index.tsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { encode as btoa } from "base-64";

type Mode = "regular" | "deal";

// === CONFIG — CHANGE THESE ===
const WEBHOOK_URL_FULL =
  "https://netlify-proxy-daksh.netlify.app/.netlify/functions/proxy"; // <-- include your webhook path
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

// Helper function to format date as YYYY-MM-DD
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper function to format date for display
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusColor(status: Status) {
  switch (status) {
    case "Done":
      return "#27ae60";
    case "Pending":
      return "#f39c12";
    case "Future Task":
      return "#3498db";
  }
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);

  // Shared
  const [dealDate, setDealDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<Status | "">("");

  // Regular
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [amountTransferred, setAmountTransferred] = useState("");
  const [isSenderFocused, setSenderFocused] = useState(false);
  const [isReceiverFocused, setReceiverFocused] = useState(false);
  const [isAmountTransferredFocused, setAmountTransferredFocused] =
    useState(false);

  // Deal
  const [dealer, setDealer] = useState("");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [isDealerFocused, setDealerFocused] = useState(false);
  const [isCustomerFocused, setCustomerFocused] = useState(false);
  const [isAmountFocused, setAmountFocused] = useState(false);

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
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      formOpacity.setValue(0);
      formTranslateY.setValue(20);
    }
  }, [mode, formOpacity, formTranslateY]);

  const canSubmit = useMemo(() => {
    if (!mode) return false;
    if (!dealDate || !status) return false;
    if (mode === "regular") {
      return !!senderName.trim() && !!receiverName.trim();
    }
    return !!dealer.trim() && !!customer.trim();
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

    // Build payload exactly as n8n expressions expect: { body: {...} }
    let payload: any = { body: {} };

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
    } else {
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

    // Auth header (required by n8n webhook when basicAuth is enabled)
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
        // Bubble up server-side error details to debug fast
        Alert.alert(
          `Failed (${res.status})`,
          text ||
            "Request failed. Check webhook URL/path, auth, and payload keys."
        );
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Property Entry Console</Text>

        {/* Mode selector */}
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
        </View>

        {!mode && (
          <Text style={styles.noModeText}>Choose an option to start.</Text>
        )}

        {/* Forms */}
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
              style={[
                styles.input,
                {
                  borderColor: isSenderFocused ? colors.primary : colors.border,
                },
              ]}
              value={senderName}
              onChangeText={setSenderName}
              placeholder="e.g., Rohan Verma"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setSenderFocused(true)}
              onBlur={() => setSenderFocused(false)}
            />

            <Text style={styles.label}>Receiver Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isReceiverFocused
                    ? colors.primary
                    : colors.border,
                },
              ]}
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="e.g., Aman Singh"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setReceiverFocused(true)}
              onBlur={() => setReceiverFocused(false)}
            />

            <Text style={styles.label}>Amount Transferred</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isAmountTransferredFocused
                    ? colors.primary
                    : colors.border,
                },
              ]}
              value={amountTransferred}
              onChangeText={(t) =>
                setAmountTransferred(t.replace(/[^\d.]/g, ""))
              }
              keyboardType="decimal-pad"
              placeholder="e.g., 1500"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setAmountTransferredFocused(true)}
              onBlur={() => setAmountTransferredFocused(false)}
            />
          </Animated.View>
        )}

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
              style={[
                styles.input,
                {
                  borderColor: isDealerFocused ? colors.primary : colors.border,
                },
              ]}
              value={dealer}
              onChangeText={setDealer}
              placeholder="e.g., M/S Sharma Traders"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setDealerFocused(true)}
              onBlur={() => setDealerFocused(false)}
            />

            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isCustomerFocused
                    ? colors.primary
                    : colors.border,
                },
              ]}
              value={customer}
              onChangeText={setCustomer}
              placeholder="e.g., Rahul Jain"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setCustomerFocused(true)}
              onBlur={() => setCustomerFocused(false)}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: isAmountFocused ? colors.primary : colors.border,
                },
              ]}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="e.g., 25000"
              placeholderTextColor={colors.textSecondary}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
            />
          </Animated.View>
        )}

        {/* Shared fields */}
        {mode && (
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
                  if (selectedDate) {
                    setDealDate(selectedDate);
                  }
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
      </ScrollView>
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
    gap: 16,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  modeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modeTextActive: {
    color: colors.btnTextPrimary,
  },
  noModeText: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 16,
  },

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
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.inputBg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },

  datePickerButton: {
    justifyContent: "center",
  },

  dateText: {
    color: colors.textPrimary,
    fontSize: 16,
  },

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
  chipActive: {
    borderColor: colors.primary, // Overridden by dynamic style
  },
  chipText: { color: colors.chipText, fontWeight: "600" },
  chipTextActive: { color: colors.chipTextActive },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPrimary: { backgroundColor: colors.btnPrimary },
  btnDisabled: { backgroundColor: colors.disabled },
  btnSecondary: {
    backgroundColor: colors.btnSecondary,
    borderWidth: 1,
    borderColor: colors.btnSecondaryBorder,
  },
  btnTextPrimary: {
    color: colors.btnTextPrimary,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  btnTextSecondary: { color: colors.btnTextSecondary, fontWeight: "600" },
});
