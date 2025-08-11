import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, MapPin, GraduationCap, Shield, ExternalLink } from 'lucide-react';
import HeartSave from './HeartSave';

interface Property {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  images?: string[];
}

interface PropertyDetailsModalProps {
  property: Property | null;
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: Property) => void;
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
                  <span className="font-medium">1995</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lot Size:</span>
                  <span className="font-medium">0.25 acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">Single Family</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">2-car garage</span>
                </div>
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
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-brown">Lincoln Elementary</h4>
                    <span className="bg-olive/20 text-olive border border-olive/30 px-2 py-1 rounded text-sm font-medium">9/10</span>
                  </div>
                  <p className="text-sm text-brown/70">0.3 miles • Public • K-5</p>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-brown">Roosevelt Middle School</h4>
                    <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded text-sm font-medium">7/10</span>
                  </div>
                  <p className="text-sm text-brown/70">0.8 miles • Public • 6-8</p>
                </div>
                <div className="bg-beige/10 border border-beige/40 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-brown">Washington High School</h4>
                    <span className="bg-olive/20 text-olive border border-olive/30 px-2 py-1 rounded text-sm font-medium">8/10</span>
                  </div>
                  <p className="text-sm text-brown/70">1.2 miles • Public • 9-12</p>
                </div>
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
