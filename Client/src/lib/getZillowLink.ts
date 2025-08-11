/**
 * Utility functions for generating property search URLs on external platforms
 */

/**
 * Generates a Redfin search URL for a given address
 * @param address - The property address to search for
 * @returns Redfin search URL
 */
export function redfinSearchUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.redfin.com/stingray/do/location-search?location=${encodedAddress}`;
}

/**
 * Generates a Zillow search URL for a given address
 * @param address - The property address to search for
 * @returns Zillow search URL
 */
export function zillowSearchUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.zillow.com/homes/${encodedAddress}_rb/`;
}

/**
 * Generates a Realtor.com search URL for a given address
 * @param address - The property address to search for
 * @returns Realtor.com search URL
 */
export function realtorSearchUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.realtor.com/realestateandhomes-search/${encodedAddress}`;
}
