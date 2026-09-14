// RipePulse AI - Agricultural Produce Degradation & Redistribution Mock Data (Indore MP Region)

export const INITIAL_WAREHOUSES = [
  {
    id: "WH-IND-01",
    name: "Indore Central Cold-Storage Hub",
    location: "Pithampur Sector 1, Indore, MP",
    coordinates: [22.6280, 75.6820],
    zones: [
      { id: "ZONE-A", name: "Deep Chill Bay A (Berries & Leafy)", targetTemp: 2.0, currentTemp: 4.8, humidity: 91, voc: 1.2, status: "warning" },
      { id: "ZONE-B", name: "Controlled Atmosphere B (Tomatoes & Avocados)", targetTemp: 12.0, currentTemp: 12.4, humidity: 86, voc: 4.5, status: "normal" },
      { id: "ZONE-C", name: "Dry Ambient Bay C (Apples & Citrus)", targetTemp: 5.0, currentTemp: 5.2, humidity: 82, voc: 0.8, status: "normal" },
    ],
    capacityUtilizedPct: 78,
    activeSensors: 48,
  }
];

export const INITIAL_BATCHES = [
  {
    id: "BAT-9042",
    produce: "Organic Strawberries",
    variety: "Mahabaleshwar Premium",
    icon: "🍓",
    harvestDate: "2026-09-10",
    arrivalDate: "2026-09-11 08:30",
    zone: "Deep Chill Bay A",
    palletCount: 14,
    weightKg: 2800,
    estimatedValue: 14200,
    currentTemp: 7.2, // Spiked above 2°C threshold
    baselineTemp: 2.0,
    currentHumidity: 94,
    currentVoc: 6.8, // Spiked ethylene/VOC
    baselineVoc: 0.5,
    sli: 26, // Shelf Life Index (0-100)
    remainingShelfLifeHours: 16,
    initialShelfLifeHours: 144,
    riskLevel: "CRITICAL", // LOW, MEDIUM, HIGH, CRITICAL
    confidenceScore: 95.8,
    decayRateFactor: 3.4,
    currentRoute: {
      destinationName: "Delhi NCR MegaGrocers DC",
      destinationType: "Regional Supermarket Hub",
      distanceKm: 810,
      transitDurationHours: 18, // Infeasible! 18h > 16h RSL
      isFeasible: false,
      scheduledDeparture: "2026-09-13 16:00",
      routeCoordinates: [
        [22.6280, 75.6820], // Indore
        [23.2599, 77.4126], // Bhopal
        [25.4484, 78.5685], // Jhansi
        [27.1767, 78.0081], // Agra
        [28.6139, 77.2090]  // Delhi NCR
      ]
    },
    recommendedAction: {
      actionType: "REROUTE_TO_PROCESSOR",
      urgency: "IMMEDIATE",
      title: "Reroute to Sanwer Road Food Processing & Juice Hub",
      reason: "Severe temperature spike (+5.2°C) and elevated VOC (6.8 ppm) accelerated mold spore germination. Batch will spoil before reaching Delhi (18h transit vs 16h shelf-life). Immediate cold pressing preserves 91% economic value.",
      targetDestinationId: "DEST-PROC-01",
      economicRecoveryEst: "₹1,085,000 (91%)",
      wasteAvoidedKg: 2800,
      status: "PENDING_APPROVAL" // PENDING_APPROVAL, APPROVED, DISPATCHED, DELIVERED
    }
  },
  {
    id: "BAT-8920",
    produce: "Roma Tomatoes",
    variety: "Desi Hybrid Premium",
    icon: "🍅",
    harvestDate: "2026-09-08",
    arrivalDate: "2026-09-09 11:15",
    zone: "Controlled Atmosphere B",
    palletCount: 22,
    weightKg: 5500,
    estimatedValue: 11000,
    currentTemp: 13.8,
    baselineTemp: 12.0,
    currentHumidity: 88,
    currentVoc: 4.9,
    baselineVoc: 1.0,
    sli: 48,
    remainingShelfLifeHours: 42,
    initialShelfLifeHours: 192,
    riskLevel: "HIGH",
    confidenceScore: 92.4,
    decayRateFactor: 2.1,
    currentRoute: {
      destinationName: "Mumbai Central FreshMart Hub",
      destinationType: "Supermarket Chain",
      distanceKm: 580,
      transitDurationHours: 12,
      isFeasible: false, // Feasible transit, but quality upon arrival would be < 20%
      scheduledDeparture: "2026-09-14 06:00",
      routeCoordinates: [
        [22.6280, 75.6820], // Indore
        [21.1458, 72.7411], // Surat
        [19.0760, 72.8777]  // Mumbai
      ]
    },
    recommendedAction: {
      actionType: "FLASH_DISCOUNT_LOCAL",
      urgency: "HIGH",
      title: "Flash Reroute: Vijay Nagar Retail Wholesale Hub",
      reason: "Ethylene concentration rising rapidly in Zone B. 12h transit to Mumbai leaves minimal quality margin. Local Indore redistribution allows same-day retail sale at 20% promotional discount.",
      targetDestinationId: "DEST-MART-01",
      economicRecoveryEst: "₹725,000 (80%)",
      wasteAvoidedKg: 5500,
      status: "APPROVED"
    }
  },
  {
    id: "BAT-8833",
    produce: "Hass Avocados",
    variety: "Grade 1 Export",
    icon: "🥑",
    harvestDate: "2026-09-06",
    arrivalDate: "2026-09-07 14:00",
    zone: "Controlled Atmosphere B",
    palletCount: 18,
    weightKg: 4200,
    estimatedValue: 16800,
    currentTemp: 11.8,
    baselineTemp: 12.0,
    currentHumidity: 85,
    currentVoc: 2.1,
    baselineVoc: 1.2,
    sli: 74,
    remainingShelfLifeHours: 110,
    initialShelfLifeHours: 240,
    riskLevel: "LOW",
    confidenceScore: 97.1,
    decayRateFactor: 1.05,
    currentRoute: {
      destinationName: "Bhopal Prime Wholesale Market",
      destinationType: "Premium Supermarket",
      distanceKm: 195,
      transitDurationHours: 4.5,
      isFeasible: true,
      scheduledDeparture: "2026-09-13 22:00",
      routeCoordinates: [
        [22.6280, 75.6820], // Indore
        [22.9676, 76.0534], // Dewas
        [23.2599, 77.4126]  // Bhopal
      ]
    },
    recommendedAction: {
      actionType: "PROCEED_AS_PLANNED",
      urgency: "NORMAL",
      title: "Maintain Scheduled Delivery to Bhopal",
      reason: "Controlled atmosphere parameters stable. Firmness index normal. 110 hours RSL easily accommodates 4.5h transit with ample safety window.",
      targetDestinationId: "DEST-BHOPAL-01",
      economicRecoveryEst: "₹1,400,000 (100%)",
      wasteAvoidedKg: 4200,
      status: "PENDING_APPROVAL"
    }
  },
  {
    id: "BAT-9104",
    produce: "Baby Spinach & Arugula",
    variety: "Organic Hydroponic",
    icon: "🥬",
    harvestDate: "2026-09-12",
    arrivalDate: "2026-09-12 16:45",
    zone: "Deep Chill Bay A",
    palletCount: 8,
    weightKg: 1200,
    estimatedValue: 6000,
    currentTemp: 3.1,
    baselineTemp: 2.0,
    currentHumidity: 96,
    currentVoc: 1.1,
    baselineVoc: 0.3,
    sli: 62,
    remainingShelfLifeHours: 38,
    initialShelfLifeHours: 96,
    riskLevel: "MEDIUM",
    confidenceScore: 93.9,
    decayRateFactor: 1.45,
    currentRoute: {
      destinationName: "Palasia Fresh Collection Center",
      destinationType: "Local Cooperative",
      distanceKm: 18,
      transitDurationHours: 0.5,
      isFeasible: true,
      scheduledDeparture: "2026-09-14 04:00",
      routeCoordinates: [
        [22.6280, 75.6820],
        [22.7244, 75.8839] // Palasia, Indore
      ]
    },
    recommendedAction: {
      actionType: "PRIORITY_DISPATCH",
      urgency: "MODERATE",
      title: "Expedite Morning Dispatch",
      reason: "Leaf respiration rate moderate. Route is feasible (0.5h transit vs 38h RSL). Recommend moving dispatch slot forward to ensure maximum freshness.",
      targetDestinationId: "LOC-PAL-01",
      economicRecoveryEst: "₹500,000 (100%)",
      wasteAvoidedKg: 1200,
      status: "APPROVED"
    }
  },
  {
    id: "BAT-8711",
    produce: "Honeycrisp Apples",
    variety: "Kinnaur Grade A",
    icon: "🍎",
    harvestDate: "2026-09-02",
    arrivalDate: "2026-09-04 09:00",
    zone: "Dry Ambient Bay C",
    palletCount: 30,
    weightKg: 7500,
    estimatedValue: 18750,
    currentTemp: 4.9,
    baselineTemp: 4.0,
    currentHumidity: 84,
    currentVoc: 0.9,
    baselineVoc: 0.6,
    sli: 88,
    remainingShelfLifeHours: 340,
    initialShelfLifeHours: 720,
    riskLevel: "LOW",
    confidenceScore: 98.4,
    decayRateFactor: 1.02,
    currentRoute: {
      destinationName: "Delhi NCR MegaGrocers DC",
      destinationType: "National Grocery Network",
      distanceKm: 810,
      transitDurationHours: 18,
      isFeasible: true,
      scheduledDeparture: "2026-09-15 10:00",
      routeCoordinates: [
        [22.6280, 75.6820],
        [27.1767, 78.0081], // Agra
        [28.6139, 77.2090]  // Delhi
      ]
    },
    recommendedAction: {
      actionType: "PROCEED_AS_PLANNED",
      urgency: "LOW",
      title: "Standard Inventory Hold",
      reason: "Respiration index minimal. Batch is exceptionally robust with over 14 days remaining buffer.",
      targetDestinationId: "DEST-DELHI-DC",
      economicRecoveryEst: "₹1,550,000 (100%)",
      wasteAvoidedKg: 7500,
      status: "PENDING_APPROVAL"
    }
  }
];

