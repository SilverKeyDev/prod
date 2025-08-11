// Use global google.maps types - no import needed
// The @types/google.maps package provides global type definitions

const mapStyles: google.maps.MapTypeStyle[] = [
  // Show city and neighborhood labels with custom styling
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#4a4a4a" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#666666" },
      { visibility: "on" }
    ]
  },
  // Show major road labels (highways and arterials)
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#4a4a4a" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#666666" },
      { visibility: "on" }
    ]
  },
  // Hide local road labels to reduce clutter
  {
    featureType: "road.local",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  // Landscape styling
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [
      { color: "#f5f5f2" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [
      { color: "#ffffff" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "landscape",
    stylers: [{ color: "#f5f5f2" }]
  },
  // Hide most POI labels but keep icons off
  {
    featureType: "poi.attraction",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.medical",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.place_of_worship",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.school",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.sports_complex",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.government",
    elementType: "geometry",
    stylers: [{ visibility: "off" }]
  },
  // Hide POI icons but allow some labels
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  // Road styling
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      { color: "#ffffff" },
      { visibility: "simplified" }
    ]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      { color: "#ffffff" },
      { visibility: "simplified" }
    ]
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [
      { color: "#ffffff" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "road",
    stylers: [{ color: "#ffffff" }]
  },
  // Hide highway icons
  {
    featureType: "road.highway",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  // Water and parks
  {
    featureType: "water",
    stylers: [{ color: "#a0d3d3" }]
  },
  {
    featureType: "poi.park",
    stylers: [{ color: "#91b65d" }, { gamma: 1.51 }]
  },
  // National parks text styling - less bold and blurry
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#5a7c42" },
      { weight: "normal" },
      { visibility: "on" }
    ]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      { color: "#ffffff" },
      { weight: 1 },
      { visibility: "on" }
    ]
  },
  // Hide transit
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }]
  },
  // Hide sports complex geometry
  {
    featureType: "poi.sports_complex",
    elementType: "geometry",
    stylers: [
      { color: "#c7c7c7" },
      { visibility: "off" }
    ]
  }
];

export default mapStyles;