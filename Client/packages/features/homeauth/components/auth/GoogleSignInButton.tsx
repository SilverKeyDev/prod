import React from "react";

import { getEnv } from "packages/config";
import { color } from "packages/design-tokens";
import AppImage from "packages/ui/components/asset/AppImage";
import {
  GOOGLE_SIGN_IN_ANDROID_SOURCE,
  GOOGLE_SIGN_IN_IOS_SOURCE,
} from "packages/ui/components/asset/logoSource";
import { getWindow, isWeb, Platform } from "packages/utils/platform";
import { Linking } from "packages/utils/platform/linking";

import { BodyText, Button } from "@/components/ui";

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

const googleIconSvg = (
  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill={color("external.google.blue")}
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill={color("external.google.green")}
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill={color("external.google.yellow")}
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill={color("external.google.red")}
    />
  </svg>
);

export default function GoogleSignInButton({
  text = "Continue with Google",
  className = "",
}: GoogleSignInButtonProps) {
  const apiUrl = getEnv().isDevelopment ? "http://localhost:5000" : "https://usesilverkey.com";
  const oauthUrl = `${apiUrl}/api/v1/auth/google/start`;

  const handlePress = () => {
    if (isWeb) {
      const win = getWindow();
      if (win?.location) win.location.href = oauthUrl;
    } else if (typeof Linking !== "undefined" && Linking.openURL) {
      void Linking.openURL(oauthUrl);
    }
  };

  const icon =
    isWeb || !AppImage || !GOOGLE_SIGN_IN_IOS_SOURCE || !GOOGLE_SIGN_IN_ANDROID_SOURCE ? (
      googleIconSvg
    ) : (
      <AppImage
        {...({
          source:
            (Platform as { OS?: string }).OS === "ios"
              ? GOOGLE_SIGN_IN_IOS_SOURCE
              : GOOGLE_SIGN_IN_ANDROID_SOURCE,
          style: { height: 24, width: 24 },
          resizeMode: "contain",
          alt: "Sign in with Google",
          accessibilityRole: "image",
        } as React.ComponentProps<typeof AppImage>)}
      />
    );

  return (
    <Button
      type="button"
      variant="outline"
      icon={icon}
      iconPosition="left"
      onClick={handlePress}
      onPress={handlePress}
      fullWidth
      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
      className={`border-border bg-background-surface text-text-secondary hover:bg-primary-muted active:bg-primary-muted active:opacity-90 ${className}`}
    >
      <BodyText as="span" className="whitespace-nowrap">
        {text}
      </BodyText>
    </Button>
  );
}
