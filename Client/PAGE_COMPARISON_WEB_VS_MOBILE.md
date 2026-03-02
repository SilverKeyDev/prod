# Page Comparison: Web vs Mobile

This document provides a comprehensive comparison of every page/screen implementation in the SilverKey app, comparing web implementations vs mobile implementations, and explains why web files render with proper styling while mobile files may appear unstyled.

## Overview

The SilverKey app follows a **Thin App Architecture** where:

- **Web App** (`apps/web/`) contains thin page wrappers that import feature components
- **Mobile App** (`apps/mobile/`) uses React Navigation with feature screens imported from `packages/features/`
- **Feature components** live in `packages/features/` with separate `.tsx` (web) and `.native.tsx` (mobile) implementations

## Complete Page/Screen Inventory

### Authentication & Onboarding Pages

| Page/Screen            | Web Implementation                                              | Mobile Implementation                                                                 | Status        |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------- |
| **Home/Landing**       | `apps/web/pages/HomeAuth/homepage/HomePage.tsx` → `HomeFeature` | `packages/features/homeauth/components/homepage/HomeScreenNative.native.tsx`          | ✅ Both exist |
| **Login**              | `apps/web/pages/HomeAuth/auth/LoginPage.tsx` → `LoginFeature`   | `packages/features/homeauth/components/login/LoginScreen.native.tsx`                  | ✅ Both exist |
| **Signup**             | `apps/web/pages/HomeAuth/auth/SignupPage.tsx` → `SignupFeature` | `packages/features/homeauth/components/signup/SignupScreen.native.tsx`                | ✅ Both exist |
| **Password Reset**     | `apps/web/pages/HomeAuth/password/ResetPasswordPage.tsx`        | `packages/features/homeauth/components/password/ForgotPasswordScreen.native.tsx`      | ✅ Both exist |
| **Email Verification** | `apps/web/pages/HomeAuth/verification/VerificationPage.tsx`     | `packages/features/homeauth/components/verification/VerificationScreen.native.tsx`    | ✅ Both exist |
| **Onboarding**         | `apps/web/pages/HomeAuth/OnboardingPage.tsx`                    | `packages/features/homeauth/components/onboarding-mobile/OnboardingScreen.native.tsx` | ✅ Both exist |
| **Maintenance**        | `apps/web/pages/HomeAuth/MaintenanceScreenPage.tsx`             | `apps/mobile/app/screens/MaintenanceScreen.native.tsx`                                | ✅ Both exist |

### Legal Pages

| Page/Screen          | Web Implementation                                     | Mobile Implementation                                                         | Status        |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------- |
| **Terms of Service** | `apps/web/pages/HomeAuth/legal/TermsOfServicePage.tsx` | `packages/features/homeauth/components/legal/TermsOfServiceScreen.native.tsx` | ✅ Both exist |
| **Privacy Policy**   | `apps/web/pages/HomeAuth/legal/PrivacyPolicyPage.tsx`  | `packages/features/homeauth/components/legal/PrivacyPolicyScreen.native.tsx`  | ✅ Both exist |
| **Contact Us**       | `apps/web/pages/HomeAuth/legal/ContactUsPage.tsx`      | `packages/features/homeauth/components/legal/ContactUsScreen.native.tsx`      | ✅ Both exist |

### Main App Pages/Screens

| Page/Screen         | Web Implementation                                      | Mobile Implementation                                               | Status        |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- | ------------- |
| **Dashboard**       | `apps/web/pages/DashboardPage.tsx` → `DashboardFeature` | `packages/features/dashboard/components/DashboardScreen.native.tsx` | ✅ Both exist |
| **Search**          | `apps/web/pages/SearchPage.tsx` → `SearchFeature`       | `packages/features/search/components/SearchScreen.native.tsx`       | ✅ Both exist |
| **Saved Homes**     | `apps/web/pages/SavedPage.tsx` → `SavedFeature`         | `packages/features/saved/components/SavedScreen.native.tsx`         | ✅ Both exist |
| **Agent/Messaging** | `apps/web/pages/AgentPage.tsx` → `AgentFeature`         | `packages/features/agent/components/MessagingScreen.native.tsx`     | ✅ Both exist |
| **Profile**         | `apps/web/pages/ProfilePage.tsx` → `ProfileFeature`     | `packages/features/profile/components/ProfileScreen.native.tsx`     | ✅ Both exist |
| **Settings**        | `apps/web/pages/SettingsPage.tsx`                       | ❌ No mobile equivalent                                             | ⚠️ Web only   |

### Development/Test Pages

