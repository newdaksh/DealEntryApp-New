// components/DealForm.tsx
import { Animated, Text, TextInput } from "react-native";
import { DealFormData, colors } from "../constants/AppConstants";
import { styles } from "../styles/AppStyles";

interface DealFormProps {
  data: DealFormData;
  onUpdateData: (data: Partial<DealFormData>) => void;
  formOpacity: Animated.Value;
  formTranslateY: Animated.Value;
}

export function DealForm({
  data,
  onUpdateData,
  formOpacity,
  formTranslateY,
}: DealFormProps) {
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
      <Text style={styles.sectionTitle}>Deal Entry</Text>

      <Text style={styles.label}>Dealer Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.dealer}
        onChangeText={(text) => onUpdateData({ dealer: text })}
        placeholder="e.g., M/S Sharma Traders"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Customer Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.customer}
        onChangeText={(text) => onUpdateData({ customer: text })}
        placeholder="e.g., Rahul Jain"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border }]}
        value={data.amount}
        onChangeText={(text) =>
          onUpdateData({ amount: text.replace(/[^\d.]/g, "") })
        }
        keyboardType="decimal-pad"
        placeholder="e.g., 25000"
        placeholderTextColor={colors.textSecondary}
      />
    </Animated.View>
  );
}
