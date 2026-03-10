/**
 * Platform detection utilities - defaults to web for shared components
 * Platform-specific versions will override this via Vite/Metro resolution
 */

export const Platform = {
  OS: "web" as const,
  select: <T>(options: { web?: T; native?: T; default?: T }): T | undefined => {
    return options.web ?? options.default;
  },
};

export const isWeb = true;
export const isNative = false;
