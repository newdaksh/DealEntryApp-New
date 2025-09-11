// components/HeroModeSelector.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, Mode } from "../constants/AppConstants";

interface HeroModeSelectorProps {
  mode: Mode | null;
  onSelectMode: (selectedMode: Mode) => void;
  isVisible: boolean;
}

const { width, height } = Dimensions.get("window");

const HeroModeSelector: React.FC<HeroModeSelectorProps> = ({
  mode,
  onSelectMode,
  isVisible,
}) => {
  // Animation values
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const titleSlideY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const cardSlideY = useRef(new Animated.Value(50)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Create floating particles
  const particles = useRef(
    Array.from({ length: 15 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      opacity: new Animated.Value(Math.random() * 0.7 + 0.3),
    }))
  ).current;

  useEffect(() => {
    if (isVisible) {
      // Main entrance animation
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          // Hero section entrance
          Animated.spring(heroOpacity, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(heroScale, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          // Title animation
          Animated.spring(titleSlideY, {
            toValue: 0,
            friction: 8,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),

        Animated.delay(200),
        // Subtitle fade in
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),

        Animated.delay(300),
        // Mode cards entrance
        Animated.parallel([
          Animated.spring(cardSlideY, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous floating animation
      const floating = Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      floating.start();

      // Sparkle rotation
      const sparkle = Animated.loop(
        Animated.timing(sparkleRotate, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      sparkle.start();

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Particle animations
      particles.forEach((particle, index) => {
        const randomDuration = 4000 + Math.random() * 3000;
        const randomDelay = index * 100;

        Animated.loop(
          Animated.sequence([
            Animated.delay(randomDelay),
            Animated.parallel([
              Animated.timing(particle.translateY, {
                toValue: -20 + Math.random() * 40,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateX, {
                toValue: -10 + Math.random() * 20,
                duration: randomDuration,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.translateY, {
                toValue: 0,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateX, {
                toValue: 0,
                duration: randomDuration,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const modeOptions = [
    {
      id: "regular" as Mode,
      title: "Regular Transfer",
      subtitle: "Track money transfers",
      icon: "swap-horizontal",
      gradient: [colors.info, colors.primary] as const,
      description: "Manage sender-receiver transactions",
    },
    {
      id: "deal" as Mode,
      title: "Property Deal",
      subtitle: "Handle property deals",
      icon: "business",
      gradient: [colors.primary, colors.accent] as const,
      description: "Track dealer-customer deals",
    },
    {
      id: "tracker" as Mode,
      title: "Search Records",
      subtitle: "Find existing records",
      icon: "search",
      gradient: [colors.success, colors.info] as const,
      description: "Search and view all records",
    },
  ];

  const handleModeSelect = (selectedMode: Mode) => {
    // Add selection animation
    Animated.sequence([
      Animated.timing(cardOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onSelectMode(selectedMode);
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: heroOpacity,
          transform: [{ scale: heroScale }],
        },
      ]}
    >
      {/* Hero Background */}
      <ImageBackground
        source={require("../assets/images/react-logo.png")}
        style={styles.heroBackground}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={[
            "rgba(37, 99, 235, 0.95)",
            "rgba(59, 130, 246, 0.9)",
            "rgba(245, 158, 11, 0.85)",
            "rgba(59, 130, 246, 0.9)",
            "rgba(37, 99, 235, 0.95)",
          ]}
          style={styles.heroGradient}
        >
          {/* Floating Background Particles */}
          {particles.map((particle, index) => (
            <Animated.View
              key={`particle-${index}`}
              style={[
                styles.floatingParticle,
                {
                  left: (index % 5) * (width / 5) + 10,
                  top: 50 + Math.floor(index / 5) * 80,
                  opacity: particle.opacity,
                  transform: [
                    { translateY: particle.translateY },
                    { translateX: particle.translateX },
                    { scale: particle.scale },
                  ],
                },
              ]}
            />
          ))}

          {/* Sparkle Effects */}
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                transform: [
                  {
                    rotate: sparkleRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <View
                key={`sparkle-${index}`}
                style={[
                  styles.sparkle,
                  {
                    top: 30 + index * 60,
                    left: 20 + (index % 2) * (width - 60),
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Hero Content */}
          <Animated.View
            style={[
              styles.heroContent,
              {
                transform: [{ translateY: titleSlideY }, { scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Property Deals</Text>
              <Text style={styles.heroTitleAccent}>Manager</Text>
              <View style={styles.heroDivider} />

              <Animated.View
                style={[
                  styles.heroSubtitleContainer,
                  { opacity: subtitleOpacity },
                ]}
              >
                <Text style={styles.heroSubtitle}>
                  Professional Real Estate Management
                </Text>
                <Text style={styles.heroDescription}>
                  Track deals • Manage transfers • Search records
                </Text>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Floating Decorative Elements */}
          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIcon1,
              {
                transform: [
                  {
                    translateY: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="home" size={24} color={colors.textWhite + "60"} />
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingIcon,
              styles.floatingIcon2,
              {
                transform: [
                  {
                    translateY: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color={colors.textWhite + "40"}
            />
          </Animated.View>
        </LinearGradient>
      </ImageBackground>

      {/* Mode Selection Cards */}
      <Animated.View
        style={[
          styles.modeSection,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardSlideY }],
          },
        ]}
      >
        <View style={styles.modeSectionHeader}>
          <Text style={styles.sectionTitle}>Choose Your Action</Text>
          <Text style={styles.sectionSubtitle}>
            Select what you&apos;d like to do today
          </Text>
        </View>

        <View style={styles.modeGrid}>
          {modeOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.modeCardWrapper,
                {
                  opacity: cardOpacity,
                  transform: [
                    {
                      translateY: cardSlideY.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50 + index * 10],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  mode === option.id && styles.modeCardSelected,
                ]}
                onPress={() => handleModeSelect(option.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={option.gradient}
                  style={styles.modeCardGradient}
                >
                  {/* Selection Indicator */}
                  {mode === option.id && (
                    <View style={styles.selectionIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.textWhite}
                      />
                    </View>
                  )}

                  {/* Icon Section */}
                  <View style={styles.modeIconContainer}>
                    <View style={styles.modeIconBackground}>
                      <Ionicons
                        name={option.icon as any}
                        size={32}
                        color={colors.textWhite}
                      />
                    </View>
                  </View>

                  {/* Content Section */}
                  <View style={styles.modeContent}>
                    <Text style={styles.modeTitle}>{option.title}</Text>
                    <Text style={styles.modeSubtitle}>{option.subtitle}</Text>
                    <Text style={styles.modeDescription}>
                      {option.description}
                    </Text>
                  </View>

                  {/* Shimmer Effect */}
                  <View style={styles.shimmerOverlay} />

                  {/* Decorative Corner */}
                  <View style={styles.decorativeCorner} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBackground: {
    height: height * 0.45,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    opacity: 0.1,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  floatingParticle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textWhite + "60",
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: colors.textWhite + "80",
    transform: [{ rotate: "45deg" }],
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    zIndex: 10,
  },
  heroTextContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    padding: 30,
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "bold",
    color: colors.textWhite,
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroTitleAccent: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.accentLight,
    textAlign: "center",
    letterSpacing: 4,
    marginTop: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroDivider: {
    width: 80,
    height: 3,
    backgroundColor: colors.accentLight,
    borderRadius: 2,
    marginVertical: 15,
  },
  heroSubtitleContainer: {
    alignItems: "center",
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 1,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 20,
  },
  floatingIcon: {
    position: "absolute",
    padding: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  floatingIcon1: {
    top: 60,
    right: 30,
  },
  floatingIcon2: {
    bottom: 60,
    left: 30,
  },
  modeSection: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    paddingHorizontal: 20,
    marginTop: -20,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modeSectionHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 5,
    opacity: 0.8,
  },
  modeGrid: {
    gap: 20,
  },
  modeCardWrapper: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modeCard: {
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 120,
  },
  modeCardSelected: {
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  modeCardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  selectionIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
  },
  modeIconContainer: {
    marginRight: 20,
  },
  modeIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textWhite,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modeSubtitle: {
    fontSize: 14,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: 6,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textWhite,
    opacity: 0.8,
    lineHeight: 16,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: -100,
    width: 100,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "-20deg" }],
  },
  decorativeCorner: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: 30,
  },
});

export default HeroModeSelector;
