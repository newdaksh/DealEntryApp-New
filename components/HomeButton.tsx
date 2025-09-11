// components/HomeButton.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/AppConstants";
import { styles } from "../styles/AppStyles";

interface HomeButtonProps {
  isVisible: boolean;
  onPress: () => void;
  homeButtonPulse: Animated.Value;
}

export function HomeButton({
  isVisible,
  onPress,
  homeButtonPulse,
}: HomeButtonProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.homeFooter} pointerEvents="box-none">
      <LinearGradient
        colors={colors.splashGradient as [string, string, ...string[]]}
        style={styles.homeButtonGradient}
      >
        <TouchableOpacity
          style={styles.homeButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.homeButtonContent,
              { transform: [{ scale: homeButtonPulse }] },
            ]}
          >
            <View style={styles.homeIconContainer}>
              <Ionicons name="home" size={24} color={colors.textWhite} />
              <View style={styles.homeIconGlow} />
            </View>
            <Text style={styles.homeButtonText}>Home</Text>
          </Animated.View>

          {/* Floating sparkles effect */}
          <View style={styles.sparklesContainer}>
            {[...Array(6)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: `${15 + i * 12}%`,
                    top: `${20 + (i % 2) * 40}%`,
                    opacity: homeButtonPulse.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [0.3, 0.8],
                    }),
                    transform: [
                      {
                        scale: homeButtonPulse.interpolate({
                          inputRange: [1, 1.05],
                          outputRange: [0.5, 1],
                        }),
                      },
                      {
                        rotate: homeButtonPulse.interpolate({
                          inputRange: [1, 1.05],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="diamond" size={8} color={colors.accentLight} />
              </Animated.View>
            ))}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
