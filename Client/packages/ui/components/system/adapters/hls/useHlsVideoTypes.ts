export type UseHlsVideoParams = {
  /** Web: HTMLVideoElement; native: unused (expo-av / react-native-video use source URI). */
  videoRef: React.RefObject<unknown>;
  url: string | undefined;
  isActive: boolean;
  isNext: boolean;
  enabled: boolean;
  onAttached?: () => void;
  onError?: () => void;
  onBuffering?: (buffering: boolean) => void;
};
