# hls.js (Web → React Native)

## Web

- **Package:** `hls.js` (in `Client/package.json` and `Client/apps/web/package.json`).
- **Role:** HLS (HTTP Live Streaming) playback in the browser via MSE (Media Source Extensions) and `<video>`.
- **Where used:** Feed/reels video playback — e.g. `packages/features/feed/hooks/ui/useHlsVideo.ts` and feed components that render video. Web uses an HTML `<video>` element and attaches Hls.js to it.

## React Native

- **Replacement:** **expo-av** (`expo-av`) or **react-native-video** for HLS playback. Expo’s `Video` component supports HLS URLs on iOS/Android. If not using Expo, `react-native-video` is the common choice.
- **Implementation:**
  - **Where:** Shared feed/video logic that uses Hls.js on web must have a **`.native.tsx`** (or `.native.ts` hook) that uses `expo-av`’s `Video` (or `react-native-video`) with the same HLS source URL. The web implementation stays in `.web.tsx` / hooks that use `hls.js` + `<video>`.
  - **API:** No Hls.js on RN. Use the native player’s API (e.g. `Video` from `expo-av` with `source={{ uri: hlsUrl }}`). Buffering, events, and errors are exposed via the chosen package’s API.
- **Package:** Add `expo-av` to `Client/apps/mobile/package.json` if using Expo; otherwise add `react-native-video`. Do not add `hls.js` to mobile.

## Package (RN)

- **Add to `apps/mobile/package.json`:** `expo-av` (Expo) or `react-native-video`. Not `hls.js`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | hls.js | expo-av or react-native-video |
| Where | Feed hooks/components (.web or shared with .native) | .native.tsx / .native.ts using Video component |
| Playback | MSE + <video> | Native player (HLS URL) |
