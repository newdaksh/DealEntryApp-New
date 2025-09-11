// components/SharedFormFields.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SharedFormData, STATUS_OPTIONS } from "../constants/AppConstants";
import { styles } from "../styles/AppStyles";
import { formatDateDisplay, getStatusColor } from "../utils/AppUtils";

interface SharedFormFieldsProps {
  data: SharedFormData;
  onUpdateData: (data: Partial<SharedFormData>) => void;
  showDatePicker: boolean;
  onToggleDatePicker: (show: boolean) => void;
  formOpacity: Animated.Value;
  formTranslateY: Animated.Value;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
  submitScale: Animated.Value;
  resetScale: Animated.Value;
  onPressInSubmit: () => void;
  onPressOutSubmit: () => void;
  onPressInReset: () => void;
  onPressOutReset: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function SharedFormFields({
  data,
  onUpdateData,
  showDatePicker,
  onToggleDatePicker,
  formOpacity,
  formTranslateY,
  canSubmit,
  onSubmit,
  onReset,
  submitting,
  submitScale,
  resetScale,
  onPressInSubmit,
  onPressOutSubmit,
  onPressInReset,
  onPressOutReset,
}: SharedFormFieldsProps) {
  return (
    <Animated.View
      style={{
        width: "100%",
        opacity: formOpacity,
        transform: [{ translateY: formTranslateY }],
      }}
    >
      <Text style={styles.label}>Deal Date</Text>
      <TouchableOpacity
        style={[styles.input, styles.datePickerButton]}
        onPress={() => onToggleDatePicker(true)}
      >
        <Text style={styles.dateText}>{formatDateDisplay(data.dealDate)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={data.dealDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event: any, selectedDate?: Date) => {
            onToggleDatePicker(Platform.OS === "ios");
            if (selectedDate) onUpdateData({ dealDate: selectedDate });
          }}
        />
      )}

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onUpdateData({ status: opt })}
            style={[
              styles.chip,
              data.status === opt && [
                styles.chipActive,
                {
                  backgroundColor: getStatusColor(opt),
                  borderColor: getStatusColor(opt),
                },
              ],
            ]}
          >
            <Text
              style={[
                styles.chipText,
                data.status === opt && styles.chipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerRow}>
        <AnimatedTouchable
          style={[
            styles.btn,
            styles.btnSecondary,
            { transform: [{ scale: resetScale }] },
          ]}
          onPressIn={onPressInReset}
          onPressOut={onPressOutReset}
          onPress={onReset}
          disabled={submitting}
        >
          <Text style={styles.btnTextSecondary}>Reset</Text>
        </AnimatedTouchable>

        <AnimatedTouchable
          style={[
            styles.btn,
            canSubmit ? styles.btnPrimary : styles.btnDisabled,
            { transform: [{ scale: submitScale }] },
          ]}
          onPressIn={onPressInSubmit}
          onPressOut={onPressOutSubmit}
          onPress={onSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.btnTextPrimary}>Submit</Text>
          )}
        </AnimatedTouchable>
      </View>
    </Animated.View>
  );
}
