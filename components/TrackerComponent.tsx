// components/TrackerComponent.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NormalizedResult, colors } from "../constants/AppConstants";
import { useCustomAlert } from "../hooks/useCustomAlert";
import { styles } from "../styles/AppStyles";
import { getStatusColor } from "../utils/AppUtils";
import { CustomAlert } from "./CustomAlert";

interface TrackerComponentProps {
  trackerQuery: string;
  setTrackerQuery: (query: string) => void;
  trackerDate: Date | null;
  setTrackerDate: (d: Date | null) => void;
  trackerLoading: boolean;
  trackerResults: NormalizedResult[];
  setTrackerResults: (results: NormalizedResult[]) => void;
  suggestions: string[];
  showSuggestionsModal: boolean;
  setShowSuggestionsModal: (show: boolean) => void;
  onFetchTracker: (query: string, date?: Date | null) => void;
  onFetchSuggestions: () => void;
  formOpacity: Animated.Value;
  formTranslateY: Animated.Value;
}

export function TrackerComponent({
  trackerQuery,
  setTrackerQuery,
  trackerDate,
  setTrackerDate,
  trackerLoading,
  trackerResults,
  suggestions,
  setTrackerResults,
  showSuggestionsModal,
  setShowSuggestionsModal,
  onFetchTracker,
  onFetchSuggestions,
  formOpacity,
  formTranslateY,
}: TrackerComponentProps) {
  const { alertConfig, isVisible, showWarning, hideAlert } = useCustomAlert();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleFetchTracker = () => {
    const hasQuery = !!(trackerQuery && trackerQuery.trim());
    const hasDate = !!trackerDate;
    if (!hasQuery && !hasDate) {
      showWarning(
        "Search Required",
        "Please enter a name or pick a date to search for property records."
      );
      return;
    }
    onFetchTracker(trackerQuery, trackerDate);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    // On Android, event.type can be 'dismissed' or 'set'
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS; hide on Android after selection
    if (selectedDate) {
      setTrackerDate(selectedDate);
    }
  };

  const clearDate = () => {
    setTrackerDate(null);
  };

  // Enhanced premium result item renderer
  function renderResultItem({ item }: { item: NormalizedResult }) {
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

  // Format date display as DD/MM/YYYY
  const formatDisplayDate = (d: Date | null) => {
    if (!d) return "";
    const dd = `${d.getDate()}`.padStart(2, "0");
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Insert inside TrackerComponent, above the return(...) block

  // helper to parse `DD/MM/YYYY` to Date (local)
  const parseDDMMYYYY = (s: string | undefined | null): Date | null => {
    if (!s) return null;
    const parts = s.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
    if (Number.isNaN(dd) || Number.isNaN(mm) || Number.isNaN(yyyy)) return null;
    return new Date(yyyy, mm - 1, dd);
  };

  // normalize a date to date-only (zero time)
  const dateOnly = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // compute filtered list locally
  const filteredResults = trackerResults.filter((item) => {
    // 1) name filter: check any name-like fields (dealer, customer, senderName, receiverName)
    const q = (trackerQuery || "").trim().toLowerCase();
    if (q) {
      const matchesName =
        (item.dealer || "").toLowerCase().includes(q) ||
        (item.customer || "").toLowerCase().includes(q) ||
        (item.senderName || "").toLowerCase().includes(q) ||
        (item.receiverName || "").toLowerCase().includes(q);
      if (!matchesName) return false;
    }

    // 2) date filter
    if (trackerDate) {
      // parse item's date (assumes item.dealDate is DD/MM/YYYY)
      const itemDate = parseDDMMYYYY(item.dealDate);
      if (!itemDate) return false;
      if (dateOnly(itemDate).getTime() !== dateOnly(trackerDate).getTime()) {
        return false;
      }
    }

    return true;
  });

  return (
    <>
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
              onFetchSuggestions();
            }}
          >
            {trackerLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker Row */}
        <Text style={[styles.label, { marginTop: 12 }]}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textPrimary}
          />{" "}
          Filter by Date
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              { flexDirection: "row", alignItems: "center", padding: 10 },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={{ marginLeft: 8, color: colors.textPrimary }}>
              {trackerDate ? formatDisplayDate(trackerDate) : "Select date"}
            </Text>
          </TouchableOpacity>

          {trackerDate ? (
            <TouchableOpacity
              style={[
                {
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: colors.inputBg,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}
              onPress={() => {
                clearDate();
              }}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              <Text
                style={[
                  {
                    marginLeft: 6,
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '500',
                  },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Buttons */}
        <View style={[styles.trackerBtnRow, { marginTop: 20 }]}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.searchBtn]}
            onPress={handleFetchTracker}
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
              setTrackerDate(null);
              onFetchTracker("", null); // clear results by fetching blank
            }}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={colors.textPrimary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnTextSecondary}>Clear All</Text>
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
            <View style={{ flex: 1 }}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {trackerResults.length} record
                  {trackerResults.length !== 1 ? "s" : ""} found
                </Text>
              </View>
              <View style={{ paddingBottom: 20 }}>
                {filteredResults.map((item, index) => (
                  <View key={index}>{renderResultItem({ item })}</View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* DateTimePicker (native modal) */}
      {showDatePicker && (
        <DateTimePicker
          value={trackerDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1970, 0, 1)}
        />
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
                <Ionicons name="close" size={24} color={colors.textSecondary} />
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

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          icon={alertConfig.icon}
          iconColor={alertConfig.iconColor}
          buttonText={alertConfig.buttonText}
          buttonColor={alertConfig.buttonColor}
          onClose={hideAlert}
        />
      )}
    </>
  );
}