| Page/Screen            | Web Implementation                      | Mobile Implementation                                  | Status         |
| ---------------------- | --------------------------------------- | ------------------------------------------------------ | -------------- |
| **Button Showcase**    | `apps/web/pages/ButtonShowcasePage.tsx` | ❌ No mobile equivalent                                | ⚠️ Web only    |
| **Placeholder Screen** | ❌ No web equivalent                    | `apps/mobile/app/screens/PlaceholderScreen.native.tsx` | ⚠️ Mobile only |

## Architecture Comparison

### Web Architecture (Traditional SPA)

```typescript
// Web Page (apps/web/pages/DashboardPage.tsx)
import { DashboardFeature } from "packages/features/dashboard/src";

export default function DashboardPage({ setMobileHeaderActions }: DashboardPageProps) {
  return <DashboardFeature setMobileHeaderActions={setMobileHeaderActions} />;
}

// Web Feature (packages/features/dashboard/components/DashboardFeature.tsx)
export function DashboardFeature({ setMobileHeaderActions }: DashboardFeatureProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <UpcomingEvents />
      <Calendar />
      <DashboardChecklists />
      {isAgent && <ClientList onClientClick={handleClientClick} />}
    </div>
  );
}
```

### Mobile Architecture (React Navigation)

```typescript
// Mobile Navigation (apps/mobile/app/navigation/AppStack.native.tsx)
<Tab.Screen
  name="Dashboard"
  component={DashboardScreenNative}
  options={{ title: "Dashboard", tabBarLabel: "Dashboard" }}
/>

// Mobile Screen (packages/features/dashboard/components/DashboardScreen.native.tsx)
export function DashboardScreenNative() {
  return (
    <ScrollView style={styles.container}>
      <Box className="gap-6 px-4 pb-8 pt-4">
        <Text className="text-xl font-semibold text-gray-900">Dashboard</Text>
        <Box className="gap-2">
          <Text className="text-lg font-medium text-gray-800">Upcoming</Text>
          <Text className="text-sm text-gray-600">
            Connect your calendar on web to see upcoming events here.
          </Text>
        </Box>
        {/* More mobile-optimized content */}
      </Box>
    </ScrollView>
  );
}
```

## Why Web Files Render Properly While Mobile May Appear Unstyled

### 1. Different Styling Systems

**Web Styling:**

- Uses **standard Tailwind CSS** with traditional CSS-in-JS
- Styles applied via `className` prop on HTML elements (`div`, `p`, `button`)
- Processed by Vite + PostCSS + Tailwind compiler
- Example:
  ```tsx
  <div className="space-y-6 sm:space-y-8">
    <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
  </div>
  ```

**Mobile Styling:**

- Uses **NativeWind** (Tailwind CSS for React Native)
- Styles applied via `className` prop on React Native components (`View`, `Text`, `ScrollView`)
- Requires NativeWind transformation during Metro bundling
- Example:
  ```tsx
  <View className="gap-6 px-4 pb-8 pt-4">
    <Text className="text-xl font-semibold text-gray-900">Dashboard</Text>
  </View>
  ```

### 2. Configuration Differences

**Web Tailwind Config** (`apps/web/tailwind.config.ts`):

```typescript
export default {
  presets: [sharedTailwindPreset],
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "../../packages/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
};
```

**Mobile Tailwind Config** (`apps/mobile/tailwind.config.js`):

```javascript
module.exports = {
  presets: [
    require("nativewind/preset"), // ← NativeWind preset required
    require("../../packages/config/tailwind/preset.cjs.js"),
  ],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "../../packages/**/*.{js,jsx,ts,tsx}"],
  plugins: [],
};
```

### 3. Component System Differences

**Web Components** use HTML elements directly:

```tsx
// packages/ui/components/primitives/text/Text.web.tsx
const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as: Component = "p", className = "", style, numberOfLines, children, ...props },
  ref
) {
  return (
    <Component className={className} style={style} {...props}>
      {children}
    </Component>
  );
});
```

**Mobile Components** use React Native elements with NativeWind:

```tsx
// packages/ui/components/primitives/text/Text.native.tsx
const Text = forwardRef<RNText, TextProps>(function Text(
  { className, style, numberOfLines, children, ...props },
  ref
) {
  return (
    <RNText ref={ref} className={className} style={style} numberOfLines={numberOfLines} {...props}>
      {children}
    </RNText>
  );
});
```

### 4. Common Styling Issues in Mobile

1. **NativeWind Not Properly Configured**
   - Metro bundler not processing NativeWind transformations
   - Missing NativeWind preset in Tailwind config
   - Content paths not including all necessary files

2. **Class Names Not Supported**
   - Some Tailwind classes don't have React Native equivalents
   - Web-specific classes (e.g., `hover:`, certain layout classes) ignored

3. **Build Process Issues**
   - Metro cache needs clearing after Tailwind config changes
   - NativeWind requires rebuilding to pick up new classes

