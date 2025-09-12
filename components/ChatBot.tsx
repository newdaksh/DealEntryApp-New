// components/ChatBot.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/AppConstants";
import { ApiService } from "../services/ApiService";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatBotProps {
  isVisible: boolean;
}

const { width } = Dimensions.get("window");

const ChatBot: React.FC<ChatBotProps> = ({ isVisible }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Hello! I'm your Property AI Assistant. I can help you search through your deals, regular transactions, and provide insights about your property business. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation refs
  const chatOpacity = useRef(new Animated.Value(0)).current;
  const messageSlideY = useRef(new Animated.Value(20)).current;
  const inputScaleY = useRef(new Animated.Value(0.8)).current;
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef<FlatList>(null);

  const startShimmerAnimation = React.useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const startPulseAnimation = React.useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(chatOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(inputScaleY, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous animations
      startShimmerAnimation();
      startPulseAnimation();
    }
  }, [
    isVisible,
    chatOpacity,
    inputScaleY,
    startShimmerAnimation,
    startPulseAnimation,
  ]);

  const startTypingAnimation = () => {
    setIsTyping(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopTypingAnimation = () => {
    setIsTyping(false);
    typingAnimation.stopAnimation();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    startTypingAnimation();

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call your n8n workflow API
      const response = await ApiService.fetchTracker(inputText.trim(), null);

      let botText = "I found some information for you:";
      let suggestions: string[] = [];

      if (response && Array.isArray(response) && response.length > 0) {
        // Format the response nicely
        const results = response.slice(0, 5); // Limit to 5 results
        botText = `I found ${response.length} result(s):\n\n`;

        results.forEach((item, index) => {
          if (item.type === "Deal") {
            botText += `📋 Deal ${index + 1}:\n`;
            botText += `• Dealer: ${item.dealer || "N/A"}\n`;
            botText += `• Customer: ${item.customer || "N/A"}\n`;
            botText += `• Amount: ${item.amount || "N/A"}\n`;
            botText += `• Date: ${item.dealDate || "N/A"}\n`;
            botText += `• Status: ${item.status || "N/A"}\n\n`;
          } else if (item.type === "Regular") {
            botText += `💸 Transfer ${index + 1}:\n`;
            botText += `• From: ${item.senderName || "N/A"}\n`;
            botText += `• To: ${item.receiverName || "N/A"}\n`;
            botText += `• Amount: ${item.amountTransferred || "N/A"}\n`;
            botText += `• Date: ${item.dealDate || "N/A"}\n`;
            botText += `• Status: ${item.status || "N/A"}\n\n`;
          }
        });

        if (response.length > 5) {
          botText += `... and ${response.length - 5} more results.`;
        }
      } else {
        botText =
          "🤔 I couldn't find any results matching your query. Try searching for:\n\n• Customer or dealer names\n• Transaction amounts\n• Dates (e.g., '2024-01-15')\n• Status (Done, Pending, Future Task)";

        // Get suggestions
        try {
          suggestions = await ApiService.fetchSuggestions();
          if (suggestions.length > 0) {
            botText += "\n\n💡 Here are some names from your database:";
          }
        } catch (error) {
          console.log("Failed to fetch suggestions:", error);
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
        suggestions: suggestions.slice(0, 6), // Limit suggestions
      };

      stopTypingAnimation();
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      stopTypingAnimation();

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "😔 Sorry, I encountered an error while processing your request. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const renderMessage = ({ item }: { item: Message; index: number }) => {
    return (
      <Animated.View
        style={[
          chatStyles.messageContainer,
          item.isUser
            ? chatStyles.userMessageContainer
            : chatStyles.botMessageContainer,
          {
            opacity: chatOpacity,
            transform: [
              {
                translateY: messageSlideY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {!item.isUser && (
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            style={chatStyles.botAvatar}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color="white" />
          </LinearGradient>
        )}

        <View
          style={[
            chatStyles.messageBubble,
            item.isUser ? chatStyles.userBubble : chatStyles.botBubble,
          ]}
        >
          {item.isUser ? (
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={chatStyles.userBubbleGradient}
            >
              <Text style={chatStyles.userMessageText}>{item.text}</Text>
            </LinearGradient>
          ) : (
            <View style={chatStyles.botBubbleContent}>
              <Text style={chatStyles.botMessageText}>{item.text}</Text>

              {item.suggestions && item.suggestions.length > 0 && (
                <View style={chatStyles.suggestionsContainer}>
                  <Text style={chatStyles.suggestionsLabel}>💡 Try these:</Text>
                  <View style={chatStyles.suggestionsGrid}>
                    {item.suggestions.map((suggestion, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={chatStyles.suggestionChip}
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <Text style={chatStyles.suggestionText}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {item.isUser && (
          <View style={chatStyles.userAvatar}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
        )}

        <Text style={chatStyles.timestamp}>
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <Animated.View
        style={[chatStyles.messageContainer, chatStyles.botMessageContainer]}
      >
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          style={chatStyles.botAvatar}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="white" />
        </LinearGradient>

        <View style={[chatStyles.messageBubble, chatStyles.botBubble]}>
          <View style={chatStyles.typingContainer}>
            <Animated.View
              style={[
                chatStyles.typingDot,
                {
                  opacity: typingAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                chatStyles.typingDot,
                {
                  opacity: typingAnimation.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0.3, 0.3, 1, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                chatStyles.typingDot,
                {
                  opacity: typingAnimation.interpolate({
                    inputRange: [0, 0.4, 0.9, 1],
                    outputRange: [0.3, 0.3, 0.3, 1],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[chatStyles.container, { opacity: chatOpacity }]}>
      {/* Header */}
      <LinearGradient
        colors={["#1E293B", "#334155", "#475569"]}
        style={chatStyles.header}
      >
        <Animated.View
          style={[
            chatStyles.headerContent,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            style={chatStyles.headerIcon}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
          </LinearGradient>
          <View style={chatStyles.headerText}>
            <Text style={chatStyles.headerTitle}>Property AI Assistant</Text>
            <Text style={chatStyles.headerSubtitle}>
              Ask me about your deals & transactions
            </Text>
          </View>
          <View style={chatStyles.statusIndicator}>
            <View style={chatStyles.onlineIndicator} />
          </View>
        </Animated.View>

        {/* Shimmer effect */}
        <Animated.View
          style={[
            chatStyles.shimmer,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
      </LinearGradient>

      {/* Messages */}
      <View style={chatStyles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={chatStyles.messagesList}
          ListFooterComponent={renderTypingIndicator}
        />
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <Animated.View
          style={[
            chatStyles.inputContainer,
            {
              transform: [{ scaleY: inputScaleY }],
            },
          ]}
        >
          <LinearGradient
            colors={["#F8FAFC", "#FFFFFF"]}
            style={chatStyles.inputGradient}
          >
            <View style={chatStyles.inputRow}>
              <TextInput
                style={chatStyles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about deals, transactions, or search by name..."
                placeholderTextColor={colors.textLight}
                multiline
                maxLength={500}
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  chatStyles.sendButton,
                  (!inputText.trim() || isLoading) &&
                    chatStyles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={
                    inputText.trim() && !isLoading
                      ? [colors.primary, colors.primaryLight]
                      : [colors.disabled, colors.disabled]
                  }
                  style={chatStyles.sendButtonGradient}
                >
                  {isLoading ? (
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      }}
                    >
                      <Ionicons name="refresh" size={20} color="white" />
                    </Animated.View>
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const chatStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    zIndex: 2,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold" as const,
    color: "white",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  statusIndicator: {
    alignItems: "center" as const,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  shimmer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  messagesList: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: "flex-end" as const,
  },
  userMessageContainer: {
    alignItems: "flex-end" as const,
  },
  botMessageContainer: {
    alignItems: "flex-start" as const,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    marginHorizontal: 8,
  },
  userBubble: {
    alignSelf: "flex-end" as const,
  },
  botBubble: {
    alignSelf: "flex-start" as const,
  },
  userBubbleGradient: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  botBubbleContent: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userMessageText: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginHorizontal: 8,
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  suggestionsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600" as const,
  },
  suggestionsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.primary + "15",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  suggestionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500" as const,
  },
  typingContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
    marginHorizontal: 2,
  },
  inputContainer: {
    backgroundColor: "transparent",
  },
  inputGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    backgroundColor: "white",
    borderRadius: 25,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: 12,
    paddingVertical: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden" as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
};

export default ChatBot;
