import React, { useState, useEffect } from 'react';

interface PriceRangeSliderProps {
  tickValues: number[]; // Ex: [1000000, 2000000, 4000000, 10000000]
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  formatPrefix?: string;
  className?: string;
  disabled?: boolean;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  tickValues,
  value,
  onChange,
  formatValue,
  formatPrefix = '$',
  className = '',
  disabled = false
}) => {
  const defaultFormatValue = (val: number) => `${formatPrefix}${val.toLocaleString()}`;
  const formattedValue = formatValue || defaultFormatValue;
  const [sliderValue, setSliderValue] = useState(0);

  // Maps value to slider percent (0-100) based on tickValues as keyframes
  const toSliderPercent = (val: number): number => {
    for (let i = 0; i < tickValues.length - 1; i++) {
      const start = tickValues[i];
      const end = tickValues[i + 1];
      if (val >= start && val <= end) {
        const segmentStart = (i / (tickValues.length - 1)) * 100;
        const segmentEnd = ((i + 1) / (tickValues.length - 1)) * 100;
        const percentWithinSegment = (val - start) / (end - start);
        return segmentStart + percentWithinSegment * (segmentEnd - segmentStart);
      }
    }
    return val <= tickValues[0] ? 0 : 100;
  };

  // Maps slider percent to value using linear interpolation in each segment
  const fromSliderPercent = (percent: number): number => {
    const totalSegments = tickValues.length - 1;
    const segmentSize = 100 / totalSegments;
    const segmentIndex = Math.min(Math.floor(percent / segmentSize), totalSegments - 1);

    const segmentStart = tickValues[segmentIndex];
    const segmentEnd = tickValues[segmentIndex + 1];
    const percentInSegment = (percent - segmentIndex * segmentSize) / segmentSize;
    return Math.round(segmentStart + percentInSegment * (segmentEnd - segmentStart));
  };

  useEffect(() => {
    setSliderValue(toSliderPercent(value));
  }, [value, tickValues]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderPercent = parseFloat(e.target.value);
    setSliderValue(newSliderPercent);
    const actualValue = fromSliderPercent(newSliderPercent);
    onChange(actualValue);
  };

  const renderTickMarks = () => {
    return (
      <div className="relative w-full h-6 mt-1">
        {tickValues.map((val, index) => {
          const leftPercent = (index / (tickValues.length - 1)) * 100;
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${leftPercent}%` }}
            >
              <div className="h-2 w-0.5 bg-gray-300 mx-auto"></div>
              <div className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
                {index === tickValues.length - 1 ? `${formattedValue(val)}+` : formattedValue(val)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex justify-center w-full ${className}`}>
  <div className="w-[600px] max-w-full">
    <div className="mb-6">
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={sliderValue}
        onChange={disabled ? undefined : handleSliderChange}
        className={`w-full h-2 bg-beige rounded-lg appearance-none accent-brown ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      />
      {renderTickMarks()}
    </div>
    <div className="text-center">
      <span className="text-lg font-medium text-brown">
        {formattedValue(value)}
      </span>
    </div>
  </div>
</div>
  );
};

export default PriceRangeSlider;


const zip2ptyRate: { [prefix: string]: number } = {
  // 0 prefix - Northeast (CT, MA, ME, NH, RI, VT)
  "00": 0.0178, // Connecticut (~1.78%)
  "01": 0.0102, // Massachusetts (~1.02%)
  "02": 0.0102, // Massachusetts (~1.02%)
  "03": 0.0155, // New Hampshire (~1.55%)
  "04": 0.0089, // Maine (~0.89%)
  "05": 0.0142, // Vermont (~1.42%)
  "06": 0.0139, // Rhode Island (~1.39%)
  "07": 0.0178, // Connecticut (~1.78%)
  "08": 0.0178, // Connecticut (~1.78%)
  "09": 0.0178, // Connecticut (~1.78%)

  // 1 prefix - NY Metro Area, NJ
  "10": 0.0147, // New York (~1.47%)
  "11": 0.0147, // New York (~1.47%)
  "12": 0.0147, // New York (~1.47%)
  "13": 0.0147, // New York (~1.47%)
  "14": 0.0147, // New York (~1.47%)
  "15": 0.0147, // New York (~1.47%)
  "16": 0.0147, // New York (~1.47%)
  "17": 0.0147, // New York (~1.47%)
  "18": 0.0147, // New York (~1.47%)
  "19": 0.0147, // New York (~1.47%)

  // 2 prefix - Mid-Atlantic (DC, MD, NC, SC, VA, WV)
  "20": 0.0080, // Washington DC / Maryland area (~0.80-0.87%)
  "21": 0.0087, // Maryland (~0.87%)
  "22": 0.0080, // Virginia (~0.80%)
  "23": 0.0080, // Virginia (~0.80%)
  "24": 0.0080, // Virginia (~0.80%)
  "25": 0.0080, // Virginia (~0.80%)
  "26": 0.0080, // Virginia (~0.80%)
  "27": 0.0099, // North Carolina (~0.99%)
  "28": 0.0099, // North Carolina (~0.99%)
  "29": 0.0051, // South Carolina (~0.51%)

  // 3 prefix - Southeast (AL, FL, GA, MS, TN, parts of others)
  "30": 0.0089, // Georgia (~0.89%)
  "31": 0.0089, // Georgia (~0.89%)
  "32": 0.0100, // Florida (~1.00%)
  "33": 0.0100, // Florida (~1.00%)
  "34": 0.0100, // Florida (~1.00%)
  "35": 0.0036, // Alabama (~0.36%)
  "36": 0.0036, // Alabama (~0.36%)
  "37": 0.0055, // Tennessee (~0.55%)
  "38": 0.0055, // Tennessee (~0.55%)
  "39": 0.0058, // Mississippi (~0.58%)

  // 4 prefix - Midwest (IN, KY, MI, OH)
  "40": 0.0078, // Kentucky (~0.78%)
  "41": 0.0078, // Kentucky (~0.78%)
  "42": 0.0078, // Kentucky (~0.78%)
  "43": 0.0109, // Ohio (~1.09%)
  "44": 0.0109, // Ohio (~1.09%)
  "45": 0.0109, // Ohio (~1.09%)
  "46": 0.0112, // Michigan (~1.12%)
  "47": 0.0112, // Michigan (~1.12%)
  "48": 0.0112, // Michigan (~1.12%)
  "49": 0.0112, // Michigan (~1.12%)

  // 5 prefix - Upper Midwest (IA, MN, MT, ND, SD, WI)
  "50": 0.0125, // Iowa (~1.25%)
  "51": 0.0125, // Iowa (~1.25%)
  "52": 0.0125, // Iowa (~1.25%)
  "53": 0.0125, // Wisconsin (~1.25%)
  "54": 0.0125, // Wisconsin (~1.25%)
  "55": 0.0108, // Minnesota (~1.08%)
  "56": 0.0108, // Minnesota (~1.08%)
  "57": 0.0101, // South Dakota (~1.01%)
  "58": 0.0141, // North Dakota (~1.41%)
  "59": 0.0074, // Montana (~0.74%)

  // 6 prefix - Central (IL, KS, MO, NE)
  "60": 0.0195, // Illinois - Chicago area (~1.95%)
  "61": 0.0195, // Illinois (~1.95%)
  "62": 0.0195, // Illinois (~1.95%)
  "63": 0.0073, // Missouri (~0.73%)
  "64": 0.0073, // Missouri (~0.73%)
  "65": 0.0073, // Missouri (~0.73%)
  "66": 0.0143, // Kansas (~1.43%)
  "67": 0.0143, // Kansas (~1.43%)
  "68": 0.0143, // Nebraska (~1.43%)
  "69": 0.0143, // Nebraska (~1.43%)

  // 7 prefix - South Central (AR, LA, OK, TX)
  "70": 0.0055, // Louisiana (~0.55%)
  "71": 0.0055, // Louisiana (~0.55%)
  "72": 0.0057, // Arkansas (~0.57%)
  "73": 0.0090, // Oklahoma (~0.90%)
  "74": 0.0090, // Oklahoma (~0.90%)
  "75": 0.0147, // Texas - Dallas area (~1.47%)
  "76": 0.0147, // Texas (~1.47%)
  "77": 0.0147, // Texas - Houston area (~1.47%)
  "78": 0.0147, // Texas (~1.47%)
  "79": 0.0147, // Texas (~1.47%)

  // 8 prefix - Mountain/West (AZ, CO, ID, MT, NM, NV, UT, WY)
  "80": 0.0045, // Colorado (~0.45%)
  "81": 0.0045, // Colorado (~0.45%)
  "82": 0.0061, // Wyoming (~0.61%)
  "83": 0.0053, // Idaho (~0.53%)
  "84": 0.0063, // Utah (~0.63%)
  "85": 0.0045, // Arizona (~0.45%)
  "86": 0.0045, // Arizona (~0.45%)
  "87": 0.0065, // New Mexico (~0.65%)
  "88": 0.0065, // New Mexico (~0.65%)
  "89": 0.0044, // Nevada (~0.44%)

  // 9 prefix - Pacific/West Coast (AK, CA, HI, OR, WA)
  "90": 0.0076, // California - Los Angeles area (~0.76%)
  "91": 0.0076, // California (~0.76%)
  "92": 0.0076, // California - San Diego area (~0.76%)
  "93": 0.0076, // California (~0.76%)
  "94": 0.0076, // California - San Francisco area (~0.76%)
  "95": 0.0076, // California (~0.76%)
  "96": 0.0076, // California (~0.76%)
  "97": 0.0073, // Oregon (~0.73%)
  "98": 0.0098, // Washington (~0.98%)
  "99": 0.0032  // Alaska (~0.32%) / Hawaii (~0.26%) - using Alaska rate
};

// Additional mappings for specific high-tax areas
const zipSpecialRates: { [zipRange: string]: number } = {
  // New Jersey - highest property tax state
  "070-079": 0.0208, // NJ Bergen, Essex, Morris counties (~2.08%)
  "080-089": 0.0208, // NJ Hunterdon, Somerset, Union counties (~2.08%)
  
  // Connecticut high-tax areas
  "068": 0.0178, // Western CT Planning Region
  
  // New York high-tax counties
  "100-104": 0.0147, // Manhattan, Bronx
  "110-116": 0.0147, // Queens, Brooklyn, Staten Island
  "105-109": 0.0160, // Westchester County (higher rate)
  "117-119": 0.0170, // Nassau, Suffolk counties (higher rate)
  
  // California high-tax areas
  "940-949": 0.0085, // Marin County area (higher than state average)
  "950-959": 0.0082, // Santa Clara County area
  
  // Virginia Falls Church City
  "220": 0.0120, // Falls Church City area
  
  // Texas - some areas have higher rates despite no state income tax
  "750-759": 0.0155, // Dallas metro high-tax areas
  "770-779": 0.0155, // Houston metro high-tax areas
};

// Function to get property tax rate for a ZIP code
function getPropertyTaxRate(zipCode: string): number {
  const prefix = zipCode.substring(0, 2);
  const threeDigit = zipCode.substring(0, 3);
  
  // Check for special rates first
  for (const range in zipSpecialRates) {
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      if (threeDigit >= start && threeDigit <= end) {
        return zipSpecialRates[range];
      }
    } else if (threeDigit.startsWith(range)) {
      return zipSpecialRates[range];
    }
  }
  
  // Fall back to prefix rate
  return zip2ptyRate[prefix] || 0.01; // Default 1% if not found
}

// Export the mapping and function
export { zip2ptyRate, zipSpecialRates, getPropertyTaxRate };