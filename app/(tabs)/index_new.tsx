// index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

// Import all our extracted components and utilities
import { DealForm } from "../../components/DealForm";
import { HeroSection } from "../../components/HeroSection";
import { HomeButton } from "../../components/HomeButton";
import { ModeSelector } from "../../components/ModeSelector";
import { RegularForm } from "../../components/RegularForm";
import { SharedFormFields } from "../../components/SharedFormFields";
import { SuccessModal } from "../../components/SuccessModal";
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tracker states
  const [trackerQuery, setTrackerQuery] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerResults, setTrackerResults] = useState<NormalizedResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

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

  // Home Button Animations
  const homeButtonPulse = useRef(new Animated.Value(1)).current;

  // Initialize form animations when mode changes
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
  }, [mode, formOpacity, formTranslateY]);

  // Home button pulsing animation
  useEffect(() => {
    if (!isHomeScreen) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(homeButtonPulse, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(homeButtonPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isHomeScreen, homeButtonPulse]);

  const canSubmit = useMemo(() => {
    if (!mode) return false;
    if (!sharedData.dealDate || !sharedData.status) return false;
    if (mode === "regular") {
      return (
        !!regularData.senderName.trim() && !!regularData.receiverName.trim()
      );
    }
    if (mode === "deal") {
      return !!dealData.dealer.trim() && !!dealData.customer.trim();
    }
    return false;
  }, [
    mode,
    sharedData.dealDate,
    sharedData.status,
    regularData.senderName,
    regularData.receiverName,
    dealData.dealer,
    dealData.customer,
  ]);

  function resetAll() {
    setSharedData({
      dealDate: new Date(),
      status: "",
    });
    setRegularData({
      senderName: "",
      receiverName: "",
      amountTransferred: "",
    });
    setDealData({
      dealer: "",
      customer: "",
      amount: "",
    });
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
    if (!mode) return;

    try {
      setSubmitting(true);
      const success = await ApiService.submitEntry(
        mode,
        regularData,
        dealData,
        sharedData
      );
      if (success) {
        showImpressiveSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Tracker functions
  async function fetchSuggestions() {
    try {
      setTrackerLoading(true);
      const fetchedSuggestions = await ApiService.fetchSuggestions();
      setSuggestions(fetchedSuggestions);
    } finally {
      setTrackerLoading(false);
    }
  }

  async function fetchTracker(query: string) {
    try {
      setTrackerLoading(true);
      setTrackerResults([]);
      const results = await ApiService.fetchTracker(query);
      setTrackerResults(results);
    } finally {
      setTrackerLoading(false);
    }
  }

  

  // When user opens tracker mode, load suggestions
  useEffect(() => {
    if (mode === "tracker") fetchSuggestions();
  }, [mode]);

  // Handle going back to home
  function goToHome() {
    setMode(null);
    setIsHomeScreen(true);
  }

  // Handle mode selection
  function selectMode(selectedMode: Mode) {
    setMode(selectedMode);
    setIsHomeScreen(false);
  }

  // Button animation handlers
  const handlePressInSubmit = () => {
    Animated.timing(submitScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutSubmit = () => {
    Animated.timing(submitScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressInReset = () => {
    Animated.timing(resetScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutReset = () => {
    Animated.timing(resetScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Premium Hero Section - Only show on home screen */}
      <HeroSection isVisible={isHomeScreen} formOpacity={formOpacity} />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        {mode === "tracker" ? (
          <View
            style={[
              styles.container,
              !isHomeScreen ? styles.containerWithHomeButton : undefined,
            ]}
          >
            {/* Modern Mode Selector */}
            <ModeSelector mode={mode} onSelectMode={selectMode} />

            {/* ENHANCED TRACKER UI */}
            <TrackerComponent
              trackerQuery={trackerQuery}
              setTrackerQuery={setTrackerQuery}
              trackerLoading={trackerLoading}
              trackerResults={trackerResults}
              suggestions={suggestions}
              showSuggestionsModal={showSuggestionsModal}
              setShowSuggestionsModal={setShowSuggestionsModal}
              onFetchTracker={fetchTracker}
              onFetchSuggestions={fetchSuggestions}
              formOpacity={formOpacity}
              formTranslateY={formTranslateY}
              setTrackerResults={setTrackerResults}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={
              !isHomeScreen ? styles.containerWithHomeButton : undefined
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Modern Mode Selector */}
            <ModeSelector mode={mode} onSelectMode={selectMode} />

            {!mode && (
              <Text style={styles.noModeText}>Choose an option to start.</Text>
            )}

            {/* Regular form */}
            {mode === "regular" && (
              <RegularForm
                data={regularData}
                onUpdateData={(updatedData) =>
                  setRegularData({ ...regularData, ...updatedData })
                }
                formOpacity={formOpacity}
                formTranslateY={formTranslateY}
              />
            )}

            {/* Deal form */}
            {mode === "deal" && (
              <DealForm
                data={dealData}
                onUpdateData={(updatedData) =>
                  setDealData({ ...dealData, ...updatedData })
                }
                formOpacity={formOpacity}
                formTranslateY={formTranslateY}
              />
            )}

            {/* Shared fields for regular/deal */}
            {(mode === "regular" || mode === "deal") && (
              <SharedFormFields
                data={sharedData}
                onUpdateData={(updatedData) =>
                  setSharedData({ ...sharedData, ...updatedData })
                }
                showDatePicker={showDatePicker}
                onToggleDatePicker={setShowDatePicker}
                formOpacity={formOpacity}
                formTranslateY={formTranslateY}
                canSubmit={canSubmit}
                onSubmit={submit}
                onReset={resetAll}
                submitting={submitting}
                submitScale={submitScale}
                resetScale={resetScale}
                onPressInSubmit={handlePressInSubmit}
                onPressOutSubmit={handlePressOutSubmit}
                onPressInReset={handlePressInReset}
                onPressOutReset={handlePressOutReset}
              />
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessPopup}
        popupOpacity={popupOpacity}
        popupScale={popupScale}
        checkmarkScale={checkmarkScale}
        confettiOpacity={confettiOpacity}
        onRequestClose={() => setShowSuccessPopup(false)}
      />

      {/* Home Button */}
      <HomeButton
        isVisible={!isHomeScreen}
        onPress={goToHome}
        homeButtonPulse={homeButtonPulse}
      />
    </View>
  );
}
