import React, { useCallback, useRef, useState } from "react";

import { Dimensions, FlatList, Modal, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import {
  Box,
  Icon,
  Image,
  Pressable,
  ScrollView,
  Text,
} from "packages/ui/components/primitives";
import { getPropertyImages } from "packages/utils/propertyDetails";

const MAIN_IMAGE_HEIGHT = 280;
const THUMB_SIZE = 72;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

const THUMB_GAP = spacingToNumber(spacing(2));

type ZoomableImageProps = {
  uri: string;
};

function ZoomableImage({ uri }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.fullScreenImageContainer, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
}) => {
  const { t } = useLocalization();
  const propertyImages = getPropertyImages(property);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const nextImage = useCallback(() => {
    onImageChange((currentImageIndex + 1) % propertyImages.length);
  }, [currentImageIndex, onImageChange, propertyImages.length]);

  const prevImage = useCallback(() => {
    onImageChange(
      (currentImageIndex - 1 + propertyImages.length) % propertyImages.length,
    );
  }, [currentImageIndex, onImageChange, propertyImages.length]);

  const goToImage = useCallback(
    (index: number) => {
      onImageChange(index);
    },
    [onImageChange],
  );

  const openFullGallery = useCallback(() => {
    setShowFullGallery(true);
  }, []);

  const closeFullGallery = useCallback(() => {
    setShowFullGallery(false);
  }, []);

  if (propertyImages.length === 0) return null;

  const mainImageUri = propertyImages[currentImageIndex];

  return (
    <Box className="bg-primary-muted">
      {/* Main image */}
      <Box className="relative" style={styles.mainImageWrap}>
        <Pressable onPress={openFullGallery} style={styles.mainImagePressable}>
          <Image
            source={{ uri: mainImageUri }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </Pressable>
        {propertyImages.length > 1 && (
          <>
            <Pressable
              onPress={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2"
              style={styles.navButton}
              label={t("common.previous", { defaultValue: "Previous image" })}
            >
              <Icon name="chevron-left" size={24} color={color("neutral.50")} />
            </Pressable>
            <Pressable
              onPress={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2"
              style={styles.navButton}
              label={t("common.next", { defaultValue: "Next image" })}
            >
              <Icon
                name="chevron-right"
                size={24}
                color={color("neutral.50")}
              />
            </Pressable>
          </>
        )}
        <Box
          className="absolute bottom-4 left-1/2 rounded-full bg-black/50 px-3 py-1"
          style={styles.counter}
        >
          <Text className="text-sm text-white">
            {currentImageIndex + 1}
            {t("property_details_gallery.counter_sep", { defaultValue: " / " })}
            {propertyImages.length}
          </Text>
        </Box>
      </Box>

      {/* Thumbnails */}
      {propertyImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbList}
          style={styles.thumbScroll}
        >
          {propertyImages.slice(0, 8).map((uri, index) => (
            <Pressable
              key={index}
              onPress={() => goToImage(index)}
              style={[
                styles.thumb,
                index === currentImageIndex && styles.thumbActive,
              ]}
            >
              <Image
                source={{ uri }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            </Pressable>
          ))}
          {propertyImages.length > 8 && (
            <Pressable onPress={openFullGallery} style={styles.seeAllThumb}>
              <Icon name="grid-3x3" size={20} color={color("neutral.700")} />
              <Text
                className="mt-1 text-xs font-medium text-gray-700"
                numberOfLines={1}
              >
                {t("property_details_gallery.see_all_photos", {
                  count: propertyImages.length,
                  defaultValue: `See all ${propertyImages.length} photos`,
                })}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Full-screen gallery modal with zoom */}
      <Modal
        visible={showFullGallery}
        transparent
        animationType="fade"
        onRequestClose={closeFullGallery}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <Box className="flex-1 bg-black">
            <FlatList
              ref={flatListRef}
              data={propertyImages}
              horizontal
              pagingEnabled
              initialScrollIndex={Math.min(
                currentImageIndex,
                Math.max(0, propertyImages.length - 1),
              )}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                if (idx >= 0 && idx < propertyImages.length) {
                  onImageChange(idx);
                }
              }}
              renderItem={({ item }) => (
                <Box style={styles.fullScreenItem}>
                  <ZoomableImage uri={item} />
                </Box>
              )}
              showsHorizontalScrollIndicator={false}
            />

            {/* Counter in fullscreen */}
            <Box style={styles.fullScreenCounter}>
              <Text className="text-sm font-medium text-white">
                Photo {currentImageIndex + 1}
                {t("property_details_gallery.counter_sep", {
                  defaultValue: " / ",
                })}
                {propertyImages.length}
              </Text>
            </Box>

            {/* Thumbnail strip at bottom */}
            {propertyImages.length > 1 && (
              <Box style={styles.fullScreenThumbnails}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.fullScreenThumbList}
                >
                  {propertyImages.map((uri, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        onImageChange(index);
                        flatListRef.current?.scrollToIndex({
                          index,
                          animated: true,
                        });
                      }}
                      style={[
                        styles.fullScreenThumb,
                        index === currentImageIndex &&
                          styles.fullScreenThumbActive,
                      ]}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.fullScreenThumbImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </Box>
            )}

            {/* Close button */}
            <Pressable
              onPress={closeFullGallery}
              style={styles.fullScreenClose}
              label={t("common.close", { defaultValue: "Close" })}
            >
              <Icon name="x" size={24} color={color("neutral.50")} />
            </Pressable>
          </Box>
        </GestureHandlerRootView>
      </Modal>
    </Box>
  );
};

const styles = StyleSheet.create({
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
