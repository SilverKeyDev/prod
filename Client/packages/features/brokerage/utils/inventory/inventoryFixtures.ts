export type InventoryListing = {
  id: string;
  external_id: string;
  address: string;
  status: "active" | "sold" | "pending";
  price: number | null;
  lat: number;
  lng: number;
  agent_name: string | null;
  property_type: string | null;
};

export const INVENTORY_FIXTURE: {
  listings: InventoryListing[];
  summary: {
    active_count: number;
    sold_count: number;
    total_count: number;
    median_price: number | null;
  };
} = {
  listings: [
    {
      id: "inv-1",
      external_id: "demo-1",
      address: "120 Peachtree St NE, Atlanta, GA",
      status: "active",
      price: 425000,
      lat: 33.759,
      lng: -84.388,
      agent_name: "Dean Houston",
      property_type: "Single Family",
    },
    {
      id: "inv-2",
      external_id: "demo-2",
      address: "88 Midtown Ave, Atlanta, GA",
      status: "active",
      price: 610000,
      lat: 33.7756,
      lng: -84.3963,
      agent_name: "Nicole Michael",
      property_type: "Condo",
    },
    {
      id: "inv-3",
      external_id: "demo-3",
      address: "450 Buckhead Pl, Atlanta, GA",
      status: "pending",
      price: 875000,
      lat: 33.8487,
      lng: -84.3733,
      agent_name: "Amber Edwards",
      property_type: "Single Family",
    },
    {
      id: "inv-4",
      external_id: "demo-4",
      address: "12 Marietta Sq, Marietta, GA",
      status: "sold",
      price: 390000,
      lat: 33.9519,
      lng: -84.5499,
      agent_name: "Joe Taylor",
      property_type: "Townhome",
    },
    {
      id: "inv-5",
      external_id: "demo-5",
      address: "77 Alpharetta Hwy, Alpharetta, GA",
      status: "active",
      price: 720000,
      lat: 34.0234,
      lng: -84.3616,
      agent_name: "Barbara Gonzalez",
      property_type: "Single Family",
    },
    {
      id: "inv-6",
      external_id: "demo-6",
      address: "9 Decatur St, Decatur, GA",
      status: "sold",
      price: 515000,
      lat: 33.7748,
      lng: -84.2963,
      agent_name: "Andrew Harris",
      property_type: "Single Family",
    },
  ],
  summary: {
    active_count: 3,
    sold_count: 2,
    total_count: 6,
    median_price: 515000,
  },
};
