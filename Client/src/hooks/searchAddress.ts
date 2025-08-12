/**
 * Frontend function to fetch property details from backend API given a zpid or address.
 * @param zpid The Zillow property ID (preferred for exact matches)
 * @param address The full property address string (fallback if zpid not available)
 */
export async function getPropertyDetailsByAddress(zpid?: string | number, address?: string) {
  try {
    const identifier = zpid ? `zpid: ${zpid}` : `address: ${address}`;
    console.log('🔍 [SEARCH_ADDRESS] Starting property details fetch for:', identifier);
    
    // Get auth token from localStorage
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      console.error('🔍 [SEARCH_ADDRESS] No auth token found');
      throw new Error('Authentication required. Please log in.');
    }
    console.log('🔍 [SEARCH_ADDRESS] Auth token found, length:', idToken.length);

    // Use the same API base URL as other components
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const fullUrl = `${apiBaseUrl}/api/v1/search/property`;
    console.log('🔍 [SEARCH_ADDRESS] Making request to:', fullUrl);

    // Prepare request body - prefer zpid over address for exact matches
    let requestBody: { zpid?: number; address?: string };
    if (zpid) {
      requestBody = { zpid: Number(zpid) };
      console.log('🔍 [SEARCH_ADDRESS] Using zpid for exact match:', zpid);
    } else if (address) {
      requestBody = { address };
      console.log('🔍 [SEARCH_ADDRESS] Using address (may have fuzzy matching):', address);
    } else {
      throw new Error('Either zpid or address must be provided');
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    console.log('🔍 [SEARCH_ADDRESS] Response received, status:', response.status);
    console.log('🔍 [SEARCH_ADDRESS] Response ok:', response.ok);
    console.log('🔍 [SEARCH_ADDRESS] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('🔍 [SEARCH_ADDRESS] Request failed with status:', response.status);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('🔍 [SEARCH_ADDRESS] Error data:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('🔍 [SEARCH_ADDRESS] Response data received');
    console.log('🔍 [SEARCH_ADDRESS] Result success:', result.success);
    console.log('🔍 [SEARCH_ADDRESS] Result keys:', Object.keys(result));
    
    if (!result.success) {
      console.error('🔍 [SEARCH_ADDRESS] API returned success=false:', result.error);
      throw new Error(result.error || 'Search failed');
    }

    console.log('🔍 [SEARCH_ADDRESS] Property data keys:', result.data ? Object.keys(result.data) : 'null');
    console.log('🔍 [SEARCH_ADDRESS] Commute data available:', !!result.commute_data);
    console.log('🔍 [SEARCH_ADDRESS] Zillow URL available:', !!result.zillow_url);
    console.log('🔍 [SEARCH_ADDRESS] Features available:', !!result.features);
    console.log('🔍 [SEARCH_ADDRESS] Images available:', result.images?.length || 0);
    if (result.commute_data) {
      console.log('🔍 [SEARCH_ADDRESS] Commute data keys:', Object.keys(result.commute_data));
      console.log('🔍 [SEARCH_ADDRESS] Travel times count:', result.commute_data.travel_times?.length || 0);
      console.log('🔍 [SEARCH_ADDRESS] Map URL available:', !!result.commute_data.map_url);
    }
    
    // Merge commute data, zillow_url, features, and images with property data
    const enhancedPropertyData = {
      ...result.data,
      commute_data: result.commute_data,
      zillow_url: result.zillow_url,
      features: result.features,
      images: result.images
    };
    
    console.log('🔍 [SEARCH_ADDRESS] Successfully returning enhanced property data with commute, Zillow URL, features, and images');
    return enhancedPropertyData;
  } catch (error) {
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error in getPropertyDetailsByAddress:', error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error type:', typeof error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error message:', (error as Error).message);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error stack:', (error as Error).stack);
    throw error;
  }
}
