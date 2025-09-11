// // components/HeroSection.tsx
// import { LinearGradient } from "expo-linear-gradient";
// import { Animated, ImageBackground, Text, View } from "react-native";
// import { colors } from "../constants/AppConstants";
// import { styles } from "../styles/AppStyles";

// interface HeroSectionProps {
//   isVisible: boolean;
//   formOpacity: Animated.Value;
// }

// export function HeroSection({ isVisible, formOpacity }: HeroSectionProps) {
//   if (!isVisible) return null;

//   return (
//     <ImageBackground
//       source={{
//         uri: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80",
//       }}
//       style={styles.heroBackground}
//       imageStyle={styles.heroImage}
//     >
//       <LinearGradient colors={colors.heroGradient} style={styles.heroGradient}>
//         <View style={styles.heroContent}>
//           <Animated.View
//             style={[styles.heroTextContainer, { opacity: formOpacity }]}
//           >
//             <Text style={styles.heroTitle}>पार्श्वनाथ Properties</Text>
//             <Text style={styles.heroSubtitle}>
//               Premium Real Estate Solutions
//             </Text>
//             <View style={styles.heroDivider} />
//             <Text style={styles.heroDescription}>
//               Professional property management and deal tracking platform
//             </Text>
//           </Animated.View>
//         </View>
//       </LinearGradient>
//     </ImageBackground>
//   );
// }
