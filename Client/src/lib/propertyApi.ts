/**
 * Frontend function to fetch property details from backend API given a zpid or address.
 * @param zpid The Zillow property ID (preferred for exact matches)
 * @param address The full property address string (fallback if zpid not available)
 */
export async function getPropertyDetailsByAddress(zpid?: string | number, address?: string) {
  try {    
    // Get auth token from localStorage
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      console.error('🔍 [SEARCH_ADDRESS] No auth token found');
      throw new Error('Authentication required. Please log in.');
    }

    // Use the same API base URL as other components
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const fullUrl = `${apiBaseUrl}/api/v1/search/property`;

    // Prepare request body - prefer zpid over address for exact matches
    let requestBody: { zpid?: number; address?: string };
    if (zpid) {
      requestBody = { zpid: Number(zpid) };
    } else if (address) {
      requestBody = { address };
    } else {
      throw new Error('Either zpid or address must be provided');
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Search failed');
    }
    // Merge commute data, property analysis, image features, zillow_url, features, and images with property data
    const enhancedPropertyData = {
      ...result.data,
      commute_data: result.commute_data,
      property_analysis: result.property_analysis,
      image_features: result.image_features,
      zillow_url: result.zillow_url,
      features: result.features,
      images: result.images
    };
    
    console.log('🔍 [SEARCH_ADDRESS] Successfully returning enhanced property data with commute, property analysis, image features, Zillow URL, features, and images');
    return enhancedPropertyData;
  } catch (error) {
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error in getPropertyDetailsByAddress:', error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error type:', typeof error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error message:', (error as Error).message);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error stack:', (error as Error).stack);
    throw error;
  }
}
