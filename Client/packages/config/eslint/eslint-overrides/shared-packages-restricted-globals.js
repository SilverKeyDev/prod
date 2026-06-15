/**
 * Shared packages: ban platform-leaky globals for RN safety.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

const SHARED_PACKAGE_FILES = [
  "packages/config/**/*.{js,jsx,ts,tsx}",
  "packages/contexts/**/*.{js,jsx,ts,tsx}",
  "packages/features/**/*.{js,jsx,ts,tsx}",
  "packages/hooks/**/*.{js,jsx,ts,tsx}",
  "packages/schemas/**/*.{js,jsx,ts,tsx}",
  "packages/services/**/*.{js,jsx,ts,tsx}",
  "packages/store/**/*.{js,jsx,ts,tsx}",
  "packages/ui/**/*.{js,jsx,ts,tsx}",
  "packages/utils/**/*.{js,jsx,ts,tsx}",
];

const WEB_OR_NATIVE_PLATFORM_FILES = [
  "packages/**/*.{web,native}.{js,jsx,ts,tsx}",
  "apps/web/**/*.{web}.{js,jsx,ts,tsx}",
];

export function sharedPackagesRestrictedGlobals() {
  return [
    {
      files: WEB_OR_NATIVE_PLATFORM_FILES,
      rules: {
        "no-restricted-globals": [
          "warn",
          {
            name: "fetch",
            message: "Use apiClient (config/api or services/http) instead of direct fetch.",
          },
          {
            name: "localStorage",
            message:
              "Do not use localStorage in shared packages; it is not available in React Native. Use a platform abstraction or pass storage as a dependency.",
          },
          {
            name: "sessionStorage",
            message:
              "Do not use sessionStorage in shared packages; it is not available in React Native.",
          },
          {
            name: "navigator",
            message:
              "Do not use navigator in shared packages; it is not available in React Native.",
          },
        ],
      },
    },
    {
      files: SHARED_PACKAGE_FILES,
      ignores: WEB_OR_NATIVE_PLATFORM_FILES,
      rules: {
        "no-restricted-globals": [
          "warn",
          {
            name: "fetch",
            message: "Use apiClient (config/api or services/http) instead of direct fetch.",
          },
          {
            name: "localStorage",
            message:
              "Do not use localStorage in shared packages; it is not available in React Native. Use a platform abstraction or pass storage as a dependency.",
          },
          {
            name: "sessionStorage",
            message:
              "Do not use sessionStorage in shared packages; it is not available in React Native.",
          },
          {
            name: "navigator",
            message:
              "Do not use navigator in shared packages; it is not available in React Native.",
          },
          {
            name: "document",
            message: "Do not use document in shared packages; it is not available in React Native.",
          },
          {
            name: "window",
            message: "Do not use window in shared packages; it is not available in React Native.",
          },
          {
            name: "File",
            message: "Do not use global File in shared packages; behavior differs in React Native.",
          },
          {
            name: "Blob",
            message: "Do not use global Blob in shared packages; behavior differs in React Native.",
          },
          {
            name: "IntersectionObserver",
            message:
              "Do not use IntersectionObserver in shared packages; it is not available in React Native.",
          },
        ],
      },
    },
  ];
}
