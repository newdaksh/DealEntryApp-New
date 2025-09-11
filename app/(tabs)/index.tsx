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

import { DealForm } from "../../components/DealForm";
import HeroModeSelector from "../../components/HeroModeSelector";
import { HomeButton } from "../../components/HomeButton";
import { RegularForm } from "../../components/RegularForm";
import { SharedFormFields } from "../../components/SharedFormFields";
import SplashAnimation from "../../components/SplashAnimation"; // ✅ include splash
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
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.3)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const homeButtonPulse = useRef(new Animated.Value(1)).current;

  // ✅ show splash before main app
  if (showSplash) {
    return <SplashAnimation onComplete={() => setShowSplash(false)} />;
  }

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
              trackerLoading={trackerLoading}
              trackerResults={trackerResults}
              suggestions={suggestions}
              showSuggestionsModal={showSuggestionsModal}
              setShowSuggestionsModal={setShowSuggestionsModal}
              onFetchTracker={async (q) => {
                setTrackerLoading(true);
                const results = await ApiService.fetchTracker(q);
                setTrackerResults(results);
                setTrackerLoading(false);
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
                  showDatePicker={false}
                  onToggleDatePicker={() => {}}
                  formOpacity={formOpacity}
                  formTranslateY={formTranslateY}
                  canSubmit={true}
                  onSubmit={() => {}}
                  onReset={() => {}}
                  submitting={false}
                  submitScale={submitScale}
                  resetScale={resetScale}
                  onPressInSubmit={() => {}}
                  onPressOutSubmit={() => {}}
                  onPressInReset={() => {}}
                  onPressOutReset={() => {}}
                />
              </Animated.View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessPopup}
        popupOpacity={popupOpacity}
        popupScale={popupScale}
        checkmarkScale={checkmarkScale}
        confettiOpacity={confettiOpacity}
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
