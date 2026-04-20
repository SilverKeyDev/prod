import { Dimensions, StyleSheet } from "react-native";

import { color, spacing } from "packages/design-tokens";

import {
  MAIN_IMAGE_HEIGHT,
  spacingToNumber,
  THUMB_GAP,
  THUMB_SIZE,
} from "./propertyImageGalleryNative.constants";

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;

export const propertyImageGalleryNativeStyles = StyleSheet.create({
  mainImageWrap: {
    height: MAIN_IMAGE_HEIGHT,
  },
  mainImagePressable: {
    width: "100%",
    height: MAIN_IMAGE_HEIGHT,
  },
  mainImage: {
    width: "100%",
    height: MAIN_IMAGE_HEIGHT,
  },
  navButton: {
    transform: [{ translateY: -MAIN_IMAGE_HEIGHT / 2 }],
  },
  counter: {
    transform: [{ translateX: -40 }],
  },
  thumbScroll: {
    maxHeight: THUMB_SIZE + spacingToNumber(spacing(4)),
  },
  thumbList: {
    paddingHorizontal: spacingToNumber(spacing(4)),
    paddingVertical: spacingToNumber(spacing(2)),
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginRight: THUMB_GAP,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbActive: {
    borderColor: color("neutral.300"),
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  seeAllThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginRight: THUMB_GAP,
    borderRadius: spacingToNumber(spacing(2)),
    borderWidth: 2,
    borderColor: color("neutral.200"),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color("neutral.100"),
  },
  modalContainer: {
    flex: 1,
  },
  fullScreenItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullScreenCounter: {
    position: "absolute",
    top: spacingToNumber(spacing(12)),
    alignSelf: "center",
    paddingHorizontal: spacingToNumber(spacing(3)),
    paddingVertical: spacingToNumber(spacing(1)),
    borderRadius: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  fullScreenThumbnails: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: spacingToNumber(spacing(2)),
  },
  fullScreenThumbList: {
    paddingHorizontal: spacingToNumber(spacing(2)),
    gap: spacingToNumber(spacing(2)),
  },
  fullScreenThumb: {
    width: 80,
    height: 60,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  fullScreenThumbActive: {
    borderColor: color("neutral.50"),
  },
  fullScreenThumbImage: {
    width: "100%",
    height: "100%",
  },
  fullScreenClose: {
    position: "absolute",
    right: spacingToNumber(spacing(4)),
    top: spacingToNumber(spacing(12)),
    padding: spacingToNumber(spacing(2)),
    borderRadius: 9999,
    backgroundColor: color("neutral.900"),
  },
});
