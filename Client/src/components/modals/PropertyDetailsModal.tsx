import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, MapPin, GraduationCap, Shield, ExternalLink, Star, Home, User, Phone } from 'lucide-react';
import HeartSave from '../ui/HeartSave';

// Import SearchResult interface from SearchPage
interface SearchResult {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
  
  // Enhanced property details from searchAddress API
  zpid?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  yearBuilt?: number;
  livingArea?: string;
  livingAreaValue?: number;
  pricePerSquareFoot?: number;
  propertyTypeDimension?: string;
  homeType?: string;
  homeStatus?: string;
  timeOnZillow?: string;
  daysOnZillow?: number;
  onMarketDate?: number;
  
  // Financial information
  zestimate?: number;
  taxAnnualAmount?: number;
  propertyTaxRate?: number;
  hoaFee?: string;
  associationFee?: string;
  monthlyHoaFee?: number;
  annualHomeownersInsurance?: number;
  rentZestimate?: number;
  
  // Property features
  architecturalStyle?: string;
  structureType?: string;
  propertyCondition?: string;
  isNewConstruction?: boolean;
  hasGarage?: boolean;
  hasAttachedGarage?: boolean;
  garageSpaces?: number;
  parking?: number;
  hasView?: boolean;
  waterView?: string;
  hasFireplace?: boolean;
  hasCooling?: boolean;
  hasHeating?: boolean;
  hasAssociation?: boolean;
  
  // Detailed features
  view?: string[];
  flooring?: string[];
  heating?: string[];
  cooling?: string[];
  appliances?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: any;
  lotFeatures?: string[];
  communityFeatures?: string[];
  parkingFeatures?: string[];
  utilities?: string[];
  inclusions?: string[];
  
  // Room information
  rooms?: any[];
  bathroomsFull?: number;
  bathroomsHalf?: number;
  bathroomsPartial?: number;
  bathroomsThreeQuarter?: number;
  mainLevelBedrooms?: number;
  mainLevelBathrooms?: number;
  
  // Building details
  stories?: string;
  roofType?: string;
  foundationDetails?: string[];
  constructionMaterials?: string[];
  windowFeatures?: string[];
  
  // Location details
  subdivision?: string;
  subdivisionName?: string;
  county?: string;
  cityId?: number;
  parcelNumber?: string;
  
  // Agent information
  contact_recipients?: any[];
  listed_by?: {
    agent_reason?: number;
    zpro?: boolean;
    recent_sales?: number;
    review_count?: number;
    display_name?: string;
    badge_type?: string;
    business_name?: string;
    rating_average?: number;
    phone?: {
      prefix?: string;
      areacode?: string;
      number?: string;
    };
    zuid?: string;
    image_url?: string;
  };
  
  // Schools
  schools?: Array<{
    name?: string;
    rating?: number;
    level?: string;
    grades?: string;
    type?: string;
    distance?: number;
    isAssigned?: boolean;
    studentsPerTeacher?: number;
    size?: number;
    link?: string;
  }>;
  
  // Price history
  priceHistory?: Array<{
    date?: string;
    price?: number;
    event?: string;
    priceChangeRate?: number;
    source?: string;
    pricePerSquareFoot?: number;
  }>;
  
  // Nearby homes
  nearbyHomes?: any[];
  
  // At a glance facts
  atAGlanceFacts?: Array<{
    factLabel?: string;
    factValue?: string;
  }>;
  
  // Additional details
  description?: string;
  url?: string;
  mlsid?: string;
  pageViewCount?: number;
  favoriteCount?: number;
  virtualTour?: string;
  buildingName?: string;
  
  // Mortgage rates
  mortgageRates?: {
    thirtyYearFixedRate?: number;
    fifteenYearFixedRate?: number;
    arm5Rate?: number;
  };
  
  // Legacy support
  images?: string[];
  
  // Zillow photos array
  photos?: Array<{
    url?: string;
    mixedSources?: {
      jpeg?: Array<{
        url: string;
        width?: number;
        height?: number;
      }>;
    };
  }> | string[];
  
  // Commute data from enhanced property API
  commute_data?: {
    travel_times: Array<{
      location_name: string;
      location_address: string;
      travel_time: string;
      commute_tolerance?: number;
      name?: string; // Alias for location_name
      address?: string; // Alias for location_address
    }>;
    map_url: string;
    property_address: string;
    error?: string;
  };
  
  // Zillow URL from enhanced property API
  zillow_url?: string;
  
