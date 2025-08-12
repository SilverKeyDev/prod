/**
 * Frontend function to fetch property details from backend API given a street address.
 * @param address The full property address string.
 */
export async function getPropertyDetailsByAddress(address: string) {
  try {
    console.log('🔍 [SEARCH_ADDRESS] Starting property details fetch for:', address);
    
    // Get auth token from localStorage
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      console.error('🔍 [SEARCH_ADDRESS] No auth token found');
      throw new Error('Authentication required. Please log in.');
    }
    console.log('🔍 [SEARCH_ADDRESS] Auth token found, length:', idToken.length);

    // Use the same API base URL as other components
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const fullUrl = `${apiBaseUrl}/api/v1/search/property-by-address`;
    console.log('🔍 [SEARCH_ADDRESS] Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
      body: JSON.stringify({ address })
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
    console.log('🔍 [SEARCH_ADDRESS] Successfully returning property data');
    return result.data;
  } catch (error) {
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error in getPropertyDetailsByAddress:', error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error type:', typeof error);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error message:', (error as Error).message);
    console.error('🔍 [SEARCH_ADDRESS] ❌ Error stack:', (error as Error).stack);
    throw error;
  }
}
