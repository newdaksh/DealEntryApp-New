// components/SplashAnimation.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/AppConstants";

interface SplashAnimationProps {
  onComplete: () => void;
}

const { width, height } = Dimensions.get("window");

const SplashAnimation: React.FC<SplashAnimationProps> = ({ onComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleSlideY = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlideY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  // Create multiple particle animations
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(height),
      translateX: new Animated.Value(Math.random() * width),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Create floating elements
  const floatingElements = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const startAnimation = () => {
      // Background fade in
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Logo entrance animation sequence
      Animated.sequence([
        // Initial delay
        Animated.delay(300),

        // Logo scale and rotate entrance
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),

        // Title slide in
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(titleSlideY, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),

        // Subtitle slide in
        Animated.delay(150),
        Animated.parallel([
          Animated.spring(subtitleSlideY, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),

        // Particles entrance
        Animated.delay(100),
        Animated.timing(particlesOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        // Hold for a moment
        Animated.delay(1000),

        // Exit animation
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete();
      });

      // Continuous animations
      // Logo pulse
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Shimmer effect
      const shimmer = Animated.loop(
        Animated.timing(shimmerX, {
          toValue: width,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      shimmer.start();

      // Floating particles
      particles.forEach((particle, index) => {
        const randomDelay = Math.random() * 2000;
        const randomDuration = 3000 + Math.random() * 2000;

        Animated.loop(
          Animated.sequence([
            Animated.delay(randomDelay),
            Animated.parallel([
              Animated.timing(particle.translateY, {
                toValue: -height - 100,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(particle.scale, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.opacity, {
                  toValue: 0.8,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.delay(randomDuration - 1500),
                Animated.timing(particle.opacity, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.timing(particle.translateY, {
              toValue: height,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Floating elements
      floatingElements.forEach((element, index) => {
        const randomDelay = index * 200;

        Animated.loop(
          Animated.sequence([
            Animated.delay(randomDelay),
            Animated.parallel([
              Animated.timing(element.translateY, {
                toValue: -10,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
              Animated.timing(element.rotate, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(element.translateY, {
                toValue: 10,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
              }),
              Animated.timing(element.rotate, {
                toValue: 0,
                duration: 4000,
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      });
    };

    startAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: backgroundOpacity,
        },
      ]}
    >
      <StatusBar hidden />

      {/* Animated Background */}
      <LinearGradient
        colors={["#0a0e13", "#1a1f26", "#2a3441", "#1a1f26", "#0a0e13"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Shimmer Effect */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerX }],
          },
        ]}
      />

      {/* Floating Background Elements */}
      {floatingElements.map((element, index) => (
        <Animated.View
          key={`floating-${index}`}
          style={[
            styles.floatingElement,
            {
              left: (index % 4) * (width / 4) + 20,
              top: 100 + Math.floor(index / 4) * 200,
              transform: [
                { translateY: element.translateY },
                {
                  rotate: element.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
                { scale: element.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Animated Particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              left: Math.random() * width,
              opacity: Animated.multiply(particlesOpacity, particle.opacity),
              transform: [
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}

      <View style={styles.content}>
        {/* Main Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseScale) },
                {
                  rotate: logoRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent, colors.primaryLight]}
            style={styles.logoBackground}
          >
            <Ionicons name="business" size={80} color={colors.textWhite} />
          </LinearGradient>

          {/* Logo Glow Effect */}
          <Animated.View style={[styles.logoGlow, { opacity: logoOpacity }]} />
        </Animated.View>

        {/* App Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleSlideY }],
            },
          ]}
        >
          <Text style={styles.title}>पार्श्वनाथ Properties 🏠</Text>
          <Text style={styles.titleAccent}>Your Trusted Partner 🔑</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleSlideY }],
            },
          ]}
        >
          <Text style={styles.subtitle}>
            Professional Real Estate Management
          </Text>
          <View style={styles.divider} />
          <Text style={styles.version}>Version 2.0</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: subtitleOpacity,
            },
          ]}
        >
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity: logoOpacity,
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0e13",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    width: width * 0.3,
    height: height,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "-20deg" }],
  },
  floatingElement: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent + "20",
    opacity: 0.6,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
  },
  content: {
    alignItems: "center",
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    opacity: 0.3,
    zIndex: -1,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.textWhite,
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleAccent: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.accent,
    textAlign: "center",
    letterSpacing: 4,
    marginTop: 5,
  },
  subtitleContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textWhite,
    textAlign: "center",
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 15,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
    marginBottom: 10,
  },
  version: {
    fontSize: 12,
    color: colors.textLight,
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});

export default SplashAnimation;