export const ALTERNATIVE_DESTINATIONS = [
  {
    id: "DEST-PROC-01",
    name: "Sanwer Road Food Processing & Juice Hub",
    type: "Food Processor / Juicer",
    icon: "🏭",
    category: "PROCESSOR",
    location: "Sanwer Road Industrial Area, Indore, MP",
    distanceKm: 18,
    travelTimeMinutes: 28,
    coordinates: [22.7750, 75.8360],
    capacityAvailableKg: 8500,
    preferredProduce: ["Strawberries", "Apples", "Berries", "Tomatoes"],
    pricingFactor: 0.91,
    contactPerson: "Rajesh Sharma (Intake Mgr)",
    phone: "+91 98260 12345",
    rating: 4.9,
    recommendedForBatches: ["BAT-9042"]
  },
  {
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
    preferredProduce: ["Roma Tomatoes", "Avocados", "Citrus", "Melons"],
    pricingFactor: 0.80,
    contactPerson: "Vikram Malhotra (Procurement)",
    phone: "+91 98930 67890",
    rating: 4.7,
    recommendedForBatches: ["BAT-8920"]
  },
  {
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
    pricingFactor: 0.0, // Donation (Tax credit value)
    taxCreditEstimatedPct: 0.35,
    contactPerson: "Sunita Patel (Donation Director)",
    phone: "+91 94250 54321",
    rating: 5.0,
    recommendedForBatches: ["BAT-9042", "BAT-8920"]
  },
  {
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
    recommendedForBatches: ["BAT-8920"]
  }
];

