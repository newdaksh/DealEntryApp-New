// index_new.tsx
import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

import ChatBot from "../../components/ChatBot";
import { DealForm } from "../../components/DealForm";
import HeroModeSelector from "../../components/HeroModeSelector";
import { HomeButton } from "../../components/HomeButton";
import { RegularForm } from "../../components/RegularForm";
import { SharedFormFields } from "../../components/SharedFormFields";
import SplashAnimation from "../../components/SplashAnimation"; // ✅ include splash
import SubmitSuccessModal from "../../components/SubmitSuccessModal";
import { TrackerComponent } from "../../components/TrackerComponent";
import {
  DealFormData,
  Mode,
  NormalizedResult,
  RegularFormData,
  SharedFormData,
} from "../../constants/AppConstants";
import { ApiService } from "../../services/ApiService";
import { styles } from "../../styles/AppStyles";

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [isHomeScreen, setIsHomeScreen] = useState(true);
  const [showSplash, setShowSplash] = useState(true); // ✅ splash state

  // Form data states
  const [regularData, setRegularData] = useState<RegularFormData>({
    senderName: "",
    receiverName: "",
    amountTransferred: "",
  });
  const [dealData, setDealData] = useState<DealFormData>({
    dealer: "",
    customer: "",
    amount: "",
  });
  const [sharedData, setSharedData] = useState<SharedFormData>({
    dealDate: new Date(),
    status: "",
  });

  // Tracker states
  const [trackerQuery, setTrackerQuery] = useState("");
  const [trackerDate, setTrackerDate] = useState<Date | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerResults, setTrackerResults] = useState<NormalizedResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Success Popup State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Date picker state (for forms)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const submitScale = useRef(new Animated.Value(1)).current;
  const resetScale = useRef(new Animated.Value(1)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.3)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const homeButtonPulse = useRef(new Animated.Value(1)).current;

  // ✅ show splash before main app
  if (showSplash) {
    return <SplashAnimation onComplete={() => setShowSplash(false)} />;
  }

  // Helper function to check if form can be submitted
  const canSubmitForm = (): boolean => {
    if (!sharedData.status || !sharedData.dealDate) return false;

    if (mode === "regular") {
      return !!(
        regularData.senderName.trim() &&
        regularData.receiverName.trim() &&
        regularData.amountTransferred.trim()
      );
    } else if (mode === "deal") {
      return !!(
        dealData.dealer.trim() &&
        dealData.customer.trim() &&
        dealData.amount.trim()
      );
    }

    return false;
  };

  // Helper to format Date -> DD/MM/YYYY (for tracker webhook)
  const formatDateForQuery = (d: Date | null) => {
    if (!d) return null;
    const dd = `${d.getDate()}`.padStart(2, "0");
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // normalize results: trim any whitespace/newlines in dealDate (and optionally other string fields)
  const normalizeResults = (items: NormalizedResult[]): NormalizedResult[] => {
    return items.map((r) => {
      const copy: any = { ...r };
      if (typeof copy.dealDate === "string") {
        copy.dealDate = copy.dealDate.trim();
      }
      // if there are other fields with stray whitespace/newline, trim them too:
      if (typeof copy.dealer === "string") copy.dealer = copy.dealer.trim();
      if (typeof copy.customer === "string")
        copy.customer = copy.customer.trim();
      if (typeof copy.status === "string") copy.status = copy.status.trim();
      return copy as NormalizedResult;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!mode || submitting) return;

    setSubmitting(true);

    try {
      const success = await ApiService.submitEntry(
        mode,
        regularData,
        dealData,
        sharedData
      );

      if (success) {
        console.log("Submission successful, showing popup");

        // Show success popup
        setShowSuccessPopup(true);

        // Trigger popup animations
        Animated.parallel([
          Animated.timing(popupOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(popupScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Trigger checkmark animation after popup appears
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
          }).start();

          // Trigger confetti animation
          Animated.timing(confettiOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });

        // Auto-close success popup after 3 seconds
        setTimeout(() => {
          console.log("Auto-closing popup");
          // Reset animations before hiding
          popupOpacity.setValue(0);
          popupScale.setValue(0.3);
          checkmarkScale.setValue(0);
          confettiOpacity.setValue(0);
          setShowSuccessPopup(false);
        }, 3000);

        // Reset form after successful submission
        if (mode === "regular") {
          setRegularData({
            senderName: "",
            receiverName: "",
            amountTransferred: "",
          });
        } else if (mode === "deal") {
          setDealData({
            dealer: "",
            customer: "",
            amount: "",
          });
        }
        setSharedData({
          dealDate: new Date(),
          status: "",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);

      // For testing - show popup even if API fails
      console.log("API failed, showing popup for testing");
      setShowSuccessPopup(true);

      // Trigger popup animations
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(popupScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Trigger checkmark animation after popup appears
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }).start();

        // Trigger confetti animation
        Animated.timing(confettiOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });

      // Auto-close success popup after 3 seconds
      setTimeout(() => {
        console.log("Auto-closing popup");
        // Reset animations before hiding
        popupOpacity.setValue(0);
        popupScale.setValue(0.3);
        checkmarkScale.setValue(0);
        confettiOpacity.setValue(0);
        setShowSuccessPopup(false);
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Form animation trigger when mode is selected
  const animateFormEntrance = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(formTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Reset form animations when going back to home
  const resetFormAnimations = () => {
    formOpacity.setValue(0);
    formTranslateY.setValue(20);
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        {mode === "tracker" ? (
          <ScrollView
            style={styles.container}
            contentContainerStyle={[
              !isHomeScreen ? styles.containerWithHomeButton : undefined,
              { flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <TrackerComponent
              trackerQuery={trackerQuery}
              setTrackerQuery={setTrackerQuery}
              trackerDate={trackerDate}
              setTrackerDate={setTrackerDate}
              trackerLoading={trackerLoading}
              trackerResults={trackerResults}
              suggestions={suggestions}
              showSuggestionsModal={showSuggestionsModal}
              setShowSuggestionsModal={setShowSuggestionsModal}
              onFetchTracker={async (q, date) => {
                setTrackerLoading(true);
                try {
                  // format date to DD/MM/YYYY if provided (webhook expects DD/MM/YYYY)
                  const dateStr = date ? formatDateForQuery(date) : null;
                  let results = await ApiService.fetchTracker(q, dateStr);
                  // If empty and date was provided, retry with trailing newline (some webhook responses store newline)
                  if ((!results || results.length === 0) && dateStr) {
                    // try with newline appended (handles webhook returning "11/09/2025\n")
                    try {
                      results = await ApiService.fetchTracker(
                        q,
                        dateStr + "\n"
                      );
                    } catch (e) {
                      console.warn("retry with newline failed:", e);
                    }
                  }
                  // normalize results to trim whitespace/newlines in fields
                  const normalized = results ? normalizeResults(results) : [];
                  setTrackerResults(normalized);
                } catch (err) {
                  console.error("fetchTracker error:", err);
                  setTrackerResults([]);
                } finally {
                  setTrackerLoading(false);
                }
              }}
              onFetchSuggestions={async () => {
                setTrackerLoading(true);
                const fetched = await ApiService.fetchSuggestions();
                setSuggestions(fetched);
                setTrackerLoading(false);
              }}
              formOpacity={formOpacity}
              formTranslateY={formTranslateY}
              setTrackerResults={setTrackerResults}
            />
          </ScrollView>
        ) : mode === "chat" ? (
          <ChatBot
            isVisible={!isHomeScreen}
            onHomePress={() => setIsHomeScreen(true)}
          />
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={
              !isHomeScreen ? styles.containerWithHomeButton : undefined
            }
            showsVerticalScrollIndicator={false}
          >
            {/* ✅ Only ONE HeroModeSelector */}
            <HeroModeSelector
              mode={mode}
              onSelectMode={(m) => {
                setMode(m);
                setIsHomeScreen(false);
                // Trigger form entrance animation
                setTimeout(() => animateFormEntrance(), 300);
              }}
              isVisible={isHomeScreen}
            />

            {!mode && !isHomeScreen && (
              <Animated.View
                style={[
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <Text style={styles.noModeText}>
                  Choose an option to start.
                </Text>
              </Animated.View>
            )}

            {mode === "regular" && (
              <Animated.View
                style={[
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <RegularForm
                  data={regularData}
                  onUpdateData={(d) => setRegularData({ ...regularData, ...d })}
                  formOpacity={formOpacity}
                  formTranslateY={formTranslateY}
                />
              </Animated.View>
            )}

            {mode === "deal" && (
              <Animated.View
                style={[
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <DealForm
                  data={dealData}
                  onUpdateData={(d) => setDealData({ ...dealData, ...d })}
                  formOpacity={formOpacity}
                  formTranslateY={formTranslateY}
                />
              </Animated.View>
            )}

            {(mode === "regular" || mode === "deal") && (
              <Animated.View
                style={[
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <SharedFormFields
                  data={sharedData}
                  onUpdateData={(d) => setSharedData({ ...sharedData, ...d })}
                  showDatePicker={showDatePicker}
                  onToggleDatePicker={setShowDatePicker}
                  formOpacity={formOpacity}
                  formTranslateY={formTranslateY}
                  canSubmit={canSubmitForm()}
                  onSubmit={handleSubmit}
                  onReset={() => {
                    // Reset form data based on current mode
                    if (mode === "regular") {
                      setRegularData({
                        senderName: "",
                        receiverName: "",
                        amountTransferred: "",
                      });
                    } else if (mode === "deal") {
                      setDealData({
                        dealer: "",
                        customer: "",
                        amount: "",
                      });
                    }
                    // Reset shared data
                    setSharedData({
                      dealDate: new Date(),
                      status: "",
                    });
                  }}
                  submitting={submitting}
                  submitScale={submitScale}
                  resetScale={resetScale}
                  onPressInSubmit={() => {
                    Animated.spring(submitScale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOutSubmit={() => {
                    Animated.spring(submitScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressInReset={() => {
                    Animated.spring(resetScale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOutReset={() => {
                    Animated.spring(resetScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }}
                />
              </Animated.View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <SubmitSuccessModal
        visible={showSuccessPopup}
        onRequestClose={() => setShowSuccessPopup(false)}
      />

      <HomeButton
        isVisible={!isHomeScreen}
        onPress={() => {
          setMode(null);
          setIsHomeScreen(true);
          resetFormAnimations();
        }}
        homeButtonPulse={homeButtonPulse}
      />
    </View>
  );
}
