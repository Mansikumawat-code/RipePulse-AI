// RipePulse AI - Indore, Madhya Pradesh, India Operational Locations Data
// Center: [22.7196, 75.8577] (Indore City Center)

export const INDORE_CENTER_COORDINATES = [22.7196, 75.8577];

export const INDORE_DEMO_LOCATIONS = {
  WAREHOUSE: {
    id: "WH-IND-01",
    name: "Indore Central Cold-Storage Hub",
    shortName: "Indore Central Hub",
    category: "COLD_STORAGE",
    location: "Pithampur Road Sector 1, Indore, MP",
    coordinates: [22.6280, 75.6820],
    zones: [
      { id: "ZONE-A", name: "Deep Chill Bay A (Berries & Leafy Greens)", targetTemp: 2.0, currentTemp: 4.8, humidity: 91, voc: 1.2, status: "warning" },
      { id: "ZONE-B", name: "Controlled Atmosphere B (Tomatoes & Avocados)", targetTemp: 12.0, currentTemp: 12.4, humidity: 86, voc: 4.5, status: "normal" },
      { id: "ZONE-C", name: "Dry Ambient Bay C (Apples & Citrus)", targetTemp: 5.0, currentTemp: 5.2, humidity: 82, voc: 0.8, status: "normal" },
    ],
    capacityUtilizedPct: 78,
    activeSensors: 48,
  },
  COLLECTION_CENTER: {
    id: "LOC-PAL-01",
    name: "Palasia Fresh Collection Center",
    location: "Old Palasia Main Road, Indore, MP",
    coordinates: [22.7244, 75.8839],
  },
  PROCESSING_HUB: {
    id: "DEST-PROC-01",
    name: "Sanwer Road Food Processing & Juice Hub",
    type: "Food Processor / Juicer",
    icon: "🏭",
    category: "PROCESSOR",
    location: "Sanwer Road Industrial Area Sector E, Indore, MP",
    distanceKm: 18,
    travelTimeMinutes: 28,
    coordinates: [22.7750, 75.8360],
    capacityAvailableKg: 8500,
    preferredProduce: ["Strawberries", "Apples", "Berries", "Tomatoes", "Oranges"],
    pricingFactor: 0.91,
    contactPerson: "Rajesh Sharma (Intake Manager)",
    phone: "+91 98260 12345",
    rating: 4.9,
  },
  SUPERMARKET: {
    id: "DEST-MART-01",
    name: "Vijay Nagar Retail Wholesale Hub",
    type: "Discount Supermarket Hub",
    icon: "🏪",
    category: "SUPERMARKET",
    location: "Vijay Nagar AB Road, Indore, MP",
    distanceKm: 12,
    travelTimeMinutes: 20,
    coordinates: [22.7533, 75.8937],
    capacityAvailableKg: 12000,
    preferredProduce: ["Roma Tomatoes", "Avocados", "Citrus", "Melons", "Bananas"],
    pricingFactor: 0.80,
    contactPerson: "Vikram Malhotra (Procurement Head)",
    phone: "+91 98930 67890",
    rating: 4.7,
  },
  FOOD_BANK: {
    id: "DEST-RELIEF-01",
    name: "Dewas Naka Food Relief & Charity Bank",
    type: "Non-Profit Food Bank",
    icon: "🤝",
    category: "FOOD_BANK",
    location: "Dewas Naka Niranjanpur, Indore, MP",
    distanceKm: 15,
    travelTimeMinutes: 22,
    coordinates: [22.7690, 75.8980],
    capacityAvailableKg: 15000,
    preferredProduce: ["All Fresh Produce", "Strawberries", "Greens", "Apples"],
    pricingFactor: 0.0,
    taxCreditEstimatedPct: 0.35,
    contactPerson: "Sunita Patel (Donation Director)",
    phone: "+91 94250 54321",
    rating: 5.0,
  },
  COMMERCIAL_KITCHEN: {
    id: "DEST-KITCHEN-01",
    name: "Rau Commercial Ready-Meals Kitchen",
    type: "Prepared Food & Catering",
    icon: "🍲",
    category: "COMMERCIAL_KITCHEN",
    location: "Rau Bypass Circle, Indore, MP",
    distanceKm: 22,
    travelTimeMinutes: 30,
    coordinates: [22.6350, 75.8080],
    capacityAvailableKg: 4000,
    preferredProduce: ["Tomatoes", "Leafy Greens", "Avocados", "Peppers"],
    pricingFactor: 0.85,
    contactPerson: "Chef Amit Verma",
    phone: "+91 97520 98765",
    rating: 4.8,
  },
  DISTRIBUTION_HUB: {
    id: "LOC-RAU-01",
    name: "Rau Regional Distribution Hub",
    location: "Pithampur-Rau Link Road, Indore, MP",
    coordinates: [22.6250, 75.8000],
  },
  BYPASS_CENTER: {
    id: "LOC-BYPASS-01",
    name: "Bypass Logistics Redistribution Center",
    location: "Indore Bypass Highway Sector 3, Indore, MP",
    coordinates: [22.7100, 75.9200],
  }
};

export const INDORE_PLANNED_DESTINATIONS = [
  {
    id: "DEST-DELHI-DC",
    name: "Delhi NCR MegaGrocers Distribution Center",
    city: "New Delhi",
    coordinates: [28.6139, 77.2090],
    distanceKm: 810,
    transitDurationHours: 18,
    routeCoordinates: [
      [22.6280, 75.6820], // Indore Central Hub
      [23.2599, 77.4126], // Bhopal
      [25.4484, 78.5685], // Jhansi
      [27.1767, 78.0081], // Agra
      [28.6139, 77.2090]  // Delhi DC
    ]
  },
  {
    id: "DEST-MUMBAI-MART",
    name: "Mumbai Central FreshMart Hub",
    city: "Mumbai",
    coordinates: [19.0760, 72.8777],
    distanceKm: 580,
    transitDurationHours: 12,
    routeCoordinates: [
      [22.6280, 75.6820], // Indore Central Hub
      [21.1458, 72.7411], // Surat
      [19.0760, 72.8777]  // Mumbai
    ]
  },
  {
    id: "DEST-BHOPAL-PRIME",
    name: "Bhopal Prime Wholesale Market",
    city: "Bhopal",
    coordinates: [23.2599, 77.4126],
    distanceKm: 195,
    transitDurationHours: 4.5,
    routeCoordinates: [
      [22.6280, 75.6820], // Indore
      [22.9676, 76.0534], // Dewas
      [23.2599, 77.4126]  // Bhopal
    ]
  }
];