export const GENERATE_TELEMETRY_SERIES = (batchId) => {
  const series = [];
  const now = new Date();
  
  const isSpiked = batchId === "BAT-9042";
  const isTomato = batchId === "BAT-8920";

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000);
    const hourLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let temp = 2.1;
    let humidity = 92;
    let voc = 0.4;
    let sli = 98 - (24 - i) * 1.5;

    if (isSpiked) {
      if (i <= 14) {
        temp = +(2.1 + (14 - i) * 0.4 + (Math.random() * 0.3)).toFixed(1);
        voc = +(0.4 + (14 - i) * 0.45 + (Math.random() * 0.2)).toFixed(1);
        humidity = +(92 + (Math.sin(i) * 3)).toFixed(0);
        sli = Math.max(18, +(92 - (14 - i) * 5.2 - Math.random() * 2).toFixed(1));
      } else {
        temp = +(2.0 + Math.random() * 0.4).toFixed(1);
        voc = +(0.4 + Math.random() * 0.1).toFixed(1);
      }
    } else if (isTomato) {
      if (i <= 10) {
        temp = +(12.2 + (10 - i) * 0.18).toFixed(1);
        voc = +(1.2 + (10 - i) * 0.35).toFixed(1);
        sli = Math.max(45, +(85 - (24 - i) * 1.6).toFixed(1));
      } else {
        temp = +(12.0 + Math.random() * 0.3).toFixed(1);
        voc = +(1.0 + Math.random() * 0.2).toFixed(1);
        sli = +(95 - (24 - i) * 0.8).toFixed(1);
      }
    }

    series.push({
      time: hourLabel,
      timestamp: time.toISOString(),
      temperature: temp,
      optimalTemp: isTomato ? 12.0 : 2.0,
      maxThreshold: isTomato ? 14.5 : 4.0,
      humidity: humidity,
      optimalHumidity: 90,
      voc: voc,
      vocThreshold: 2.0,
      sli: sli,
      decayAcceleration: +(temp > 3.0 ? (temp / 2.0) * 1.4 : 1.0).toFixed(2),
    });
  }

  return series;
};

