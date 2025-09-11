// components/RegularForm.tsx
import { Animated, Text, TextInput } from "react-native";
import { RegularFormData, colors } from "../constants/AppConstants";
import { styles } from "../styles/AppStyles";

interface RegularFormProps {
  data: RegularFormData;
  onUpdateData: (data: Partial<RegularFormData>) => void;
  formOpacity: Animated.Value;
  formTranslateY: Animated.Value;
}

export function RegularForm({
  data,
  onUpdateData,
  formOpacity,
  formTranslateY,
}: RegularFormProps) {
  return (
    <Animated.View
      style={[
        styles.form,
        {
          opacity: formOpacity,
          transform: [{ translateY: formTranslateY }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Regular Entry</Text>

      <Text style={styles.label}>Sender Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.senderName}
        onChangeText={(text) => onUpdateData({ senderName: text })}
        placeholder="e.g., Rohan Verma"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Receiver Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.receiverName}
        onChangeText={(text) => onUpdateData({ receiverName: text })}
        placeholder="e.g., Aman Singh"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Amount Transferred</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.amountTransferred}
        onChangeText={(text) =>
          onUpdateData({ amountTransferred: text.replace(/[^\d.]/g, "") })
        }
        keyboardType="decimal-pad"
        placeholder="e.g., 1500"
        placeholderTextColor={colors.textSecondary}
      />
    </Animated.View>
  );
}
