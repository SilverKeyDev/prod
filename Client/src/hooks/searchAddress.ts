/**
 * Frontend function to fetch property details from backend API given a street address.
 * @param address The full property address string.
 */
export async function getPropertyDetailsByAddress(address: string) {
  try {
    // Get auth token from localStorage
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch('/api/v1/search/property-by-address', {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Search failed');
    }

    return result.data;
  } catch (error) {
    console.error('Error in getPropertyDetailsByAddress:', error);
    throw error;
  }
}
