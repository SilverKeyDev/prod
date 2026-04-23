import React, { useCallback, useRef, useState } from "react";

import { FlatList, Modal } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { PropertyImageGalleryProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box, Icon, Image, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { getPropertyImages } from "packages/utils/propertyDetails";

import {
  propertyImageGalleryNativeStyles as styles,
  SCREEN_WIDTH,
} from "./PropertyImageGallery.native.styles";
import { PropertyImageGalleryZoomableImage } from "./PropertyImageGalleryZoomableImage.native";

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
    onImageChange((currentImageIndex - 1 + propertyImages.length) % propertyImages.length);
  }, [currentImageIndex, onImageChange, propertyImages.length]);

  const goToImage = useCallback(
    (index: number) => {
      onImageChange(index);
    },
    [onImageChange]
  );

  const openFullGallery = useCallback(() => {
    setShowFullGallery(true);
  }, []);

  const closeFullGallery = useCallback(() => {
    setShowFullGallery(false);
  }, []);

  if (propertyImages.length === 0) return null;

  const mainImageUri = propertyImages[currentImageIndex];
  const navIconColor = color("background-surface");

  return (
    <Box className="bg-primary-muted">
      <Box className="relative" style={styles.mainImageWrap}>
        <Pressable onPress={openFullGallery} style={styles.mainImagePressable}>
          <Image source={{ uri: mainImageUri }} style={styles.mainImage} resizeMode="cover" />
        </Pressable>
        {propertyImages.length > 1 && (
          <>
            <Pressable
              onPress={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-transparent p-2"
              style={styles.navButton}
              label={t("common.previous", { defaultValue: "Previous image" })}
            >
              {({ pressed }) => (
                <Icon
                  name="chevron-left"
                  size={24}
                  color={navIconColor}
                  strokeWidth={pressed ? 3 : 2}
                />
              )}
            </Pressable>
            <Pressable
              onPress={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-transparent p-2"
              style={styles.navButton}
              label={t("common.next", { defaultValue: "Next image" })}
            >
              {({ pressed }) => (
                <Icon
                  name="chevron-right"
                  size={24}
                  color={navIconColor}
                  strokeWidth={pressed ? 3 : 2}
                />
              )}
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
            <Pressable onPress={openFullGallery} style={styles.seeAllThumb}>
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
                Math.max(0, propertyImages.length - 1)
              )}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                if (idx >= 0 && idx < propertyImages.length) {
                  onImageChange(idx);
                }
              }}
              renderItem={({ item }) => (
                <Box style={styles.fullScreenItem}>
                  <PropertyImageGalleryZoomableImage uri={item} />
                </Box>
              )}
              showsHorizontalScrollIndicator={false}
            />

            <Box style={styles.fullScreenCounter}>
              <Text className="text-sm font-medium text-white">
                Photo {currentImageIndex + 1}
                {t("property_details_gallery.counter_sep", {
                  defaultValue: " / ",
                })}
                {propertyImages.length}
              </Text>
            </Box>

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
                        index === currentImageIndex && styles.fullScreenThumbActive,
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
