require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const BloodBank = require('./models/BloodBank');
const Donation = require('./models/Donation');
const SOSRequest = require('./models/SOSRequest');

const CITIES = [
  { name: 'Mumbai', lng: 72.8777, lat: 19.0760, pincode: '400001' },
  { name: 'Delhi', lng: 77.2090, lat: 28.6139, pincode: '110001' },
  { name: 'Bangalore', lng: 77.5946, lat: 12.9716, pincode: '560001' },
  { name: 'Chennai', lng: 80.2707, lat: 13.0827, pincode: '600001' },
  { name: 'Hyderabad', lng: 78.4867, lat: 17.3850, pincode: '500001' },
  { name: 'Pune', lng: 73.8567, lat: 18.5204, pincode: '411001' }
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const NAMES = [
  'Aarav Sharma', 'Aditya Patel', 'Amit Verma', 'Ananya Iyer', 'Arjun Rao',
  'Devendra Singh', 'Gaurav Kumar', 'Ishaan Gupta', 'Kavita Reddy', 'Meera Nair',
  'Nikhil Deshmukh', 'Pooja Joshi', 'Pranav Sawant', 'Rahul Mehta', 'Rohan Kulkarni',
  'Sanjay Dutt', 'Shreya Ghoshal', 'Siddharth Roy', 'Sneha Paul', 'Vikram Seth',
  'Tanvi Bhatia', 'Yash Wardhan', 'Varun Dhawan', 'Nehal Chudasama', 'Deepak Hooda',
  'Harsh Goenka', 'Jatin Lal', 'Kunal Kapoor', 'Manoj Bajpayee', 'Nisha Rawal',
  'Preeti Zinta', 'Rajkumar Rao', 'Sameer Khan', 'Tushar Kapoor', 'Uday Chopra',
  'Vivek Oberoi', 'Zakir Hussain', 'Abhishek Bachchan', 'Bobby Deol', 'Chirag Paswan',
  'Divya Dutta', 'Esha Gupta', 'Farhan Akhtar', 'Gautam Gambhir', 'Hrishikesh Mukherjee',
  'Imran Khan', 'Javed Akhtar', 'Kiran Bedi', 'Lata Mangeshkar', 'Mohit Suri'
];

const BANK_NAMES = [
  'City Red Cross Blood Center', 'Apex Charitable Blood Bank', 'Lifeline Emergency Blood Bank',
  'Rotary Club Health Blood Bank', 'Holy Family Hospital Blood Bank', 'St. John Community Blood Trust',
  'Metro Care Blood Repository', 'Nationwide Plasma & Blood Bank', 'People First Donor Blood Center',
  'Metropolitan Hospital Stock Trust'
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bloodconnect');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await BloodBank.deleteMany({});
    await Donation.deleteMany({});
    await SOSRequest.deleteMany({});
    console.log('Cleaned existing users, blood banks, donations, and SOS requests.');

    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const bankPassword = await bcrypt.hash('bank123', salt);

    // 1. Create Admin
    await User.create({
      name: 'System Admin',
      email: 'admin@bloodconnect.org',
      password: adminPassword,
      phone: '9999999999',
      role: 'admin',
      city: 'Mumbai',
      pincode: '400001',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      isVerified: true
    });
    console.log('Created Admin Account: admin@bloodconnect.org / admin123');

    // 2. Create a default Requester for testing
    await User.create({
      name: 'John Requester',
      email: 'requester@bloodconnect.org',
      password: commonPassword,
      phone: '8888888888',
      role: 'requester',
      city: 'Bangalore',
      pincode: '560001',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // Bangalore base
      }
    });
    console.log('Created Requester Account: requester@bloodconnect.org / password123');

    // 3. Create 50 Donors
    const donors = [];
    for (let i = 0; i < 50; i++) {
      // Pick a random city
      const city = CITIES[i % CITIES.length];
      
      // Jitter coordinates slightly (+/- ~5-15km) to simulate actual local distribution
      const latJitter = (Math.random() - 0.5) * 0.15;
      const lngJitter = (Math.random() - 0.5) * 0.15;
      const lat = city.lat + latJitter;
      const lng = city.lng + lngJitter;

      // Pick a random blood group
      const bloodGroup = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
      
      // Random availability
      const isAvailable = Math.random() > 0.15; // 85% available

      // Last donation date (some null, some in past months)
      let lastDonationDate = null;
      if (Math.random() > 0.5) {
        const date = new Date();
        date.setMonth(date.getMonth() - Math.floor(Math.random() * 6 + 1));
        lastDonationDate = date;
      }

      const email = `donor${i + 1}@bloodconnect.org`;
      const name = NAMES[i % NAMES.length];

      donors.push({
        name,
        email,
        password: commonPassword,
        phone: `98765432${String(i).padStart(2, '0')}`,
        role: 'donor',
        bloodGroup,
        city: city.name,
        pincode: city.pincode,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        isAvailable,
        lastDonationDate,
        isVerified: i % 3 === 0 // 1/3 verified
      });
    }

    await User.insertMany(donors);
    console.log(`Successfully seeded 50 donors! (Pass: 'password123')`);

    // 4. Create 10 Blood Banks
    const banks = [];
    for (let j = 0; j < 10; j++) {
      const city = CITIES[j % CITIES.length];
      
      const latJitter = (Math.random() - 0.5) * 0.12;
      const lngJitter = (Math.random() - 0.5) * 0.12;
      const lat = city.lat + latJitter;
      const lng = city.lng + lngJitter;

      // Generate randomized inventory
      const inventory = BLOOD_GROUPS.map((bg) => ({
        bloodGroup: bg,
        units: Math.floor(Math.random() * 15) + 1, // 1 to 15 units
        lastUpdated: new Date()
      }));

      const email = `bank${j + 1}@bloodconnect.org`;
      const name = BANK_NAMES[j % BANK_NAMES.length];

      banks.push({
        name,
        licenceNumber: `LIC-BB-${String(j + 1000).padStart(4, '0')}`,
        email,
        password: bankPassword,
        phone: `99887766${String(j).padStart(2, '0')}`,
        address: `${Math.floor(Math.random() * 200 + 1)} Ring Road, Zone ${j + 1}`,
        city: city.name,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        inventory,
        lowStockThreshold: 5,
        isVerified: j % 2 === 0 // half verified
      });
    }

    await BloodBank.insertMany(banks);
    console.log(`Successfully seeded 10 Blood Banks! (Pass: 'bank123')`);

    // Print out a few examples of seeded donors and banks
    console.log('\nSample Seeded Donors:');
    const samples = await User.find({ role: 'donor' }).limit(2);
    samples.forEach(d => {
      console.log(`- Name: ${d.name}, Blood Group: ${d.bloodGroup}, City: ${d.city}, Email: ${d.email}`);
    });

    console.log('\nSample Seeded Blood Banks:');
    const bankSamples = await BloodBank.find().limit(2);
    bankSamples.forEach(b => {
      console.log(`- Name: ${b.name}, Licence: ${b.licenceNumber}, City: ${b.city}, Email: ${b.email}, Verified: ${b.isVerified}`);
    });

    mongoose.connection.close();
    console.log('\nSeeding complete. Database connection closed.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