  // Property features from enhanced property API
  features?: Record<string, string[]>;
  
  // AI-extracted features from property images
  image_features?: {
    raw: string[];
    clean: string[];
    error?: string;
  };
  
  // Property analysis from Perplexity Sonar Pro
  property_analysis?: {
    pros: string[];
    cons: string[];
    crime_stats: {
      overall_safety_score: string;
      crime_rate: string;
      recent_trends: string;
      specific_concerns: string[];
      data_source: string;
    };
    gentrification_index: {
      score: string;
      trend: string;
      indicators: string[];
      timeline: string;
      impact_on_property_value: string;
    };
    roi_explanation: string;
    error?: string;
  };
}

interface PropertyDetailsModalProps {
  property: SearchResult | null;
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: SearchResult) => void;
  removeSavedHome: (id: string) => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ property, onClose, isHomeSaved, saveHome, removeSavedHome }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

  // Handle navigation to generate report page with pre-filled address
  const handleGenerateFullReport = () => {
    if (property) {
      // Get the property address in the best format available
      const propertyAddress = formatAddress(property.address);
      
      // Save the address to localStorage for the GenerateReportPage
      const generateReportState = {
        address: propertyAddress,
        comparisonAddress: '',
        reportType: 'detailed',
        selectedClientId: ''
      };
      
      localStorage.setItem('generateReportState', JSON.stringify(generateReportState));
      
      // Navigate to the generate report page
      navigate('/dashboard/generate-report');
    }
  };
  
  if (!property) return null;

  // Helper function to format address - handle both string and object formats
  const formatAddress = (address: any): string => {
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object' && address !== null) {
      // Handle address object with components
      const parts = [];
      if (address.streetAddress) parts.push(address.streetAddress);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipcode) parts.push(address.zipcode);
      
      return parts.join(', ') || 'Address not available';
    }
    
    return 'Address not available';
  };

  // Helper function to format price
  const formatPrice = (price: any): string => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    if (typeof price === 'string') {
      // Remove any existing $ and format as number if possible
      const numericPrice = price.replace(/[^0-9]/g, '');
      if (numericPrice && !isNaN(Number(numericPrice))) {
        return `$${Number(numericPrice).toLocaleString()}`;
      }
      return price.startsWith('$') ? price : `$${price}`;
    }
    return 'Price not available';
  };

  // Helper function to format property type
  const formatPropertyType = (type: string): string => {
    if (!type) return 'N/A';
    
    // Convert SINGLE_FAMILY to Single Family, etc.
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Handle property images - prioritize extracted images from API, then Zillow static images, fallback to default
  const getPropertyImages = () => {
    // First priority: extracted images from API response
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images;
    }
    
    // Second priority: Check for Zillow static images
    if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
      return property.photos.map((photo: any) => {
        if (typeof photo === 'string') return photo;
        if (photo && photo.url) return photo.url;
        if (photo && photo.mixedSources && photo.mixedSources.jpeg && photo.mixedSources.jpeg.length > 0) {
          // Get the highest quality image
          const jpegSources = photo.mixedSources.jpeg;
          return jpegSources[jpegSources.length - 1].url;
        }
        return null;
      }).filter(Boolean);
    }
    
    // Default fallback images
    return [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ];
  };

  const propertyImages = getPropertyImages();

  const handleGoToZillow = () => {
    try {
      // Use dynamic Zillow URL from API response if available
      if (property.zillow_url) {
        window.open(property.zillow_url, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Fallback: construct URL from property data
      if (property.zpid) {
        const zillowUrl = `https://www.zillow.com/homedetails/${property.zpid}_zpid/`;
        window.open(zillowUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Last resort: search by address
      const fallbackUrl = `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error('Error opening Zillow link:', error);
      // Ultimate fallback to general Zillow search
      const fallbackUrl = `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const thumbnailsPerView = 4;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const nextThumbnails = () => {
    if (thumbnailStartIndex + thumbnailsPerView < propertyImages.length) {
      setThumbnailStartIndex(prev => prev + 1);
    }
  };

  const prevThumbnails = () => {
    if (thumbnailStartIndex > 0) {
      setThumbnailStartIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center space-responsive-sm z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-brown/30 hover:scrollbar-thumb-brown/50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 space-responsive-md rounded-t-lg">
          <div className="flex items-start justify-between gap-responsive-sm">
            <div className="flex items-center gap-responsive-sm flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-responsive-lg font-bold text-brown truncate">Property Details</h2>
                <p className="text-responsive-xs text-gray-600 mt-1 truncate">{formatAddress(property.address)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-responsive-xs flex-shrink-0">
              {/* Compact Action Buttons */}
              <button 
                onClick={handleGenerateFullReport}
                className="bg-olive-light text-white py-responsive-xs px-responsive-sm rounded text-responsive-xs font-medium hover:bg-olive-light/80 transition-colors touch-manipulation hidden sm:block h-7 sm:h-8 whitespace-nowrap"
              >
                Generate Full Report
              </button>
              <button 
                onClick={handleGenerateFullReport}
                className="bg-olive-light text-white space-responsive-sm rounded text-responsive-xs font-medium hover:bg-olive-light/80 transition-colors touch-manipulation sm:hidden"
                title="Generate Full Report"
              >
                <Home className="mobile-icon-sm" />
              </button>
              
              <button 
                onClick={handleGoToZillow}
                className="border border-blue-600 text-blue-600 py-responsive-xs px-responsive-sm rounded text-responsive-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-responsive-xs touch-manipulation h-7 sm:h-8 whitespace-nowrap"
                title="View on Zillow"
              >
                <ExternalLink className="mobile-icon-xs" />
                <span className="hidden sm:inline">Zillow</span>
              </button>
              
              <HeartSave
                property={property}
                isSaved={isHomeSaved(property.id)}
                onSave={saveHome}
                onRemove={removeSavedHome}
                size="md"
                ariaLabel={isHomeSaved(property.id) ? "Remove from saved" : "Save property"}
              />
              
              <button
                onClick={onClose}
                className="space-responsive-sm hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <svg
                  className="mobile-icon-sm text-gray-500 hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="space-responsive-lg">
          {/* Property Image Carousel and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-responsive-lg mb-4 sm:mb-6 md:mb-8">
            <div>
              {/* Main Image Carousel */}
              <div className="relative">
                <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 rounded-lg overflow-hidden">
                  <img 
                    src={propertyImages[currentImageIndex]} 
                    alt={`Property view ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-1 sm:left-2 md:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full space-responsive-sm shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
                    aria-label="Previous image"
                  >
                    <svg className="mobile-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-1 sm:right-2 md:right-3 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full space-responsive-sm shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
                    aria-label="Next image"
                  >
                    <svg className="mobile-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {propertyImages.length}
                  </div>
                </div>
                
                {/* Thumbnail Carousel Navigation */}
                <div className="relative mt-3">
                  <div className="flex items-center gap-2">
                    {/* Previous Thumbnails Button */}
                    <button
                      onClick={prevThumbnails}
                      className="flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-brown shadow-sm transition-all duration-200"
                      aria-label="Previous thumbnails"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Thumbnail Grid */}
                    <div className="flex gap-2 flex-1 overflow-hidden">
                      {propertyImages
                        .slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerView)
                        .map((image: string, relativeIndex: number) => {
                          const actualIndex = thumbnailStartIndex + relativeIndex;
                          return (
                            <button
                              key={actualIndex}
                              onClick={() => goToImage(actualIndex)}
                              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                                actualIndex === currentImageIndex 
                                  ? 'border-brown shadow-md' 
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img 
                                src={image} 
                                alt={`Thumbnail ${actualIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                    </div>
                    
                    {/* Next Thumbnails Button */}
                    <button
                      onClick={nextThumbnails}
                      className="flex-shrink-0 p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-brown shadow-sm transition-all duration-200"
                      aria-label="Next thumbnails"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brown mb-4">
                {formatPrice(property.price)}
              </div>
              <div className={`grid gap-4 mb-6 ${property.sqft && property.sqft > 0 ? 'grid-cols-3' : 'grid-cols-2 justify-center'}`}>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {property.bedrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {property.bathrooms}
                  </div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                {property.sqft && property.sqft > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {Math.round(property.sqft).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Sq Ft</div>
                  </div>
                )}
              </div>
              
              {/* Additional Property Stats */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Year Built:</span>
                  <span className="font-medium">{property.yearBuilt || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lot Size:</span>
                  <span className="font-medium">{property.lotSize || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">{formatPropertyType(property.homeType || property.propertyType || '')}</span>
                </div>
                {property.pricePerSquareFoot && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Sq Ft:</span>
                    <span className="font-medium">${property.pricePerSquareFoot}</span>
                  </div>
                )}
                {(property.garageSpaces || property.parking) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parking:</span>
                    <span className="font-medium">
                      {property.garageSpaces ? `${property.garageSpaces}-car garage` : 
                       property.parking ? `${property.parking} spaces` : 'N/A'}
                    </span>
                  </div>
                )}
                {property.daysOnZillow && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days on Market:</span>
                    <span className="font-medium">{property.daysOnZillow} days</span>
                  </div>
                )}
                {property.zestimate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimate:</span>
                    <span className="font-medium">${property.zestimate.toLocaleString()}</span>
                  </div>
                )}
                {property.rentZestimate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rent Estimate:</span>
                    <span className="font-medium">${property.rentZestimate.toLocaleString()}/month</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Listing Agent and Schools Section */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            {/* Agent Information */}
            {property.listed_by && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">Listing Agent</h3>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full border-2 border-brown/20 flex-shrink-0 overflow-hidden bg-brown/10">
                      {property.listed_by.image_url ? (
                        <img 
                          src={property.listed_by.image_url} 
                          alt={property.listed_by.display_name || 'Listing Agent'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${property.listed_by.image_url ? 'hidden' : 'flex'}`}>
                        <User className="w-8 h-8 text-brown/40" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-brown text-lg">{property.listed_by.display_name}</h4>
                      {property.listed_by.business_name && (
                        <p className="text-brown/70">{property.listed_by.business_name}</p>
                      )}
                      
                      {property.listed_by.phone && (
                        <div className="flex items-center text-brown mt-2">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>
                            {property.listed_by.phone.areacode && property.listed_by.phone.prefix && property.listed_by.phone.number
                              ? `(${property.listed_by.phone.areacode}) ${property.listed_by.phone.prefix}-${property.listed_by.phone.number}`
                              : property.listed_by.phone.areacode || property.listed_by.phone.prefix || property.listed_by.phone.number || 'Phone available'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Neighborhood Overview */}
                {(() => {
                
                  return null;
                })()}
                {(property.property_analysis as any)?.neighborhood_overview && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-brown" />
                      <h3 className="text-lg font-semibold text-brown">Neighborhood Overview</h3>
                    </div>
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-brown/80 text-sm leading-relaxed">
                            {(property.property_analysis as any)?.neighborhood_overview?.description}
                          </p>
                        </div>
                        {(property.property_analysis as any)?.neighborhood_overview?.vibe && (
                          <div>
                            <div className="bg-olive/10 border border-olive/20 rounded-lg px-3 py-2">
                              <span className="text-olive text-sm font-medium">
                                {(property.property_analysis as any)?.neighborhood_overview?.vibe}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Schools */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">Schools</h3>
              </div>
              <div className="space-y-3">
                {property.schools && property.schools.length > 0 ? (
                  property.schools.slice(0, 6).map((school, index) => (
                    <div key={index} className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-brown">{school.name || 'Unknown School'}</h4>
                        {school.rating && (
                          <span className={`px-2 py-1 rounded text-sm font-medium border ${
                            school.rating >= 8 
                              ? 'bg-olive/20 text-olive border-olive/30'
                              : school.rating >= 6 
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {school.rating}/10
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-brown/70 space-y-1">
                        {school.distance && (
                          <p>{school.distance.toFixed(1)} miles</p>
                        )}
                        <div className="flex items-center gap-2">
                          {school.type && <span>{school.type}</span>}
                          {school.grades && <span>• Grades {school.grades}</span>}
                          {school.level && <span>• {school.level}</span>}
                        </div>
                        {school.studentsPerTeacher && (
                          <p>Student/Teacher Ratio: {school.studentsPerTeacher}:1</p>
                        )}
                        {school.isAssigned && (
                          <p className="text-blue-600 font-medium">Assigned School</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                    <p className="text-brown/70">No school information available for this property.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property Features Section */}
          {property.features && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">Property Features</h3>
              </div>
              <div className="bg-beige/20 border border-beige rounded-lg p-6">

               {/* AI-Detected Features integrated into Property Features */}
               {property.image_features && !property.image_features.error && property.image_features.clean && property.image_features.clean.length > 0 && (
                    <div className="">
                      <h4 className="text-brown font-semibold text-sm mb-2">AI-Detected Features from Photos</h4>
                      <div className="text-brown/70 text-xs leading-relaxed">
                        {property.image_features?.clean?.map((feature, index) => (
                          <span key={index} className="inline-block">
                            {feature.trim()}
                            {index < (property.image_features?.clean?.length || 0) - 1 && (
                              <span className="text-brown/40 mx-2">•</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-4">
                  {property.features && typeof property.features === 'object' ? (
                    Object.entries(property.features).map(([category, featureList]) => (
                      <div key={category} className="">
                        <h4 className="text-brown font-semibold text-sm mb-2">{category}</h4>
                        <div className="text-brown/70 text-xs leading-relaxed">
                          {featureList.map((feature, index) => (
                            <span key={index} className="inline-block">
                              {feature.trim()}
                              {index < featureList.length - 1 && (
                                <span className="text-brown/40 mx-2">•</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-brown/60 text-sm text-center py-4">
                      No detailed features available
                    </div>
                  )}
                  

                </div>
              </div>
            </div>
          )}



          {/* Property Analysis Section - Perplexity Sonar Pro */}
          {property.property_analysis && !property.property_analysis.error && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">AI Property Analysis</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Pros */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-olive" />
                    <h3 className="text-lg font-semibold text-olive">Pros for You</h3>
                  </div>
                  <div className="space-y-3">
                    {property.property_analysis.pros.map((pro, index) => (
                      <div key={index} className="bg-olive/10 border border-olive/30 rounded-lg p-4">
                        <h4 className="font-medium text-olive mb-1">Property Advantage</h4>
                        <p className="text-sm text-brown/80">{pro}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cons */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-amber-600">Considerations</h3>
                  </div>
                  <div className="space-y-3">
                    {property.property_analysis.cons.map((con, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-600 mb-1">Consideration</h4>
                        <p className="text-sm text-brown/70">{con}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Crime & Safety Analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-brown" />
                    <h3 className="text-lg font-semibold text-brown">Crime & Safety Analysis</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-medium text-brown">Overall Safety Score</h4>
                        <span className="bg-olive/20 text-olive border border-olive/30 px-3 py-1 rounded-full text-sm font-medium">{property.property_analysis.crime_stats.overall_safety_score}</span>
                      </div>
                      <div className="space-y-3 ml-2.5">
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Crime Rate</span>
                          <span className="text-olive ml-2">{property.property_analysis.crime_stats.crime_rate}</span>
                        </div>
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Trend</span>
                          <span className={`ml-2 ${
                            property.property_analysis.crime_stats.recent_trends.toLowerCase().includes('improving') 
                              ? 'text-olive' 
                              : property.property_analysis.crime_stats.recent_trends.toLowerCase().includes('declining')
                              ? 'text-amber-600'
                              : 'text-olive'
                          }`}>
                            {property.property_analysis.crime_stats.recent_trends}
                          </span>
                        </div>
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Data Source</span>
                          <span className="text-olive ml-2">{property.property_analysis.crime_stats.data_source}</span>
                        </div>
                      </div>
                    </div>
                    {property.property_analysis.crime_stats.specific_concerns.length > 0 && (
                      <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                        <h4 className="font-medium text-brown mb-2">Specific Concerns</h4>
                        <div className="space-y-1">
                          {property.property_analysis.crime_stats.specific_concerns.map((concern, index) => (
                            <p key={index} className="text-sm text-brown/70">{concern}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gentrification Analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5 text-brown" />
                    <h3 className="text-lg font-semibold text-brown">Gentrification Analysis</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-medium text-brown">Gentrification Score</h4>
                        <span className="bg-olive/20 text-olive border border-olive/30 px-3 py-1 rounded-full text-sm font-medium">{property.property_analysis.gentrification_index.score}</span>
                      </div>
                      <div className="space-y-3 ml-2.5">
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Trend</span>
                          <span className={`ml-2 ${
                            property.property_analysis.gentrification_index.trend.toLowerCase().includes('gentrifying') 
                              ? 'text-amber-600' 
                              : property.property_analysis.gentrification_index.trend.toLowerCase().includes('stable')
                              ? 'text-olive'
                              : 'text-olive'
                          }`}>
                            {property.property_analysis.gentrification_index.trend}
                          </span>
                        </div>
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Timeline</span>
                          <span className="text-olive ml-2">{property.property_analysis.gentrification_index.timeline}</span>
                        </div>
                        <div className="flex justify-start text-xs">
                          <span className="text-brown/70">Property Value Impact</span>
                          <span className={`ml-2 ${
                            property.property_analysis.gentrification_index.impact_on_property_value.toLowerCase().includes('positive') 
                              ? 'text-olive' 
                              : property.property_analysis.gentrification_index.impact_on_property_value.toLowerCase().includes('negative')
                              ? 'text-amber-600'
                              : 'text-olive'
                          }`}>
                            {property.property_analysis.gentrification_index.impact_on_property_value}
                          </span>
                        </div>
                      </div>
                    </div>
                    {property.property_analysis.gentrification_index.indicators.length > 0 && (
                      <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                        <h4 className="font-medium text-brown mb-2">Key Indicators</h4>
                        <div className="space-y-1">
                          {property.property_analysis.gentrification_index.indicators.map((indicator, index) => (
                            <p key={index} className="text-sm text-brown/70">{indicator}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error state for property analysis */}
          {property.property_analysis?.error && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">AI Property Analysis</h3>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  Property analysis is temporarily unavailable. Please try again later.
                </p>
              </div>
            </div>
          )}

            {/* Commute Map Section */}
            {property.commute_data && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">Commute Information</h3>
              </div>
              <div className="bg-beige/20 border border-beige rounded-lg p-6">
                {property.commute_data?.error ? (
                  <div className="text-center text-brown/60 py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                    <p className="text-brown font-medium">Commute data unavailable</p>
                    <p className="text-sm text-brown/60 mt-1">{property.commute_data?.error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      {property.commute_data.map_url ? (
                        <div className="bg-white border border-beige/40 rounded-lg p-4">
                          <div className="aspect-square w-full">
                            <img 
                              src={property.commute_data.map_url} 
                              alt="Commute Map" 
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="hidden h-full items-center justify-center text-center text-brown/60">
                              <div>
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                                <p className="text-brown font-medium">Map unavailable</p>
                                <p className="text-sm text-brown/60 mt-1">Unable to load commute map</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-beige/40 rounded-lg p-4">
                          <div className="aspect-square w-full flex items-center justify-center">
                            <div className="text-center text-brown/60">
                              <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                              <p className="text-brown font-medium">Commute Map</p>
                              <p className="text-sm text-brown/60 mt-1">Map generation in progress...</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center h-full space-y-4">
                      {property.commute_data.travel_times && property.commute_data.travel_times.length > 0 ? (
                        property.commute_data.travel_times.map((commute, index) => {
                          const travelTimeMinutes = commute.travel_time ? 
                            parseInt(commute.travel_time.replace(/\D/g, '')) : null;
                          const tolerance = commute.commute_tolerance;
                          
                          // Determine color based on travel time vs tolerance
                          let colorClass = 'text-olive bg-olive/10'; // Default green
                          if (travelTimeMinutes && tolerance && typeof tolerance === 'number') {
                            if (travelTimeMinutes > tolerance * 1.2) {
                              colorClass = 'text-red-600 bg-red-50'; // Red for over tolerance
                            } else if (travelTimeMinutes > tolerance) {
                              colorClass = 'text-amber-600 bg-amber-50'; // Amber for close to tolerance
                            }
                          }
                          
                          return (
                            <div key={index} className="bg-white border border-beige/40 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-brown/80 font-medium">{commute.location_name || commute.name}</span>
                                  <p className="text-xs text-brown/60 mt-1 truncate">{commute.location_address || commute.address}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`font-medium px-2 py-1 rounded ${colorClass}`}>
                                    {commute.travel_time || 'N/A'}
                                  </span>
                                  {tolerance && (
                                    <p className="text-xs text-brown/60 mt-1">Target: {tolerance} min</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="bg-white border border-beige/40 rounded-lg p-4 text-center text-brown/60">
                            <p>No important locations configured</p>
                            <p className="text-sm mt-1">Set up your important locations in preferences to see commute times</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ROI Explanation */}
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                <h4 className="font-semibold text-gold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Investment Analysis & ROI
                </h4>
                <div className="text-gold text-sm leading-relaxed">
                  {/* Parse ROI explanation to extract summary and bullet points */}
                  {(() => {
                    const roiText = property.property_analysis?.roi_explanation || '';
                    const sentences = roiText.split(/[.!?]+/).filter(s => s.trim().length > 0);
                    
                    if (sentences.length === 0) {
                      return <p>No investment analysis available.</p>;
                    }
                    
                    // First sentence as summary
                    const summary = sentences[0].trim() + '.';
                    
                    // Remaining sentences as bullet points
                    const bulletPoints = sentences.slice(1).filter(s => s.trim().length > 10);
                    
                    return (
                      <div>
                        <p className="font-medium text-gold mb-3">{summary}</p>
                        {bulletPoints.length > 0 && (
                          <ul className="space-y-2">
                            {bulletPoints.map((point, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span>{point.trim()}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
