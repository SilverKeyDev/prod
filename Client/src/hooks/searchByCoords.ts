// Frontend types and interfaces for property search
type SearchStatus = "ForSale" | "ForRent" | "RecentlySold";

export interface LatLng {
  lon: number; // longitude (x)
  lat: number; // latitude (y)
}

// User preferences interface for filtering
interface UserPreferences {
  // Financial
  home_budget?: number;
  
  // Housing
  preferred_housing_type?: string;
  preferred_bathrooms?: number;
  preferred_bedrooms?: number;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  preferred_home_features?: string[];
  deal_breakers?: string[];
  
  // Other fields that might be relevant
  [key: string]: any;
}

export interface PolygonSearchOptions {
  polygon: LatLng[];                  // must be a closed ring (helper will close if not)
  user_preferences: UserPreferences;  // required user preferences for filtering
  status_type?: SearchStatus;         // optional, defaults to "ForSale"

  // API configuration
  perBucketPages?: number; // default 20, max 20
  maxRetries?: number;     // default 3
}

export interface ZillowProperty {
  zpid?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  listingStatus?: string;
  propertyType?: string;
  imgSrc?: string;
  [k: string]: any;        // passthrough for unknown fields
}

export interface PolygonSearchResult {
  properties: ZillowProperty[];
  meta: {
    bucketsTried: number;
    requestsMade: number;
    deduped: number;
  };
}

/**
 * Frontend function to search properties by polygon using backend API.
 */
export async function searchZillowByPolygon(
  opts: PolygonSearchOptions
): Promise<PolygonSearchResult> {
  const startTime = Date.now();
  console.log("[POLYGON_SEARCH] 🔍 Starting polygon property search", {
    timestamp: new Date().toISOString(),
    options: {
      polygonPoints: opts?.polygon?.length,
      statusType: opts?.status_type,
      perBucketPages: opts?.perBucketPages,
      maxRetries: opts?.maxRetries,
    }
  });

  const {
    polygon,
    user_preferences,
    status_type = "ForSale",
    perBucketPages = 20,
    maxRetries = 3,
  } = opts || ({} as PolygonSearchOptions);

  // Input validation with logging
  if (!user_preferences) {
    console.error("[POLYGON_SEARCH] ❌ Missing user preferences");
    throw new Error(
      "User preferences are required for property search. Please provide user_preferences."
    );
  }
  if (!polygon || polygon.length < 3) {
    console.error("[POLYGON_SEARCH] ❌ Invalid polygon", { 
      polygonLength: polygon?.length,
      polygon: polygon 
    });
    throw new Error("Polygon must have at least 3 points.");
  }

  console.log("[POLYGON_SEARCH] ✅ Input validation passed", {
    polygonPoints: polygon.length,
    userPreferencesKeys: Object.keys(user_preferences),
    statusType: status_type,
    perBucketPages,
    maxRetries
  });

  // ensure closed ring (backend also closes, but this avoids avoidable 400s)
  const closedPolygon =
    polygon[0].lon === polygon[polygon.length - 1].lon &&
    polygon[0].lat === polygon[polygon.length - 1].lat
      ? polygon
      : [...polygon, polygon[0]];

  if (closedPolygon.length !== polygon.length) {
    console.log("[POLYGON_SEARCH] 🔄 Closed polygon ring", {
      originalPoints: polygon.length,
      closedPoints: closedPolygon.length
    });
  }

  // auth
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    console.error("[POLYGON_SEARCH] ❌ No authentication token found");
    throw new Error("Authentication required. Please log in.");
  }

  console.log("[POLYGON_SEARCH] 🔐 Authentication token found");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  console.log("[POLYGON_SEARCH] 🌐 API configuration", {
    apiBase: API_BASE,
    endpoint: "/api/v1/search/properties-by-polygon"
  });

  // timeout guard
  const controller = new AbortController();
  const to = setTimeout(() => {
    console.warn("[POLYGON_SEARCH] ⏰ Request timeout (30s) - aborting");
    controller.abort();
  }, 30000); // 30s

  const requestBody = {
    polygon: closedPolygon,
    user_preferences,
    status_type,
    perBucketPages,
    maxRetries,
  };

  console.log("[POLYGON_SEARCH] 📤 Sending API request", {
    url: `${API_BASE}/api/v1/search/properties-by-polygon`,
    bodySize: JSON.stringify(requestBody).length,
    polygonBounds: {
      minLat: Math.min(...closedPolygon.map(p => p.lat)),
      maxLat: Math.max(...closedPolygon.map(p => p.lat)),
      minLon: Math.min(...closedPolygon.map(p => p.lon)),
      maxLon: Math.max(...closedPolygon.map(p => p.lon)),
    }
  });

  try {
    const response = await fetch(
      `${API_BASE}/api/v1/search/properties-by-polygon`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      }
    );

    const responseTime = Date.now() - startTime;
    console.log("[POLYGON_SEARCH] 📥 Received API response", {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length")
    });

    // handle non-2xx with server message if available
    if (!response.ok) {
      console.error("[POLYGON_SEARCH] ❌ API request failed", {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`
      });

      const text = await response.text();
      console.error("[POLYGON_SEARCH] ❌ Error response body", {
        responseText: text.slice(0, 500),
        fullLength: text.length
      });

      try {
        const j = JSON.parse(text);
        const msg =
          j.message || j.error || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(msg);
      } catch {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }
    }

    const result = await response.json();
    console.log("[POLYGON_SEARCH] 📊 Parsed API response", {
      success: result?.success,
      hasData: !!result?.data,
      dataKeys: result?.data ? Object.keys(result.data) : [],
      responseTime: `${responseTime}ms`
    });

    if (!result?.success) {
      console.error("[POLYGON_SEARCH] ❌ API returned failure", {
        success: result?.success,
        message: result?.message,
        error: result?.error
      });
      throw new Error(result?.message || result?.error || "Search failed");
    }

    // runtime type narrowing (lightweight)
    const data = result.data as PolygonSearchResult;
    if (!data?.properties || !data?.meta) {
      console.error("[POLYGON_SEARCH] ❌ Malformed response structure", {
        hasProperties: !!data?.properties,
        hasMeta: !!data?.meta,
        dataKeys: data ? Object.keys(data) : []
      });
      throw new Error("Malformed response from server.");
    }

    const totalTime = Date.now() - startTime;
    console.log("[POLYGON_SEARCH] ✅ Search completed successfully", {
      propertiesFound: data.properties.length,
      bucketsTried: data.meta.bucketsTried,
      requestsMade: data.meta.requestsMade,
      deduped: data.meta.deduped,
      totalTime: `${totalTime}ms`,
      avgTimePerProperty: data.properties.length > 0 ? `${Math.round(totalTime / data.properties.length)}ms` : 'N/A'
    });

    return data;
  } catch (err: any) {
    const totalTime = Date.now() - startTime;
    
    if (err?.name === "AbortError") {
      console.error("[POLYGON_SEARCH] ⏰ Search timed out", {
        totalTime: `${totalTime}ms`,
        timeoutDuration: "30s"
      });
      throw new Error("Search timed out. Please try again.");
    }
    
    console.error("[POLYGON_SEARCH] ❌ Search failed with error", {
      errorName: err?.name,
      errorMessage: err?.message,
      errorStack: err?.stack?.split('\n').slice(0, 3),
      totalTime: `${totalTime}ms`
    });
    
    throw err;
  } finally {
    clearTimeout(to);
    console.log("[POLYGON_SEARCH] 🏁 Search operation completed", {
      totalDuration: `${Date.now() - startTime}ms`
    });
  }
}
