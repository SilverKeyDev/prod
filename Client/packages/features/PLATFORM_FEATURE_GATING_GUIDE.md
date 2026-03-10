# Platform Feature Gating Prevention Guide

## ❌ Forbidden: Platform-Based Feature Gating

Never gate features or functionality based on platform detection. Use feature flags instead.

### Bad Examples (Platform Feature Gating)

```typescript
// ❌ WRONG: Gating features based on platform
if (Platform.OS === "web") {
  return <AdvancedFeature />;
}
return <BasicFeature />;

// ❌ WRONG: Excluding features on mobile
if (isMobile) {
  return null; // Feature hidden on mobile
}

// ❌ WRONG: Platform-based step filtering
if (options?.platform === "mobile") {
  return steps.filter(step => step.id !== "financial");
}

// ❌ WRONG: Different feature sets per platform
const features = isWeb 
  ? ["feature1", "feature2", "feature3"]
  : ["feature1", "feature2"]; // Missing feature3 on mobile
```

### ✅ Correct: Feature Flag-Based Gating

```typescript
// ✅ CORRECT: Use feature flags
const hasAdvancedFeature = useFeature("advanced_feature_ui");
return hasAdvancedFeature ? <AdvancedFeature /> : <BasicFeature />;

// ✅ CORRECT: Feature availability controlled by flags
const showFinancialStep = useFeature("financial_onboarding_step");
if (!showFinancialStep) {
  return null;
}

// ✅ CORRECT: Platform-aware UI with feature flags
const hasFullInterface = useFeature("agreements_full_interface");
const useWebClicks = useFeature("agreements_web_click_events");

return hasFullInterface ? (
  <Button {...(useWebClicks ? { onClick: fn } : { onPress: fn })}>
    Full Feature
  </Button>
) : (
  <Text>Feature coming soon</Text>
);
```

## ✅ Legitimate Platform Checks

These platform checks are acceptable as they handle platform differences, not feature availability:

### UI Implementation Selection

```typescript
// ✅ CORRECT: Selecting different UI implementations
// eslint-disable-next-line silverkey/no-platform-feature-check -- Platform.OS selects UI implementation, not a feature flag
if (Platform.OS === "web") {
  return <WebUploadModal />;
}
return <NativePickerModal />;
```

### Responsive Design

```typescript
// ✅ CORRECT: Layout adaptation based on screen size
const isMobile = useIsMobile();
if (isMobile) {
  setMobileHeaderActions(<MobileHeader />);
}
```

### Platform-Specific Behavior

```typescript
// ✅ CORRECT: Platform-specific keyboard behavior
// eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}
/>
```

## Detection Patterns to Watch For

When reviewing code, flag these patterns for potential violations:

1. **Early Returns Based on Platform**:
   ```typescript
   if (!isWeb) return null; // 🚨 Potential violation
   if (Platform.OS !== "web") return <LimitedView />; // 🚨 Potential violation
   ```

2. **Platform-Based Feature Lists**:
   ```typescript
   const features = isMobile ? limitedFeatures : fullFeatures; // 🚨 Potential violation
   ```

3. **Step/Flow Filtering**:
   ```typescript
   if (platform === "mobile") {
     return steps.filter(step => step.id !== "advanced"); // 🚨 Potential violation
   }
   ```

## Migration Guide

To convert platform gating to feature flags:

1. **Identify the feature being gated**
2. **Create a feature flag** (e.g., `"financial_onboarding_step"`)
3. **Replace platform check with feature flag**:
   ```typescript
   // Before
   if (options?.platform === "mobile") {
     return steps.filter(step => step.id !== "financial");
   }
   
   // After  
   const showFinancial = useFeature("financial_onboarding_step");
   if (!showFinancial) {
     return steps.filter(step => step.id !== "financial");
   }
   ```
4. **Update tests and documentation**

## ESLint Rule

The `silverkey/no-platform-feature-check` rule catches most violations. When you need a legitimate platform check, add an explanatory disable comment:

```typescript
// eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform
```

## Key Principle

**Platform checks should change HOW features work, not WHETHER they exist.**

- ✅ Different UI implementations for same feature
- ✅ Different interaction patterns (click vs touch)
- ✅ Different layout for different screen sizes
- ❌ Feature available on one platform but not another
- ❌ Different feature sets between platforms
- ❌ Functionality gated by platform detection