// // components/ModeSelector.tsx
// import { Ionicons } from "@expo/vector-icons";
// import { Text, TouchableOpacity, View } from "react-native";
// import { Mode, colors } from "../constants/AppConstants";
// import { styles } from "../styles/AppStyles";

// interface ModeSelectorProps {
//   mode: Mode | null;
//   onSelectMode: (selectedMode: Mode) => void;
// }

// export function ModeSelector({ mode, onSelectMode }: ModeSelectorProps) {
//   return (
//     <View style={styles.modeSection}>
//       <Text style={styles.sectionHeader}>Select Service</Text>
//       <View style={styles.modeRow}>
//         <TouchableOpacity
//           style={[styles.modeBtn, mode === "regular" && styles.modeBtnActive]}
//           onPress={() => onSelectMode("regular")}
//         >
//           <Ionicons
//             name="document-text-outline"
//             size={24}
//             color={mode === "regular" ? colors.textWhite : colors.primary}
//             style={{ marginBottom: 8 }}
//           />
//           <Text
//             style={[
//               styles.modeText,
//               mode === "regular" && styles.modeTextActive,
//             ]}
//           >
//             Regular Entry
//           </Text>
//           <Text
//             style={[
//               styles.modeDescription,
//               mode === "regular" && styles.modeDescriptionActive,
//             ]}
//           >
//             Money Transfer
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.modeBtn, mode === "deal" && styles.modeBtnActive]}
//           onPress={() => onSelectMode("deal")}
//         >
//           <Ionicons
//             name="business-outline"
//             size={24}
//             color={mode === "deal" ? colors.textWhite : colors.primary}
//             style={{ marginBottom: 8 }}
//           />
//           <Text
//             style={[styles.modeText, mode === "deal" && styles.modeTextActive]}
//           >
//             Deal Entry
//           </Text>
//           <Text
//             style={[
//               styles.modeDescription,
//               mode === "deal" && styles.modeDescriptionActive,
//             ]}
//           >
//             Property Deals
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.modeBtn, mode === "tracker" && styles.modeBtnActive]}
//           onPress={() => onSelectMode("tracker")}
//         >
//           <Ionicons
//             name="search-outline"
//             size={24}
//             color={mode === "tracker" ? colors.textWhite : colors.primary}
//             style={{ marginBottom: 8 }}
//           />
//           <Text
//             style={[
//               styles.modeText,
//               mode === "tracker" && styles.modeTextActive,
//             ]}
//           >
//             Tracker
//           </Text>
//           <Text
//             style={[
//               styles.modeDescription,
//               mode === "tracker" && styles.modeDescriptionActive,
//             ]}
//           >
//             Search Records
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }
