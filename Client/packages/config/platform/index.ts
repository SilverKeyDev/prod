export interface PlatformVariant {
  id: string;
  description: string;
  webPath: string;
  nativePath: string;
  reason: string;
}

export interface PlatformPrimitive {
  id: string;
  kind: "layout" | "button" | "text" | "modal" | "other";
  module: string;
  platformIndependent?: boolean;
}

export type PlatformVariantId = PlatformVariant["id"];
export type PlatformPrimitiveId = PlatformPrimitive["id"];
