/**
 * Shim for react-native imports in web builds
 * Provides empty exports to prevent build errors when RN code is accidentally imported
 */
export default {};
export const Platform = { OS: "web", select: (obj) => obj.web || obj.default };
export const StyleSheet = { create: (styles) => styles };
export const View = "div";
export const Text = "span";
export const Image = "img";
export const ScrollView = "div";
export const TouchableOpacity = "button";
export const Dimensions = {
  get: () => ({ width: window.innerWidth, height: window.innerHeight }),
};
export const NativeModules = {};
export const NativeEventEmitter = class {};
export const AppRegistry = { registerComponent: () => {} };
export const Animated = {};
export const Easing = {};
export const Alert = { alert: () => {} };
export const Linking = { openURL: () => Promise.resolve() };
export const PixelRatio = { get: () => 1 };
export const StatusBar = {};
export const Vibration = { vibrate: () => {} };
