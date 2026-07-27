const bcrypt = require("bcryptjs");
const { connectDB, mongoose } = require("./index");
const { User, Venue, AvailabilitySlot, Booking, Payment, Review } = require("./models");

const DEMO_OWNER_PASSWORD = "password123";
const DEMO_ADMIN_PASSWORD = "admin123";

async function main() {
  await connectDB();
  console.log("Seeding database...");

  await Promise.all([
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    AvailabilitySlot.deleteMany({}),
    Venue.deleteMany({}),
    User.deleteMany({}),
  ]);

  const ownerPasswordHash = await bcrypt.hash(DEMO_OWNER_PASSWORD, 10);
  const adminPasswordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);

  const [owner1, owner2, owner3] = await User.create([
    { phone: "+919000000001", name: "Anup Baruah", role: "VENUE_OWNER", password_hash: ownerPasswordHash },
    { phone: "+919000000002", name: "Rekha Gogoi", role: "VENUE_OWNER", password_hash: ownerPasswordHash },
    { phone: "+919000000003", name: "The Orchid Grand Mgmt", role: "VENUE_OWNER", password_hash: ownerPasswordHash },
  ]);

  const admin = await User.create({
    phone: "+919876543210",
    name: "Uthsav Admin",
    role: "ADMIN",
    password_hash: adminPasswordHash,
  });

  const [cust1, cust2, cust3] = await User.create([
    { phone: "+919100000001", name: "Rima Baruah", role: "CUSTOMER" },
    { phone: "+919100000002", name: "Dipankar Sharma", role: "CUSTOMER" },
    { phone: "+919100000003", name: "Mousumi Das", role: "CUSTOMER" },
  ]);

  const venueData = [
    {
      owner_id: owner1._id,
      name: "Brahmaputra Riverside Banquet",
      description: "A riverside banquet hall with open lawns and covered seating, popular for large Assamese weddings.",
      area: "Fancy Bazar, Guwahati", city: "Guwahati",
      capacity_min: 200, capacity_max: 800, base_price: 180000,
      verified: true, status: "LIVE",
      event_types: ["Wedding", "Reception"], amenities: ["Parking", "Catering", "Sound System", "AC"],
      token_percent: 15, commission_percent: 7,
    },
    {
      owner_id: owner2._id,
      name: "Namghar Community Hall",
      description: "A community-trust managed hall, simple and spacious, well suited to traditional functions.",
      area: "Beltola, Guwahati", city: "Guwahati",
      capacity_min: 80, capacity_max: 300, base_price: 25000,
      verified: true, status: "LIVE",
      event_types: ["Wedding", "Community", "Religious"], amenities: ["Parking", "Catering"],
      token_percent: 10, commission_percent: 5,
    },
    {
      owner_id: owner3._id,
      name: "The Orchid Grand",
      description: "A premium banquet property with in-house catering, AV, and dedicated event coordination.",
      area: "GS Road, Guwahati", city: "Guwahati",
      capacity_min: 150, capacity_max: 600, base_price: 320000,
      verified: true, status: "LIVE",
      event_types: ["Wedding", "Corporate", "Reception"],
      amenities: ["Parking", "WiFi", "Catering", "Sound System", "AC", "Security"],
      token_percent: 15, commission_percent: 7,
    },
    {
      owner_id: owner1._id,
      name: "Kaziranga Farmstay Lawns",
      description: "Open-air lawns near Kaziranga, ideal for destination weddings and offsites.",
      area: "Kaziranga Road", city: "Kaziranga",
      capacity_min: 50, capacity_max: 250, base_price: 95000,
      verified: false, status: "LIVE",
      event_types: ["Wedding", "Birthday", "Corporate"], amenities: ["Parking", "Catering"],
      token_percent: 20, commission_percent: 7,
    },
    {
      owner_id: owner2._id,
      name: "Dispur Conference Suites",
      description: "Compact conference rooms with AV and high-speed WiFi for corporate offsites and meetings.",
      area: "Dispur, Guwahati", city: "Guwahati",
      capacity_min: 20, capacity_max: 120, base_price: 15000,
      verified: true, status: "LIVE",
      event_types: ["Corporate"], amenities: ["WiFi", "AC", "Sound System"],
      token_percent: 10, commission_percent: 5,
    },
    {
      owner_id: owner3._id,
      name: "Ward's Lake Garden Venue",
      description: "A garden venue by Ward's Lake, popular for birthdays and small wedding functions.",
      area: "Panbazar, Guwahati", city: "Guwahati",
      capacity_min: 40, capacity_max: 180, base_price: 55000,
      verified: true, status: "LIVE",
      event_types: ["Birthday", "Wedding", "Community"], amenities: ["Parking", "Catering", "Security"],
      token_percent: 15, commission_percent: 7,
    },
  ];

  const venues = await Venue.create(venueData);

  const demoDates = ["2026-11-14", "2026-11-15", "2026-11-21", "2026-12-05"];
  const slotDocs = [];
  for (const v of venues) {
    for (const date of demoDates) {
      const blocked =
        (date === "2026-11-15" && v.name.includes("Riverside")) ||
        (date === "2026-11-21" && v.name.includes("Namghar")) ||
        (date === "2026-11-14" && v.name.includes("Orchid")) ||
        (date === "2026-12-05" && v.name.includes("Farmstay"));
      slotDocs.push({ venue_id: v._id, date, available: !blocked });
    }
  }
  await AvailabilitySlot.create(slotDocs);

  // A few seeded bookings so the owner dashboard has something to show
  const riverside = venues[0];
  const token1 = Math.round(riverside.base_price * (riverside.token_percent / 100));
  const commission1 = Math.round(riverside.base_price * (riverside.commission_percent / 100));

  await Booking.create([
    {
      venue_id: riverside._id, customer_id: cust1._id, event_type: "Wedding",
      event_date: "2026-11-14", guest_count: 350, venue_total: riverside.base_price,
      token_amount: token1, commission_amount: commission1, status: "PENDING",
    },
    {
      venue_id: riverside._id, customer_id: cust2._id, event_type: "Reception",
      event_date: "2026-11-21", guest_count: 400, venue_total: riverside.base_price,
      token_amount: token1, commission_amount: commission1, status: "PENDING",
    },
    {
      venue_id: riverside._id, customer_id: cust3._id, event_type: "Wedding",
      event_date: "2026-12-05", guest_count: 300, venue_total: riverside.base_price,
      token_amount: token1, commission_amount: commission1, status: "CONFIRMED",
      confirmed_at: new Date(),
    },
  ]);

  console.log(`Seeded ${venues.length} venues, 7 users, 3 bookings.`);
  console.log(`Riverside venue id (for owner dashboard demo): ${riverside._id}`);
  console.log("\nDemo login credentials:");
  console.log(`  Owner  — phone ${owner1.phone}, password ${DEMO_OWNER_PASSWORD}`);
  console.log(`  Owner  — phone ${owner2.phone}, password ${DEMO_OWNER_PASSWORD}`);
  console.log(`  Owner  — phone ${owner3.phone}, password ${DEMO_OWNER_PASSWORD}`);
  console.log(`  Admin  — phone ${admin.phone}, password ${DEMO_ADMIN_PASSWORD}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
