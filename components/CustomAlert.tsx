// components/CustomAlert.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/AppConstants";

type AlertType = "success" | "warning" | "error" | "info";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  icon?: string;
  iconColor?: string;
  buttonText?: string;
  buttonColor?: string;
  onClose: () => void;
}

const getAlertTheme = (type: AlertType) => {
  switch (type) {
    case "success":
      return {
        icon: "checkmark-circle",
        iconColor: colors.success,
        buttonColor: colors.success,
      };
    case "warning":
      return {
        icon: "warning",
        iconColor: colors.warning,
        buttonColor: colors.warning,
      };
    case "error":
      return {
        icon: "close-circle",
        iconColor: colors.error,
        buttonColor: colors.error,
      };
    case "info":
    default:
      return {
        icon: "information-circle",
        iconColor: colors.info,
        buttonColor: colors.info,
      };
  }
};

const { width: screenWidth } = Dimensions.get("window");

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = "info",
  icon,
  iconColor,
  buttonText = "OK",
  buttonColor,
  onClose,
}) => {
  const theme = getAlertTheme(type);
  const finalIcon = icon || theme.icon;
  const finalIconColor = iconColor || theme.iconColor;
  const finalButtonColor = buttonColor || theme.buttonColor;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      scale: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnim.setValue(50);
      iconPulseAnim.setValue(1);
      shimmerAnim.setValue(0);

      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon pulse animation
      const iconPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(iconPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      iconPulse.start();

      // Shimmer effect for the card
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      shimmer.start();

      // Glow effect for icon
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();

      // Particle animations
      const particles = particleAnims.map((particle, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.parallel([
              Animated.timing(particle.scale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: -30,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: -50,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        )
      );
      particles.forEach((p) => p.start());

      return () => {
        iconPulse.stop();
        shimmer.stop();
        glow.stop();
        particles.forEach((p) => p.stop());
      };
    }
  }, [
    visible,
    fadeAnim,
    scaleAnim,
    slideAnim,
    iconPulseAnim,
    shimmerAnim,
    glowAnim,
    particleAnims,
  ]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Shimmer Effect Overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.1, 0],
                }),
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-screenWidth, screenWidth],
                    }),
                  },
                ],
              },
            ]}
          />

          <LinearGradient
            colors={[colors.cardBackground, "#f8fafc"]}
            style={styles.alertCard}
          >
            {/* Background Pattern */}
            <View style={styles.backgroundPattern} />
            {/* Decorative Top Border */}
            <LinearGradient
              colors={[finalIconColor, colors.accentLight]}
              style={styles.topBorder}
            />

            {/* Icon Section */}
            <View style={styles.iconSection}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: finalIconColor + "20" },
                ]}
              >
                {/* Glow Effect */}
                <Animated.View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderRadius: 40,
                      backgroundColor: finalIconColor,
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.3],
                      }),
                      transform: [
                        {
                          scale: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />

                {/* Floating Particles */}
                {particleAnims.map((particle, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        position: "absolute",
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: finalIconColor,
                        left: 35 + Math.cos(index * 60) * 25,
                        top: 35 + Math.sin(index * 60) * 25,
                      },
                      {
                        opacity: particle.opacity,
                        transform: [
                          { scale: particle.scale },
                          { translateY: particle.translateY },
                        ],
                      },
                    ]}
                  />
                ))}

                <Animated.View
                  style={[
                    styles.iconWrapper,
                    {
                      transform: [{ scale: iconPulseAnim }],
                    },
                  ]}
                >
                  <Ionicons
                    name={finalIcon as any}
                    size={36}
                    color={finalIconColor}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <Text style={styles.alertTitle}>{title}</Text>
              <Text style={styles.alertMessage}>{message}</Text>
            </View>

            {/* Action Section */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: finalButtonColor },
                ]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[finalButtonColor, finalButtonColor + "DD"]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{buttonText}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.textWhite}
                    style={{ marginLeft: 8 }}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(5px)",
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 24,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.textWhite,
    opacity: 0,
  },
  alertCard: {
    padding: 0,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border + "40",
  },
  topBorder: {
    height: 4,
    width: "100%",
  },
  iconSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  alertMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textWhite,
    letterSpacing: 0.5,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentLight + "20",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -15,
    left: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "15",
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundImage:
      "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)",
  },
});
