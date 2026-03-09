/**
 * Shared interface for HomeFeature components across platforms
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HomeFeatureProps {
  // Currently no props needed, but this allows for future extension
}

/**
 * Type definition for platform-specific HomeFeature implementations
 */
export type HomeFeatureComponent = (props: HomeFeatureProps) => JSX.Element;
