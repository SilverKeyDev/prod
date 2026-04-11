"""Census API configuration and variable keys for demographic data."""

import os

# Environment variables - will be None if not set (secure approach)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")

# ACS variable keys for age groups
AGE_GROUP_KEYS = {
    "0-19": [
        "S0101_C01_002E",
        "S0101_C01_003E",
        "S0101_C01_004E",
        "S0101_C01_005E",
        "S0101_C01_006E",
    ],
    "20-34": ["S0101_C01_007E", "S0101_C01_008E"],
    "35-49": ["S0101_C01_009E", "S0101_C01_010E"],
    "50-64": ["S0101_C01_011E", "S0101_C01_012E"],
    "65+": ["S0101_C01_013E", "S0101_C01_014E", "S0101_C01_015E"],
}

# ACS variable keys for race/ethnicity
RACE_KEYS = {
    "white": "DP05_0077PE",
    "black": "DP05_0078PE",
    "asian": "DP05_0080PE",
    "hispanic": "DP05_0071PE",
}

# ACS variable keys for income brackets
INCOME_KEYS = {
    "under_25k": "S1901_C01_002E",
    "25k_50k": "S1901_C01_003E",
    "50k_75k": "S1901_C01_004E",
    "75k_100k": "S1901_C01_005E",
    "100k_150k": "S1901_C01_006E",
    "over_150k": "S1901_C01_007E",
}

# ACS variable keys for education
EDUCATION_KEYS = {
    "high_school": "S1501_C01_009E",
    "bachelors": "S1501_C01_012E",
    "graduate": "S1501_C01_013E",
}
