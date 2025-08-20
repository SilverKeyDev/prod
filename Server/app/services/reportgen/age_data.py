import requests
import json
import os
import traceback

# Environment variables - will be None if not set (secure approach)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")

# ACS variable keys for age groups
AGE_GROUP_KEYS = {
    "0-19": ["S0101_C01_002E", "S0101_C01_003E", "S0101_C01_004E", "S0101_C01_005E", "S0101_C01_006E"],
    "20-34": ["S0101_C01_007E", "S0101_C01_008E"],
    "35-49": ["S0101_C01_009E", "S0101_C01_010E"],
    "50-64": ["S0101_C01_011E", "S0101_C01_012E"],
    "65+": ["S0101_C01_013E", "S0101_C01_014E", "S0101_C01_015E"]
}

def get_zip_from_address(address):
    if not address or not address.strip():
        raise ValueError("❌ Address is required and cannot be empty.")
    
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("❌ GOOGLE_MAPS_API_KEY is missing.")

    endpoint = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address.strip(), "key": GOOGLE_MAPS_API_KEY}

    try:
        res = requests.get(endpoint, params=params)
        print(f"🌐 Geocode request URL: {res.url}")
        data = res.json()
        if data["status"] != "OK":
            raise Exception(f"❌ Geocoding failed: {data['status']}")

        components = data["results"][0]["address_components"]
        for comp in components:
            if "postal_code" in comp["types"]:
                zip_code = comp["long_name"]
                print(f"📬 Found ZIP code: {zip_code}")
                return zip_code

        raise Exception("❌ ZIP code not found in geocoding result.")
    except Exception as e:
        print(f"❌ Geocoding error: {e}")
        traceback.print_exc()
        raise

def fetch_age_table_by_zip(zip_code):
    if not zip_code or not zip_code.strip():
        raise ValueError("❌ ZIP code is required and cannot be empty.")
    
    if not CENSUS_API_KEY:
        raise ValueError("❌ CENSUS_API_KEY is missing.")

    base = "https://api.census.gov/data/2023/acs/acs5/subject"
    variable_keys = ",".join(sum(AGE_GROUP_KEYS.values(), []))
    params = {
        "get": f"NAME,{variable_keys},S0101_C01_001E",
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_API_KEY,
    }

    try:
        response = requests.get(base, params=params)
        print(f"🌐 Full Census request URL: {response.url}")
        print(f"📥 Status Code: {response.status_code}")
        if response.status_code != 200:
            raise Exception(f"❌ Census API returned status {response.status_code}: {response.text}")
        if not response.text.strip():
            raise Exception(f"❌ Census API returned empty response for ZIP {zip_code}")
        return response.json()
    except Exception as e:
        print(f"❌ Census API error: {e}")
        traceback.print_exc()
        raise

def parse_age_distribution(data):
    print("🧮 Parsing age distribution...")
    try:
        header = data[0]
        row = data[1]
        row_dict = dict(zip(header, row))

        total_population = float(row_dict["S0101_C01_001E"])
        print(f"👥 Total Population: {total_population}")

        age_buckets = {}
        for group, keys in AGE_GROUP_KEYS.items():
            total = sum(float(row_dict.get(k, 0)) for k in keys)
            pct = round((total / total_population) * 100)
            age_buckets[group] = int(pct)
            print(f"  📊 {group}: {pct}%")

        return age_buckets
    except Exception as e:
        print(f"❌ Error parsing age distribution: {e}")
        traceback.print_exc()
        raise

def get_age_distribution(address: str) -> dict:
    """Top-level importable function for age distribution lookup by address."""
    try:
        print("\n🌟 Starting Age Distribution Lookup 🌟\n")
        print(f"🏠 Address: {address}\n")

        zip_code = get_zip_from_address(address)
        raw_data = fetch_age_table_by_zip(zip_code)
        distribution = parse_age_distribution(raw_data)

        print("\n✅ Final Age Distribution:")
        for group, pct in distribution.items():
            print(f"  {group}: {pct}%")

        return distribution
    except Exception as e:
        print(f"\n❌ Failed to get age distribution for: {address}")
        print(f"🛠️ Reason: {e}")
        return {"error": str(e), "address": address}

def get_population_total(address: str) -> dict:
    """Returns the total population for a given address using Census ZIP data."""
    try:
        print("\n🌟 Starting Total Population Lookup 🌟\n")
        print(f"🏠 Address: {address}\n")

        zip_code = get_zip_from_address(address)
        raw_data = fetch_age_table_by_zip(zip_code)

        header = raw_data[0]
        row = raw_data[1]
        row_dict = dict(zip(header, row))
        total_population = int(float(row_dict["S0101_C01_001E"]))

        print(f"👥 Total Population in ZIP {zip_code}: {total_population}")

        return {
            "total_population": total_population
        }

    except Exception as e:
        print(f"\n❌ Failed to get population for: {address}")
        print(f"🛠️ Reason: {e}")
        return {"error": str(e), "address": address}