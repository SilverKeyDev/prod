/**
 * Platform detection utilities for web
 */

export const Platform = {
  OS: "web" as const,
  select: <T>(options: { web?: T; native?: T; default?: T }): T | undefined => {
    return options.web ?? options.default;
  },
};

export const isWeb = true;
export const isNative = false;
