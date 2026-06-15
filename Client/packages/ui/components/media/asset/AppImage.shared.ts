export interface BaseAppImageProps {
  /**
   * Optional URI for the image source.
   * On web this maps to the underlying `src`/`source.uri`,
   * on native this maps to `source={{ uri }}`.
   */
  uri?: string;
  /**
   * Accessible description of the image.
   * On web this maps to `alt`, on native it is used as a fallback
   * for `accessibilityLabel` when one is not provided.
   */
  alt?: string;

  /**
   * Optional resize mode for the image.
   * Used by React Native and ignored on web.
   */
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}