4. **Platform-Specific Differences**
   - React Native layout system differences (no CSS Grid, different flexbox behavior)
   - Some CSS properties not available in React Native

## File References

### Web Pages

- `Client/apps/web/pages/DashboardPage.tsx`
- `Client/apps/web/pages/SearchPage.tsx`
- `Client/apps/web/pages/SavedPage.tsx`
- `Client/apps/web/pages/AgentPage.tsx`
- `Client/apps/web/pages/ProfilePage.tsx`
- `Client/apps/web/pages/SettingsPage.tsx`
- `Client/apps/web/pages/ButtonShowcasePage.tsx`
- `Client/apps/web/pages/HomeAuth/homepage/HomePage.tsx`
- `Client/apps/web/pages/HomeAuth/auth/LoginPage.tsx`
- `Client/apps/web/pages/HomeAuth/auth/SignupPage.tsx`
- `Client/apps/web/pages/HomeAuth/password/ResetPasswordPage.tsx`
- `Client/apps/web/pages/HomeAuth/verification/VerificationPage.tsx`
- `Client/apps/web/pages/HomeAuth/OnboardingPage.tsx`
- `Client/apps/web/pages/HomeAuth/MaintenanceScreenPage.tsx`
- `Client/apps/web/pages/HomeAuth/legal/TermsOfServicePage.tsx`
- `Client/apps/web/pages/HomeAuth/legal/PrivacyPolicyPage.tsx`
- `Client/apps/web/pages/HomeAuth/legal/ContactUsPage.tsx`

### Mobile Screens

- `Client/packages/features/dashboard/components/DashboardScreen.native.tsx`
- `Client/packages/features/search/components/SearchScreen.native.tsx`
- `Client/packages/features/saved/components/SavedScreen.native.tsx`
- `Client/packages/features/agent/components/MessagingScreen.native.tsx`
- `Client/packages/features/profile/components/ProfileScreen.native.tsx`
- `Client/packages/features/homeauth/components/homepage/HomeScreenNative.native.tsx`
- `Client/packages/features/homeauth/components/login/LoginScreen.native.tsx`
- `Client/packages/features/homeauth/components/signup/SignupScreen.native.tsx`
- `Client/packages/features/homeauth/components/password/ForgotPasswordScreen.native.tsx`
- `Client/packages/features/homeauth/components/verification/VerificationScreen.native.tsx`
- `Client/packages/features/homeauth/components/onboarding-mobile/OnboardingScreen.native.tsx`
- `Client/packages/features/homeauth/components/legal/TermsOfServiceScreen.native.tsx`
- `Client/packages/features/homeauth/components/legal/PrivacyPolicyScreen.native.tsx`
- `Client/packages/features/homeauth/components/legal/ContactUsScreen.native.tsx`
- `Client/apps/mobile/app/screens/MaintenanceScreen.native.tsx`
- `Client/apps/mobile/app/screens/PlaceholderScreen.native.tsx`

### Navigation & Routing

- `Client/apps/mobile/app/navigation/RootNavigator.native.tsx`
- `Client/apps/mobile/app/navigation/AppStack.native.tsx`
- `Client/apps/mobile/app/navigation/AuthStack.native.tsx`
- `Client/apps/mobile/app/AppRoot.native.tsx`

### Configuration Files

- `Client/apps/web/tailwind.config.ts`
- `Client/apps/mobile/tailwind.config.js`
- `Client/packages/config/tailwind/preset.cjs.js`

### UI Component System

- `Client/packages/ui/components/primitives/text/Text.web.tsx`
- `Client/packages/ui/components/primitives/text/Text.native.tsx`
- `Client/packages/ui/components/primitives/box/Box.web.tsx` (likely exists)
- `Client/packages/ui/components/primitives/box/Box.native.tsx` (likely exists)

## Troubleshooting Mobile Styling

If mobile screens appear unstyled:

1. **Check NativeWind Setup:**

   ```bash
   cd Client/apps/mobile
   npx expo install nativewind
   ```

2. **Clear Metro Cache:**

   ```bash
   npx expo start --clear
   ```

3. **Verify Tailwind Config:**
   - Ensure `nativewind/preset` is included
   - Check content paths include all necessary files

4. **Check Platform Extensions:**
   - Mobile components should use `.native.tsx`
   - Web components should use `.tsx` or `.web.tsx`

5. **Verify Component Imports:**
   - Ensure mobile screens import from `packages/ui/components/primitives`
   - Check that primitive components have both `.web.tsx` and `.native.tsx` variants

## Summary

The key difference is that **web uses standard Tailwind CSS** processed by Vite, while **mobile uses NativeWind** processed by Metro bundler. Both systems use the same class names, but the underlying transformation and rendering is completely different. When mobile appears unstyled, it's usually due to NativeWind configuration issues or build process problems, not missing styles in the code.