export const INITIAL_ALERTS = [
  {
    id: "ALT-1092",
    batchId: "BAT-9042",
    produce: "Organic Strawberries",
    severity: "CRITICAL",
    title: "Cold-Chain Thermal Abuse & Ethylene Surge",
    message: "Zone A Sensor #09 reported 7.2°C (+5.2°C above max specification). Ethylene accumulated to 6.8 ppm. Predicted remaining shelf life collapsed to 16h.",
    timestamp: "12 mins ago",
    status: "UNRESOLVED",
    actionRequired: "Approve emergency reroute to Sanwer Road Processing Hub before 16:00 dispatch cutoff"
  },
  {
    id: "ALT-1088",
    batchId: "BAT-8920",
    produce: "Roma Tomatoes",
    severity: "HIGH",
    title: "Transit Infeasibility Warning",
    message: "Current route to Mumbai (12h transit) will arrive with SLI below 30% retail freshness requirement.",
    timestamp: "48 mins ago",
    status: "UNRESOLVED",
    actionRequired: "Reroute to regional wholesale buyer Vijay Nagar Retail Hub"
  },
  {
    id: "ALT-1076",
    batchId: "BAT-9104",
    produce: "Baby Spinach",
    severity: "MEDIUM",
    title: "Microclimate Respiration Escalation",
    message: "Relative humidity fluctuation detected in Pallet Bay 04. Slight acceleration in chlorophyll degradation rate.",
    timestamp: "2 hours ago",
    status: "ACKNOWLEDGED",
    actionRequired: "Expedite morning loading schedule"
  },
  {
    id: "ALT-1050",
    batchId: "BAT-8833",
    produce: "Hass Avocados",
    severity: "LOW",
    title: "Routine Sensor Calibration Complete",
    message: "Chamber B VOC spectrometer self-check successful. Accuracy verified at 99.4%.",
    timestamp: "5 hours ago",
    status: "RESOLVED",
    actionRequired: "None"
  }
];

export const INITIAL_DISPATCHES = [
  {
    id: "DISP-5521",
    batchId: "BAT-8920",
    produce: "Roma Tomatoes",
    destination: "Vijay Nagar Retail Wholesale Hub",
    status: "IN_TRANSIT", // PREPARING, DISPATCHED, IN_TRANSIT, DELIVERED
    carrier: "Indore GreenExpress Cold Logistics #402",
    driverName: "Suresh Kumar",
    driverPhone: "+91 98930 11223",
    departureTime: "13:30 Today",
    eta: "14:15 Today (22 mins left)",
    progressPct: 65,
    currentCoordinates: [22.7300, 75.8700],
    temperatureMaintained: "11.9°C (Compliant)",
    wasteAvoidedKg: 5500,
    recoveredValue: "₹725,000"
  },
  {
    id: "DISP-5490",
    batchId: "BAT-8610",
    produce: "Nagpur Oranges",
    destination: "Sanwer Road Food Processing & Juice Hub",
    status: "DELIVERED",
    carrier: "Malwa Cold Freight Fleet #11",
    driverName: "Ramesh Chand",
    driverPhone: "+91 94250 88776",
    departureTime: "09:00 Today",
    eta: "Delivered at 10:15 Today",
    progressPct: 100,
    currentCoordinates: [22.7750, 75.8360],
    temperatureMaintained: "5.1°C (Compliant)",
    wasteAvoidedKg: 9200,
    recoveredValue: "₹950,000"
  }
];
