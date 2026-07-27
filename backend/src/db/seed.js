const { v4: uuid } = require("uuid");
const db = require("./index");

function main() {
  console.log("Seeding database...");

  db.exec(`
    DELETE FROM payments;
    DELETE FROM reviews;
    DELETE FROM bookings;
    DELETE FROM availability_slots;
    DELETE FROM venues;
    DELETE FROM users;
  `);

  const insertUser = db.prepare(
    "INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)"
  );
  const owner1 = uuid(), owner2 = uuid(), owner3 = uuid();
  insertUser.run(owner1, "+919000000001", "Anup Baruah", "VENUE_OWNER");
  insertUser.run(owner2, "+919000000002", "Rekha Gogoi", "VENUE_OWNER");
  insertUser.run(owner3, "+919000000003", "The Orchid Grand Mgmt", "VENUE_OWNER");

  const cust1 = uuid(), cust2 = uuid(), cust3 = uuid();
  insertUser.run(cust1, "+919100000001", "Rima Baruah", "CUSTOMER");
  insertUser.run(cust2, "+919100000002", "Dipankar Sharma", "CUSTOMER");
  insertUser.run(cust3, "+919100000003", "Mousumi Das", "CUSTOMER");

  const insertVenue = db.prepare(`
    INSERT INTO venues
      (id, owner_id, name, description, area, city, capacity_min, capacity_max,
       base_price, verified, status, event_types, amenities, token_percent, commission_percent)
    VALUES (@id, @ownerId, @name, @description, @area, @city, @capacityMin, @capacityMax,
            @basePrice, @verified, @status, @eventTypes, @amenities, @tokenPercent, @commissionPercent)
  `);

  const venueData = [
    {
      id: uuid(), ownerId: owner1,
      name: "Brahmaputra Riverside Banquet",
      description: "A riverside banquet hall with open lawns and covered seating, popular for large Assamese weddings.",
      area: "Fancy Bazar, Guwahati", city: "Guwahati",
      capacityMin: 200, capacityMax: 800, basePrice: 180000,
      verified: 1, status: "LIVE",
      eventTypes: "Wedding,Reception", amenities: "Parking,Catering,Sound System,AC",
      tokenPercent: 15, commissionPercent: 7,
    },
    {
      id: uuid(), ownerId: owner2,
      name: "Namghar Community Hall",
      description: "A community-trust managed hall, simple and spacious, well suited to traditional functions.",
      area: "Beltola, Guwahati", city: "Guwahati",
      capacityMin: 80, capacityMax: 300, basePrice: 25000,
      verified: 1, status: "LIVE",
      eventTypes: "Wedding,Community,Religious", amenities: "Parking,Catering",
      tokenPercent: 10, commissionPercent: 5,
    },
    {
      id: uuid(), ownerId: owner3,
      name: "The Orchid Grand",
      description: "A premium banquet property with in-house catering, AV, and dedicated event coordination.",
      area: "GS Road, Guwahati", city: "Guwahati",
      capacityMin: 150, capacityMax: 600, basePrice: 320000,
      verified: 1, status: "LIVE",
      eventTypes: "Wedding,Corporate,Reception", amenities: "Parking,WiFi,Catering,Sound System,AC,Security",
      tokenPercent: 15, commissionPercent: 7,
    },
    {
      id: uuid(), ownerId: owner1,
      name: "Kaziranga Farmstay Lawns",
      description: "Open-air lawns near Kaziranga, ideal for destination weddings and offsites.",
      area: "Kaziranga Road", city: "Kaziranga",
      capacityMin: 50, capacityMax: 250, basePrice: 95000,
      verified: 0, status: "LIVE",
      eventTypes: "Wedding,Birthday,Corporate", amenities: "Parking,Catering",
      tokenPercent: 20, commissionPercent: 7,
    },
    {
      id: uuid(), ownerId: owner2,
      name: "Dispur Conference Suites",
      description: "Compact conference rooms with AV and high-speed WiFi for corporate offsites and meetings.",
      area: "Dispur, Guwahati", city: "Guwahati",
      capacityMin: 20, capacityMax: 120, basePrice: 15000,
      verified: 1, status: "LIVE",
      eventTypes: "Corporate", amenities: "WiFi,AC,Sound System",
      tokenPercent: 10, commissionPercent: 5,
    },
    {
      id: uuid(), ownerId: owner3,
      name: "Ward's Lake Garden Venue",
      description: "A garden venue by Ward's Lake, popular for birthdays and small wedding functions.",
      area: "Panbazar, Guwahati", city: "Guwahati",
      capacityMin: 40, capacityMax: 180, basePrice: 55000,
      verified: 1, status: "LIVE",
      eventTypes: "Birthday,Wedding,Community", amenities: "Parking,Catering,Security",
      tokenPercent: 15, commissionPercent: 7,
    },
  ];

  for (const v of venueData) insertVenue.run(v);

  const insertSlot = db.prepare(`
    INSERT INTO availability_slots (id, venue_id, date, available)
    VALUES (?, ?, ?, ?)
  `);
  const demoDates = ["2026-11-14", "2026-11-15", "2026-11-21", "2026-12-05"];
  for (const v of venueData) {
    for (const date of demoDates) {
      const blocked =
        (date === "2026-11-15" && v.name.includes("Riverside")) ||
        (date === "2026-11-21" && v.name.includes("Namghar")) ||
        (date === "2026-11-14" && v.name.includes("Orchid")) ||
        (date === "2026-12-05" && v.name.includes("Farmstay"));
      insertSlot.run(uuid(), v.id, date, blocked ? 0 : 1);
    }
  }

  // A few seeded bookings so the owner dashboard has something to show
  const riverside = venueData[0];
  const token1 = Math.round(riverside.basePrice * (riverside.tokenPercent / 100));
  const commission1 = Math.round(riverside.basePrice * (riverside.commissionPercent / 100));

  const insertBooking = db.prepare(`
    INSERT INTO bookings
      (id, venue_id, customer_id, event_type, event_date, guest_count,
       venue_total, token_amount, commission_amount, status, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBooking.run(uuid(), riverside.id, cust1, "Wedding", "2026-11-14", 350, riverside.basePrice, token1, commission1, "PENDING", null);
  insertBooking.run(uuid(), riverside.id, cust2, "Reception", "2026-11-21", 400, riverside.basePrice, token1, commission1, "PENDING", null);
  insertBooking.run(uuid(), riverside.id, cust3, "Wedding", "2026-12-05", 300, riverside.basePrice, token1, commission1, "CONFIRMED", new Date().toISOString());

  console.log(`Seeded ${venueData.length} venues, 6 users, 3 bookings.`);
  console.log(`Riverside venue id (for owner dashboard demo): ${riverside.id}`);
}

main();
