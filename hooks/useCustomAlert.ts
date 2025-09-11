// hooks/useCustomAlert.ts
import { useState } from "react";

type AlertType = "success" | "warning" | "error" | "info";

interface AlertConfig {
  title: string;
  message: string;
  type?: AlertType;
  icon?: string;
  iconColor?: string;
  buttonText?: string;
  buttonColor?: string;
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setIsVisible(true);
  };

  const hideAlert = () => {
    setIsVisible(false);
    // Clear config after animation completes
    setTimeout(() => setAlertConfig(null), 300);
  };

  // Preset configurations for common scenarios
  const showSuccess = (
    title: string,
    message: string,
    buttonText = "Great!"
  ) => {
    showAlert({ title, message, type: "success", buttonText });
  };

  const showWarning = (
    title: string,
    message: string,
    buttonText = "Got it"
  ) => {
    showAlert({ title, message, type: "warning", buttonText });
  };

  const showError = (
    title: string,
    message: string,
    buttonText = "Try Again"
  ) => {
    showAlert({ title, message, type: "error", buttonText });
  };

  const showInfo = (title: string, message: string, buttonText = "OK") => {
    showAlert({ title, message, type: "info", buttonText });
  };

  return {
    alertConfig,
    isVisible,
    showAlert,
    hideAlert,
    showSuccess,
    showWarning,
    showError,
    showInfo,
  };
};
