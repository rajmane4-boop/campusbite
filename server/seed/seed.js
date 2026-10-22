// [Pushkar] seed.js - Database Seeder
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const TimeSlot = require('../models/TimeSlot');
const Order = require('../models/Order');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusbite';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await TimeSlot.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing Users, MenuItems, TimeSlots, and Orders.');

    // 1. Create Test Users
    const salt = await bcrypt.genSalt(10);
    const studentPassword = await bcrypt.hash('student123', salt);
    const staffPassword = await bcrypt.hash('staff123', salt);

    const users = await User.insertMany([
      {
        name: 'Riya Sharma',
        email: 'riya.student@campus.edu',
        rollNumber: 'CS2026-042',
        passwordHash: studentPassword,
        role: 'student',
      },
      {
        name: 'Chef Ramesh (Staff)',
        email: 'canteen.staff@campus.edu',
        rollNumber: 'STAFF-001',
        passwordHash: staffPassword,
        role: 'staff',
      },
    ]);
    console.log(`Seeded ${users.length} test users (student & staff).`);

    // 2. Create 16 Realistic Canteen Menu Items
    const menuItems = await MenuItem.insertMany([
      // Snacks
      {
        name: 'Crispy Samosa (2 pcs)',
        category: 'Snacks',
        price: 30,
        isVeg: true,
        isAvailable: true,
        prepTime: 5,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Aloo Tikki Burger',
        category: 'Snacks',
        price: 60,
        isVeg: true,
        isAvailable: true,
        prepTime: 10,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Veg Grilled Cheese Sandwich',
        category: 'Snacks',
        price: 70,
        isVeg: true,
        isAvailable: true,
        prepTime: 8,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Chicken Roll',
        category: 'Snacks',
        price: 90,
        isVeg: false,
        isAvailable: true,
        prepTime: 12,
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Paneer Pakoda Platter',
        category: 'Snacks',
        price: 80,
        isVeg: true,
        isAvailable: true,
        prepTime: 10,
        imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Crispy French Fries',
        category: 'Snacks',
        price: 50,
        isVeg: true,
        isAvailable: true,
        prepTime: 7,
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
      },

      // Meals
      {
        name: 'Special Veg Thali',
        category: 'Meals',
        price: 110,
        isVeg: true,
        isAvailable: true,
        prepTime: 15,
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Paneer Butter Masala Combo',
        category: 'Meals',
        price: 130,
        isVeg: true,
        isAvailable: true,
        prepTime: 15,
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Chicken Biryani with Raita',
        category: 'Meals',
        price: 150,
        isVeg: false,
        isAvailable: true,
        prepTime: 12,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Egg Curry with Steamed Rice',
        category: 'Meals',
        price: 100,
        isVeg: false,
        isAvailable: true,
        prepTime: 12,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Chole Bhature (2 pcs)',
        category: 'Meals',
        price: 85,
        isVeg: true,
        isAvailable: true,
        prepTime: 10,
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'South Indian Masala Dosa',
        category: 'Meals',
        price: 75,
        isVeg: true,
        isAvailable: true,
        prepTime: 8,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60',
      },

      // Beverages
      {
        name: 'Masala Chai',
        category: 'Beverages',
        price: 15,
        isVeg: true,
        isAvailable: true,
        prepTime: 3,
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Cold Coffee with Ice Cream',
        category: 'Beverages',
        price: 60,
        isVeg: true,
        isAvailable: true,
        prepTime: 5,
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Fresh Mango Lassi',
        category: 'Beverages',
        price: 50,
        isVeg: true,
        isAvailable: true,
        prepTime: 5,
        imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=60',
      },
      {
        name: 'Chilled Lemon Iced Tea',
        category: 'Beverages',
        price: 40,
        isVeg: true,
        isAvailable: true,
        prepTime: 4,
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
      },
    ]);
    console.log(`Seeded ${menuItems.length} menu items across Snacks, Meals, Beverages.`);

    // 3. Create 8 Pickup Time Slots
    const timeSlots = await TimeSlot.insertMany([
      { slotLabel: '11:30 AM - 11:45 AM', maxCapacity: 25, bookedCount: 4, isActive: true },
      { slotLabel: '11:45 AM - 12:00 PM', maxCapacity: 25, bookedCount: 8, isActive: true },
      { slotLabel: '12:00 PM - 12:15 PM', maxCapacity: 25, bookedCount: 15, isActive: true },
      { slotLabel: '12:15 PM - 12:30 PM', maxCapacity: 30, bookedCount: 22, isActive: true },
      { slotLabel: '12:30 PM - 12:45 PM', maxCapacity: 30, bookedCount: 18, isActive: true },
      { slotLabel: '12:45 PM - 01:00 PM', maxCapacity: 25, bookedCount: 12, isActive: true },
      { slotLabel: '01:00 PM - 01:15 PM', maxCapacity: 25, bookedCount: 6, isActive: true },
      { slotLabel: '01:15 PM - 01:30 PM', maxCapacity: 20, bookedCount: 2, isActive: true },
    ]);
    console.log(`Seeded ${timeSlots.length} default pickup time slots.`);

    // 4. Create 3 Sample Active Orders for Kitchen Queue Testing
    const studentUser = users[0]; // Riya Sharma
    const sampleOrders = await Order.insertMany([
      {
        studentId: studentUser._id,
        studentName: studentUser.name,
        rollNumber: studentUser.rollNumber,
        items: [
          {
            menuItemId: menuItems[0]._id,
            name: menuItems[0].name,
            quantity: 2,
            price: menuItems[0].price,
            isVeg: menuItems[0].isVeg,
          },
          {
            menuItemId: menuItems[8]._id,
            name: menuItems[8].name,
            quantity: 1,
            price: menuItems[8].price,
            isVeg: menuItems[8].isVeg,
          },
        ],
        subtotal: 120,
        taxAmount: 6,
        packagingFee: 10,
        totalAmount: 136,
        timeSlotId: timeSlots[2]._id,
        slotLabel: timeSlots[2].slotLabel,
        pickupToken: 'CB-101',
        paymentMethod: 'upi',
        paymentStatus: 'Completed',
        orderStatus: 'Placed',
        statusTimestamps: {
          placedAt: new Date(),
        },
      },
      {
        studentId: studentUser._id,
        studentName: studentUser.name,
        rollNumber: studentUser.rollNumber,
        items: [
          {
            menuItemId: menuItems[4]._id,
            name: menuItems[4].name,
            quantity: 1,
            price: menuItems[4].price,
            isVeg: menuItems[4].isVeg,
          },
        ],
        subtotal: 110,
        taxAmount: 6,
        packagingFee: 10,
        totalAmount: 126,
        timeSlotId: timeSlots[3]._id,
        slotLabel: timeSlots[3].slotLabel,
        pickupToken: 'CB-102',
        paymentMethod: 'upi',
        paymentStatus: 'Completed',
        orderStatus: 'Preparing',
        statusTimestamps: {
          placedAt: new Date(Date.now() - 15 * 60 * 1000),
          preparingAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      {
        studentId: studentUser._id,
        studentName: studentUser.name,
        rollNumber: studentUser.rollNumber,
        items: [
          {
            menuItemId: menuItems[1]._id,
            name: menuItems[1].name,
            quantity: 1,
            price: menuItems[1].price,
            isVeg: menuItems[1].isVeg,
          },
          {
            menuItemId: menuItems[7]._id,
            name: menuItems[7].name,
            quantity: 2,
            price: menuItems[7].price,
            isVeg: menuItems[7].isVeg,
          },
        ],
        subtotal: 90,
        taxAmount: 5,
        packagingFee: 10,
        totalAmount: 105,
        timeSlotId: timeSlots[1]._id,
        slotLabel: timeSlots[1].slotLabel,
        pickupToken: 'CB-103',
        paymentMethod: 'wallet',
        paymentStatus: 'Completed',
        orderStatus: 'Ready',
        statusTimestamps: {
          placedAt: new Date(Date.now() - 25 * 60 * 1000),
          preparingAt: new Date(Date.now() - 12 * 60 * 1000),
          readyAt: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
    ]);
    console.log(`Seeded ${sampleOrders.length} active demo orders (Placed, Preparing, Ready) for Kitchen Queue.`);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
