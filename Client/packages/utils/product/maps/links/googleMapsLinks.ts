/** Opens Google Maps Street View at the given coordinates (mobile browser / Maps app). */
export function buildGoogleStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0`;
}
