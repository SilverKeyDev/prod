// Property details types for type safety

export type AddressObject = {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

export type PropertyImages = {
  images?: string[];
  photos?: Array<
    | string
    | {
        url?: string;
        mixedSources?: {
          jpeg?: Array<{ url?: string }>;
        };
      }
  >;
};

export type PropertyWithPhotos = PropertyImages & {
  photos?: Array<
    | string
    | {
        url?: string;
        mixedSources?: {
          jpeg?: Array<{ url?: string }>;
        };
      }
  >;
};
