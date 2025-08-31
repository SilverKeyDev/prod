import { 
  formatPrice, 
  getStatusColor, 
  formatHomeStatus, 
  formatAgentName, 
  formatLotSize 
} from "../../lib/addressFormat";
import { PropertyCard } from "../ui";
import { CardAddressDisplay, CardAgentInfo } from "./base";

export interface CompData {
  address: {
    city: string;
    state: string;
    streetAddress: string;
    zipcode: string;
  };
  bathrooms: number;
  bedrooms: number;
  currency: string;
  homeStatus: string;
  homeType: string;
  latitude: number;
  livingArea: number;
  livingAreaUnits: string;
  livingAreaUnitsShort: string;
  longitude: number;
  lotAreaValue?: number;
  lotAreaUnits?: string;
  lotSize?: number;
  miniCardPhotos?: Array<{ url: string }>;
  parentRegion?: {
    name: string;
  };
  price: number;
  zpid: number;
  attributionInfo?: {
    agentName?: string;
    brokerName?: string;
    trueStatus?: string;
  };
}

interface CompCardProps {
  comp: CompData;
  className?: string;
}

export default function CompCard({ comp, className = "" }: CompCardProps) {

  const imageUrl = comp.miniCardPhotos?.[0]?.url || '/defaut-home.jpg';

  // Format lot size for display
  const lotSizeDisplay = comp.lotAreaValue 
    ? formatLotSize(comp.lotAreaValue, comp.lotAreaUnits || 'acres')
    : 'not provided';

  // Format agent info for additional details
  const additionalDetails = [];
  if (comp.lotAreaValue) {
    additionalDetails.push(`Lot: ${lotSizeDisplay}`);
  }
  if (comp.attributionInfo?.agentName) {
    additionalDetails.push(`Agent: ${formatAgentName(comp.attributionInfo.agentName)}`);
  }

  return (
    <PropertyCard
      imageUrl={imageUrl}
      address={comp.address.streetAddress}
      price={formatPrice(comp.price, comp.currency)}
      bedrooms={comp.bedrooms}
      bathrooms={comp.bathrooms}
      sqft={comp.livingArea}
      propertyType={comp.homeType}
      lotSize={lotSizeDisplay}
      status={{
        text: formatHomeStatus(comp.homeStatus),
        className: getStatusColor(comp.homeStatus)
      }}
      className={className}
      bottomContent={
        <div className="space-y-responsive-sm">
          {/* Secondary Address */}
          <CardAddressDisplay
            address={`${comp.address.city}, ${comp.address.state} ${comp.address.zipcode}`}
            region={comp.parentRegion?.name}
            variant="compact"
            size="xs"
            showIcon={false}
            className="text-gray-600"
          />
          
          {/* Agent Info */}
          {comp.attributionInfo?.agentName && (
            <CardAgentInfo
              agentName={formatAgentName(comp.attributionInfo.agentName)}
              brokerName={comp.attributionInfo?.brokerName}
              size="xs"
              showIcon={false}
            />
          )}
        </div>
      }
    />
  );
}
