// components/SubmitSuccessModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  View,
  StyleSheet,
  Easing,
  Dimensions,
  Platform,
  TouchableOpacity,
  AccessibilityInfo,
} from "react-native";

const { width } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  // optional external animated values (if you want to drive animations externally)
  popupOpacity?: Animated.Value;
  popupScale?: Animated.Value;
  checkmarkScale?: Animated.Value;
  confettiOpacity?: Animated.Value;
};

const CONFETTI_COUNT = 12;

export default function SubmitSuccessModal({
  visible,
  onRequestClose,
  popupOpacity,
  popupScale,
  checkmarkScale,
  confettiOpacity,
}: Props) {
  // If the parent doesn't pass animated values, create our own
  const localPopupOpacity = useRef(popupOpacity ?? new Animated.Value(0)).current;
  const localPopupScale = useRef(popupScale ?? new Animated.Value(0.6)).current;
  const localCheckmarkScale = useRef(checkmarkScale ?? new Animated.Value(0)).current;
  const localConfettiOpacity = useRef(confettiOpacity ?? new Animated.Value(0)).current;

  // confetti animated values (one for each shard)
  const confettiAnims = useMemo(
    () =>
      new Array(CONFETTI_COUNT).fill(0).map(() => ({
        translateY: new Animated.Value(-10),
        translateX: new Animated.Value(0),
        rotate: new Animated.Value(0),
        fallDelay: Math.random() * 300,
        spinDelay: Math.random() * 100,
        opacity: new Animated.Value(0),
      })),
    []
  );

  useEffect(() => {
    let closeTimer: any;

    if (visible) {
      // announce for a11y
      AccessibilityInfo.announceForAccessibility?.("Entry submitted successfully");

      // popup in
      Animated.parallel([
        Animated.timing(localPopupOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(localPopupScale, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // checkmark pop
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(localCheckmarkScale, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();

      // confetti fade in + fall animations
      Animated.timing(localConfettiOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      confettiAnims.forEach((c, i) => {
        Animated.parallel([
          Animated.timing(c.opacity, {
            toValue: 1,
            duration: 150,
            delay: c.fallDelay,
            useNativeDriver: true,
          }),
          Animated.timing(c.translateY, {
            toValue: 160 + Math.random() * 60,
            duration: 1100 + Math.random() * 500,
            delay: c.fallDelay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(c.translateX, {
            toValue: (Math.random() - 0.5) * (width * 0.6),
            duration: 900 + Math.random() * 700,
            delay: c.fallDelay,
            useNativeDriver: true,
          }),
          Animated.timing(c.rotate, {
            toValue: Math.random() * 720 - 360,
            duration: 1200 + Math.random() * 600,
            delay: c.spinDelay,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Auto close after 3 seconds (keeps parity with your existing flow)
      closeTimer = setTimeout(() => {
        // animate out
        Animated.parallel([
          Animated.timing(localPopupOpacity, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(localPopupScale, {
            toValue: 0.8,
            duration: 240,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // call close callback once animations finish
          onRequestClose();
          // reset values so next open is fresh
          localPopupOpacity.setValue(0);
          localPopupScale.setValue(0.6);
          localCheckmarkScale.setValue(0);
          localConfettiOpacity.setValue(0);
          confettiAnims.forEach((c) => {
            c.translateY.setValue(-10);
            c.translateX.setValue(0);
            c.rotate.setValue(0);
            c.opacity.setValue(0);
          });
        });
      }, 3000);
    } else {
      // ensure it's hidden
      localPopupOpacity.setValue(0);
      localPopupScale.setValue(0.6);
      localCheckmarkScale.setValue(0);
      localConfettiOpacity.setValue(0);
      confettiAnims.forEach((c) => {
        c.translateY.setValue(-10);
        c.translateX.setValue(0);
        c.rotate.setValue(0);
        c.opacity.setValue(0);
      });
    }

    return () => clearTimeout(closeTimer);
  }, [visible, localPopupOpacity, localPopupScale, localCheckmarkScale, confettiAnims, localConfettiOpacity, onRequestClose]);

  // Confetti piece component
  const renderConfetti = () =>
    confettiAnims.map((c, i) => {
      const rotateInterpolate = c.rotate.interpolate({
        inputRange: [-360, 360],
        outputRange: ["-360deg", "360deg"],
      });

      const transform = [
        { translateX: c.translateX },
        { translateY: c.translateY },
        { rotate: rotateInterpolate },
      ];

      // colorful palette
      const colors = ["#FF4D6D", "#FFB86B", "#6BE4FF", "#8AFFA4", "#C78CFF", "#FFD76B"];
      const size = 8 + Math.round(Math.random() * 10);

      return (
        <Animated.View
          key={`confetti-${i}`}
          style={[
            styles.confetti,
            {
              opacity: c.opacity,
              backgroundColor: colors[i % colors.length],
              width: size,
              height: size * (0.6 + Math.random() * 0.8),
              borderRadius: 2,
              transform,
              left: width / 2 - 20,
            },
          ]}
          pointerEvents="none"
        />
      );
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: localPopupOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            }),
          },
        ]}
      />

      <View style={styles.centering}>
        {/* Confetti container */}
        <View style={StyleSheet.absoluteFill}>{renderConfetti()}</View>

        <Animated.View
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Submission successful"
          style={[
            styles.popup,
            {
              transform: [{ scale: localPopupScale }],
              opacity: localPopupOpacity,
            },
          ]}
        >
          {/* glossy header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  transform: [{ scale: localCheckmarkScale }],
                },
              ]}
            >
              <Text accessible accessibilityLabel="Success check" style={styles.checkText}>
                ✓
              </Text>
            </Animated.View>

            <Text style={styles.title}>Success!</Text>
            <Text style={styles.successLine}>Entry Submitted 💯</Text>
            <Text style={styles.subtitle}>Your entry was saved successfully.</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // graceful close on press
                Animated.parallel([
                  Animated.timing(localPopupOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                  }),
                  Animated.timing(localPopupScale, {
                    toValue: 0.85,
                    duration: 180,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  onRequestClose();
                  // reset
                  localPopupOpacity.setValue(0);
                  localPopupScale.setValue(0.6);
                  localCheckmarkScale.setValue(0);
                  localConfettiOpacity.setValue(0);
                });
              }}
              style={styles.doneButton}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* tap outside to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centering: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  popup: {
    width: Math.min(420, width - 48),
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.06)" : "#0f1724",
    // soft glass-like shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 18,
    alignItems: "center",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    marginBottom: 6,
  },
  checkCircle: {
    backgroundColor: "#18c77a",
    width: 88,
    height: 88,
    borderRadius: 88 / 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    // glossy rim
    shadowColor: "#18c77a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  checkText: {
    fontSize: 44,
    color: "#fff",
    fontWeight: "800",
    lineHeight: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  successLine: {
    fontSize: 16,
    color: "#dfe7ff",
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    paddingHorizontal: 6,
  },
  actions: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  doneButton: {
    width: "60%",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  doneText: {
    color: "#fff",
    fontWeight: "700",
  },
  confetti: {
    position: "absolute",
    top: 0,
    // left is set dynamically
    zIndex: 40,
    opacity: 0,
  },
});
