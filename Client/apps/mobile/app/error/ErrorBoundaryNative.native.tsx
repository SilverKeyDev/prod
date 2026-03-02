/**
 * Error Boundary for React Native. Renders RN fallback (View, Text, TouchableOpacity).
 * "Go Home" invokes onGoHome callback (e.g. navigation.reset to root).
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { log, LOG_CATEGORIES } from "packages/logger";
import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import { normalizeError } from "packages/utils/errorHandling";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onGoHome?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundaryNative extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    log.error(LOG_CATEGORIES.ERRORS, "ErrorBoundaryNative caught error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    reportErrorWithCapture(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.props.onGoHome?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const normalized = normalizeError(this.state.error);
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>We're sorry, but something unexpected happened.</Text>
            {normalized.message ? (
              <Text style={styles.detail} numberOfLines={3}>
                {normalized.message}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.outlineButton]}
                onPress={this.handleGoHome}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    const children = this.props?.children;
    if (children == null) {
      return <View style={StyleSheet.absoluteFill} collapsable={false} />;
    }
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f0",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#8C6F5A",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  detail: {
    fontSize: 12,
    color: "#888",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#A3B18A",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#A3B18A",
  },
  outlineButtonText: {
    color: "#A3B18A",
    fontSize: 14,
    fontWeight: "600",
  },
});
