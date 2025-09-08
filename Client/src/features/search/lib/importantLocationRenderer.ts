/**
 * Utility functions for rendering important location markers on Google Maps
 */


interface ImportantLocationRenderOptions {
  map: google.maps.Map;
  importantMarkersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>;
  setImportantLocationMarkers?: (markers: google.maps.marker.AdvancedMarkerElement[]) => void;
  resetToDefaultZoom: () => void;
}

interface ImportantLocation {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  commute_tolerance?: number;
  icon?: string;
}


/**
 * Build list of important locations from isochrone data
 */
const buildImportantLocationsList = (isochroneData: any): ImportantLocation[] => {
  const importantLocations: ImportantLocation[] = [];
  
  if (isochroneData.center) {
    importantLocations.push({
      name: isochroneData.center.name || "Primary Location",
      address: isochroneData.center.address,
      lat: isochroneData.center.lat,
      lng: isochroneData.center.lng,
      commute_tolerance: isochroneData.commute_tolerance || 30,
    });
  }
  
  if (Array.isArray(isochroneData.locations)) {
    isochroneData.locations.forEach((loc: any) => {
      if (!loc?.address) return;
      const dup = importantLocations.some((e) => e.address === loc.address);
      if (!dup) {
        importantLocations.push({
          name: loc.name || "Important Location",
          address: loc.address,
          lat: loc.lat ?? null,
          lng: loc.lng ?? null,
          commute_tolerance: loc.commute_tolerance || 30,
        });
      }
    });
  }
  
  return importantLocations;
};


/**
 * Render important location markers on the map
 */
export const renderImportantLocationMarkers = async (
  isochroneData: any,
  options: ImportantLocationRenderOptions
) => {
  const { map, importantMarkersRef, setImportantLocationMarkers } = options;

  if (!map || !isochroneData?.center) {
    console.warn(
      "❌ Cannot render important location markers: map or data not available"
    );
    console.warn("📊 Map ref available:", !!map);
    console.warn(
      "📊 Isochrone center data:",
      JSON.stringify(isochroneData?.center, null, 2)
    );
    return;
  }

  console.log("🎯 [IMPORTANT_LOCATIONS] Starting to render important location markers");

  // Clear existing important location markers
  if (importantMarkersRef.current) {
    importantMarkersRef.current.forEach((marker) => {
      if ((marker as any)._bubble) {
        (marker as any)._bubble.setMap(null);
      }
      marker.map = null;
    });
    importantMarkersRef.current = [];
  }

  const importantLocations = buildImportantLocationsList(isochroneData);
  console.log(`🎯 [IMPORTANT_LOCATIONS] Found ${importantLocations.length} important locations to render`);

  if (importantLocations.length === 0) {
    console.log("🎯 [IMPORTANT_LOCATIONS] No important locations to render");
    return;
  }

  const markers: google.maps.marker.AdvancedMarkerElement[] = [];

  for (const loc of importantLocations) {
    // Skip locations without coordinates - this is normal and not an error
    if (!loc.lat || !loc.lng) {
      console.log(`🎯 [IMPORTANT_LOCATIONS] Skipping ${loc.name} - no coordinates available`);
      continue;
    }

    const { name, address } = loc;
    const position = { lat: loc.lat, lng: loc.lng };

    console.log(`🎯 [IMPORTANT_LOCATIONS] Creating marker for: ${name} at (${loc.lat}, ${loc.lng})`);

    // Create marker box with triangle pointer
    const markerElement = document.createElement('div');
    markerElement.className = 'important-location-marker';
    
    const commuteTime = loc.commute_tolerance ?? isochroneData.commute_tolerance ?? 30;
    
    markerElement.innerHTML = `
      <div style="
        padding: 4px 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(158, 131, 113, 0.4);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        white-space: nowrap;
      ">
        <div style="
          color: #4A3228; 
          font-size: 11px; 
          font-weight: 600;
          margin-bottom: 1px;
        ">${name}</div>
        <div style="
          color: #8B7355; 
          font-size: 9px; 
          font-weight: 500;
        ">${commuteTime} min</div>
        
        <!-- Triangle pointer -->
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(255, 255, 255, 0.95);
        "></div>
        <div style="
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 7px solid rgba(158, 131, 113, 0.4);
        "></div>
      </div>
    `;

    markerElement.style.cssText = `
      position: relative;
      transform: translate(-50%, -100%);
    `;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      content: markerElement,
      title: `${name} - ${address}`,
    });

    markers.push(marker);
  }

  importantMarkersRef.current = markers;
  if (setImportantLocationMarkers) {
    setImportantLocationMarkers(markers);
  }
};
