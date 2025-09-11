// components/SuccessModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Modal, Text, View } from "react-native";
import { colors } from "../constants/AppConstants";
import { styles } from "../styles/AppStyles";

interface SuccessModalProps {
  visible: boolean;
  popupOpacity: Animated.Value;
  popupScale: Animated.Value;
  checkmarkScale: Animated.Value;
  confettiOpacity: Animated.Value;
  onRequestClose: () => void;
}

export function SuccessModal({
  visible,
  popupOpacity,
  popupScale,
  checkmarkScale,
  confettiOpacity,
  onRequestClose,
}: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onRequestClose}
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
              style={[styles.confettiContainer, { opacity: confettiOpacity }]}
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
                <Text style={styles.successBadgeText}>Synced to Cloud</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}
