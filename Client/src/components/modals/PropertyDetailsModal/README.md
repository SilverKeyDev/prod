# PropertyDetailsModal

This folder contains the modularized PropertyDetailsModal component, broken down
into smaller, more maintainable components.

## Structure

```
PropertyDetailsModal/
├── index.tsx                 # Main modal component
├── types.ts                  # Centralized type definitions
├── utils.ts                  # Utility functions
├── PropertyHeader.tsx        # Header with title, price, and actions
├── PropertyImageGallery.tsx  # Image carousel and thumbnails
├── PropertyBasicInfo.tsx     # Basic property details (bedrooms, bathrooms, etc.)
├── PropertyAnalysis.tsx      # Investment analysis, pros/cons, crime stats
├── PropertyFeatures.tsx      # Property features and AI-detected features
├── PropertyCommute.tsx       # Commute information
├── PropertyAgent.tsx         # Listing agent information
├── PropertySchools.tsx       # Nearby schools
├── PropertyDetailsModal.backup.tsx # Backup of original implementation
└── README.md                 # This file
```

## Components

### PropertyHeader

- Displays property price and address
- Contains action buttons (Save, Generate Report, Close)
- Handles save/unsave functionality

### PropertyImageGallery

- Image carousel with navigation arrows
- Thumbnail navigation
- Fallback images when no property images are available

### PropertyBasicInfo

- Property details (bedrooms, bathrooms, sqft, etc.)
- Year built, lot size, property type
- Price per square foot, parking, days on market
- Estimates (Zestimate, rent estimate)

### PropertyAnalysis

- Investment analysis and ROI explanation
- Neighborhood overview
- Pros and cons
- Crime statistics and gentrification index

### PropertyFeatures

- AI-detected features from images
- Traditional property features
- Organized by category

### PropertyCommute

- Commute time and distance information
- Only displays if commute data is available

### PropertyAgent

- Listing agent information
- Agent photo, name, business
- Contact information

### PropertySchools

- Nearby schools with ratings
- School level, grades, distance
- Limited to 6 schools

## Usage

The component maintains the same API as the original:

```tsx
import PropertyDetailsModal from './PropertyDetailsModal';

<PropertyDetailsModal
  property={property}
  onClose={handleClose}
  isHomeSaved={isHomeSaved}
  saveHome={saveHome}
  removeSavedHome={removeSavedHome}
  onGenerateReport={onGenerateReport}
/>;
```

## Benefits

1. **Modularity**: Each section is now a separate component
2. **Maintainability**: Easier to update individual sections
3. **Reusability**: Components can be reused in other contexts
4. **Type Safety**: Centralized type definitions
5. **Performance**: Smaller bundle sizes for individual components
6. **Testing**: Easier to unit test individual components

## Migration

The original `PropertyDetailsModal.tsx` now simply re-exports the new modular
implementation, ensuring backward compatibility.
