import React, { useCallback, useState } from "react";

import { Dimensions, FlatList, Modal, StyleSheet } from "react-native";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box, Icon, Image, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { getPropertyImages } from "packages/utils/propertyDetails";

const MAIN_IMAGE_HEIGHT = 280;
const THUMB_SIZE = 72;

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

const THUMB_GAP = spacingToNumber(spacing(2));

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  property,
  currentImageIndex,
  onImageChange,
}) => {
  const { t } = useLocalization();
  const propertyImages = getPropertyImages(property);
  const [showFullGallery, setShowFullGallery] = useState(false);

  const nextImage = useCallback(() => {
    onImageChange((currentImageIndex + 1) % propertyImages.length);
  }, [currentImageIndex, onImageChange, propertyImages.length]);

  const prevImage = useCallback(() => {
    onImageChange((currentImageIndex - 1 + propertyImages.length) % propertyImages.length);
  }, [currentImageIndex, onImageChange, propertyImages.length]);

  const goToImage = useCallback(
    (index: number) => {
      onImageChange(index);
    },
    [onImageChange]
  );

  if (propertyImages.length === 0) return null;

  const mainImageUri = propertyImages[currentImageIndex];

  return (
    <Box className="bg-primary-muted">
      {/* Main image */}
      <Box className="relative" style={styles.mainImageWrap}>
        <Image source={{ uri: mainImageUri }} style={styles.mainImage} resizeMode="cover" />
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
              <Icon name="chevron-right" size={24} color={color("neutral.50")} />
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
              style={[styles.thumb, index === currentImageIndex && styles.thumbActive]}
            >
              <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
            </Pressable>
          ))}
          {propertyImages.length > 8 && (
            <Pressable onPress={() => setShowFullGallery(true)} style={styles.seeAllThumb}>
              <Icon name="grid-3x3" size={20} color={color("neutral.700")} />
              <Text className="mt-1 text-xs font-medium text-gray-700" numberOfLines={1}>
                {t("property_details_gallery.see_all_photos", {
                  count: propertyImages.length,
                  defaultValue: `See all ${propertyImages.length} photos`,
                })}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Full-screen gallery modal */}
      <Modal
        visible={showFullGallery}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullGallery(false)}
      >
        <Box className="flex-1 bg-black">
          <FlatList
            data={propertyImages}
            horizontal
            pagingEnabled
            initialScrollIndex={Math.min(currentImageIndex, Math.max(0, propertyImages.length - 1))}
            getItemLayout={(_, index) => ({
              length: Dimensions.get("window").width,
              offset: Dimensions.get("window").width * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width
              );
              if (idx >= 0 && idx < propertyImages.length) {
                onImageChange(idx);
              }
            }}
            renderItem={({ item }) => (
              <Box style={styles.fullScreenItem}>
                <Image source={{ uri: item }} style={styles.fullScreenImage} resizeMode="contain" />
              </Box>
            )}
          />
          <Pressable
            onPress={() => setShowFullGallery(false)}
            style={styles.fullScreenClose}
            label={t("common.close", { defaultValue: "Close" })}
          >
            <Icon name="x" size={24} color={color("neutral.50")} />
          </Pressable>
        </Box>
      </Modal>
    </Box>
  );
};

const styles = StyleSheet.create({
  mainImageWrap: {
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
  fullScreenItem: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
  },
  fullScreenImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
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
