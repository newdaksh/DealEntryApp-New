// components/TrackerComponent.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Animated,
  Modal,
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
  trackerLoading: boolean;
  trackerResults: NormalizedResult[];
  setTrackerResults: (results: NormalizedResult[]) => void;
  suggestions: string[];
  showSuggestionsModal: boolean;
  setShowSuggestionsModal: (show: boolean) => void;
  onFetchTracker: (query: string) => void;
  onFetchSuggestions: () => void;
  formOpacity: Animated.Value;
  formTranslateY: Animated.Value;
}

export function TrackerComponent({
  trackerQuery,
  setTrackerQuery,
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

  const handleFetchTracker = () => {
    if (!trackerQuery || !trackerQuery.trim()) {
      showWarning(
        "Search Required",
        "Please enter or select a name to search for property records."
      );
      return;
    }
    onFetchTracker(trackerQuery);
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

        <View style={styles.trackerBtnRow}>
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
              // setShowSuggestionsModal(false);
              // Optionally clear results as well
              onFetchTracker("");
              // onFetchSuggestions();
              // setTrackerResults([]);
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
            <View style={{ flex: 1 }}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {trackerResults.length} record
                  {trackerResults.length !== 1 ? "s" : ""} found
                </Text>
              </View>
              <View style={{ paddingBottom: 20 }}>
                {trackerResults.map((item, index) => (
                  <View key={index}>{renderResultItem({ item })}</View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.View>

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
