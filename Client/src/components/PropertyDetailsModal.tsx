import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, MapPin, GraduationCap, Shield, ExternalLink, Star, DollarSign, Home, User, Phone } from 'lucide-react';
import HeartSave from './HeartSave';

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
}

interface PropertyDetailsModalProps {
  property: SearchResult | null;
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: SearchResult) => void;
  removeSavedHome: (id: string) => void;
  onFullReport?: () => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  onFullReport
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  
  if (!property) return null;

  // Default property images if none provided
  const propertyImages = property.images || [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ];

  const handleGoToZillow = () => {
    try {

    } catch (error) {
      console.error('Error generating Zillow link:', error);
      // Fallback to general Zillow search
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-brown/30 hover:scrollbar-thumb-brown/50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-brown">Property Details</h2>
                <p className="text-sm text-gray-600 mt-1">{property.address}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Compact Action Buttons */}
              {onFullReport && (
                <button 
                  onClick={onFullReport}
                  className="bg-olive-light text-gray-800 py-1.5 px-3 rounded text-xs font-medium hover:bg-olive-light/80 transition-colors"
                >
                  Full Report
                </button>
              )}
              <button 
                onClick={handleGoToZillow}
                className="border border-blue-600 text-blue-600 py-1.5 px-3 rounded text-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"
                title="View on Zillow"
              >
                <ExternalLink className="w-3 h-3" />
                Zillow
              </button>
              
              <HeartSave
                property={property}
                isSaved={isHomeSaved(property.id)}
                onSave={saveHome}
                onRemove={removeSavedHome}
                size="lg"
                ariaLabel={isHomeSaved(property.id) ? "Remove from saved" : "Save property"}
              />
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5 text-gray-500 hover:text-gray-700"
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

        <div className="p-6">
          {/* Property Image Carousel and Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              {/* Main Image Carousel */}
              <div className="relative">
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img 
                    src={propertyImages[currentImageIndex]} 
                    alt={`Property view ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        .map((image, relativeIndex) => {
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
                {property.price}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
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
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-black">
                    {property.sqft.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
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
                  <span className="font-medium">{property.homeType || property.propertyType || 'N/A'}</span>
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
                    <span className="text-gray-600">Zestimate:</span>
                    <span className="font-medium">${property.zestimate.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personalized Pros and Cons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pros */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-olive" />
                <h3 className="text-lg font-semibold text-olive">Pros for You</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-olive/10 border border-olive/30 rounded-lg p-4">
                  <h4 className="font-medium text-olive mb-1">Excellent Schools</h4>
                  <p className="text-sm text-brown/80">Perfect for your family with young children. Top-rated elementary school within walking distance.</p>
                </div>
                <div className="bg-olive/10 border border-olive/30 rounded-lg p-4">
                  <h4 className="font-medium text-olive mb-1">Great Commute</h4>
                  <p className="text-sm text-brown/80">25-minute commute to downtown SF aligns with your work location preferences.</p>
                </div>
                <div className="bg-olive/10 border border-olive/30 rounded-lg p-4">
                  <h4 className="font-medium text-olive mb-1">Family Neighborhood</h4>
                  <p className="text-sm text-brown/80">Quiet residential area with parks and family-friendly amenities nearby.</p>
                </div>
                <div className="bg-olive/10 border border-olive/30 rounded-lg p-4">
                  <h4 className="font-medium text-olive mb-1">Within Budget</h4>
                  <p className="text-sm text-brown/80">Price fits comfortably within your specified budget range of $800K-$1M.</p>
                </div>
              </div>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-600">Considerations</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-600 mb-1">Limited Nightlife</h4>
                  <p className="text-sm text-brown/70">Fewer entertainment options compared to urban areas you've shown interest in.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-600 mb-1">Older Construction</h4>
                  <p className="text-sm text-brown/70">Built in 1995, may require updates to meet your modern home preferences.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-600 mb-1">Public Transit</h4>
                  <p className="text-sm text-brown/70">Limited public transportation options, car dependency for most activities.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-600 mb-1">HOA Fees</h4>
                  <p className="text-sm text-brown/70">$250/month HOA fees not included in listing price.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Property Details Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">Financial Details</h3>
                </div>
                <div className="space-y-3">
                  {property.taxAnnualAmount && (
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-brown/70">Annual Property Tax:</span>
                        <span className="font-medium text-brown">${property.taxAnnualAmount.toLocaleString()}</span>
                      </div>
                      {property.propertyTaxRate && (
                        <div className="flex justify-between mt-2">
                          <span className="text-brown/70">Tax Rate:</span>
                          <span className="font-medium text-brown">{(property.propertyTaxRate * 100).toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(property.monthlyHoaFee || property.hoaFee) && (
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-brown/70">HOA Fee:</span>
                        <span className="font-medium text-brown">
                          {property.monthlyHoaFee ? `$${property.monthlyHoaFee}/month` : property.hoaFee}
                        </span>
                      </div>
                    </div>
                  )}
                  {property.rentZestimate && (
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-brown/70">Rent Estimate:</span>
                        <span className="font-medium text-brown">${property.rentZestimate.toLocaleString()}/month</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Features */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">Property Features</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {property.hasFireplace && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">Fireplace</span>
                        </div>
                      )}
                      {property.hasGarage && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">Garage</span>
                        </div>
                      )}
                      {property.hasCooling && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">A/C</span>
                        </div>
                      )}
                      {property.hasHeating && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">Heating</span>
                        </div>
                      )}
                      {property.hasView && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">View</span>
                        </div>
                      )}
                      {property.isNewConstruction && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-olive mr-2" />
                          <span className="text-brown">New Construction</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {property.appliances && property.appliances.length > 0 && (
                    <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                      <h4 className="font-medium text-brown mb-2">Appliances</h4>
                      <div className="flex flex-wrap gap-1">
                        {property.appliances.slice(0, 6).map((appliance, index) => (
                          <span key={index} className="px-2 py-1 bg-brown/10 text-brown rounded text-xs">
                            {appliance}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Information */}
            {property.listed_by && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-brown" />
                  <h3 className="text-lg font-semibold text-brown">Listing Agent</h3>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {property.listed_by.image_url && (
                      <img 
                        src={property.listed_by.image_url} 
                        alt={property.listed_by.display_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-brown/20"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-brown text-lg">{property.listed_by.display_name}</h4>
                      {property.listed_by.business_name && (
                        <p className="text-brown/70">{property.listed_by.business_name}</p>
                      )}
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        {property.listed_by.rating_average && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-amber-500 mr-1" />
                            <span className="font-medium text-brown">{property.listed_by.rating_average.toFixed(1)}</span>
                            {property.listed_by.review_count && (
                              <span className="text-brown/70 ml-1">({property.listed_by.review_count} reviews)</span>
                            )}
                          </div>
                        )}
                        
                        {property.listed_by.recent_sales && (
                          <div className="flex items-center text-brown/70">
                            <Home className="h-4 w-4 mr-1" />
                            <span>{property.listed_by.recent_sales} recent sales</span>
                          </div>
                        )}
                        
                        {property.listed_by.phone && (
                          <div className="flex items-center text-brown">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>
                              {property.listed_by.phone.prefix}-{property.listed_by.phone.areacode}-{property.listed_by.phone.number}
                            </span>
                          </div>
                        )}
                        
                        {property.listed_by.zpro && (
                          <div>
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              Zillow Pro
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Commute Map Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-brown" />
              <h3 className="text-lg font-semibold text-brown">Commute Information</h3>
            </div>
            <div className="bg-beige/20 border border-beige rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white border border-beige/40 rounded-lg p-4 h-48 flex items-center justify-center">
                    <div className="text-center text-brown/60">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-brown/40" />
                      <p className="text-brown font-medium">Commute Map Visualization</p>
                      <p className="text-sm text-brown/60 mt-1">(Interactive map would go here)</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white border border-beige/40 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-brown/80">To Downtown SF</span>
                      <span className="font-medium text-olive px-2 py-1 bg-olive/10 rounded">25 min</span>
                    </div>
                  </div>
                  <div className="bg-white border border-beige/40 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-brown/80">To SFO Airport</span>
                      <span className="font-medium text-amber-600 px-2 py-1 bg-amber-50 rounded">35 min</span>
                    </div>
                  </div>
                  <div className="bg-white border border-beige/40 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-brown/80">To Silicon Valley</span>
                      <span className="font-medium text-red-600 px-2 py-1 bg-red-50 rounded">45 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schools and Crime Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

            {/* Crime & Safety */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-brown" />
                <h3 className="text-lg font-semibold text-brown">Safety & Crime</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-brown">Overall Safety Score</h4>
                    <span className="bg-olive/20 text-olive border border-olive/30 px-3 py-1 rounded-full text-sm font-medium">B+</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brown/70">Violent Crime</span>
                      <span className="text-olive font-medium">Low</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brown/70">Property Crime</span>
                      <span className="text-amber-600 font-medium">Moderate</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brown/70">Police Response</span>
                      <span className="text-olive font-medium">Fast (4 min avg)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <h4 className="font-medium text-brown mb-2">Recent Activity</h4>
                  <p className="text-sm text-brown/70">2 incidents in past 30 days within 0.5 miles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
