/**
 * @file staffController.js
 * @description Express route handlers for the CampusBite Kitchen Staff module.
 *              Covers: live kitchen queue, order status lifecycle, menu stock
 *              management, and daily sales analytics via MongoDB aggregation.
 * @author Anish (feat/anish-staff-dashboard)
 * @module staffController
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

/** Valid order status values — mirrors the Order model enum */
const VALID_STATUSES = ['Placed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

/**
 * Maps each order status to its corresponding statusTimestamps field path.
 * Used in updateOrderStatus to stamp the exact transition time.
 * @type {Object.<string, string>}
 */
const STATUS_TIMESTAMP_MAP = {
  Preparing: 'statusTimestamps.preparingAt',
  Ready:     'statusTimestamps.readyAt',
  Completed: 'statusTimestamps.completedAt',
  Cancelled: 'statusTimestamps.cancelledAt',
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/staff/kitchen-queue
 * @description Returns all active orders (Placed | Preparing | Ready), sorted by
 *   pickup time slot first, then by createdAt ascending — ensuring the kitchen
 *   always processes the most time-critical orders first.
 * @access Staff Only (protect + staffOnly middleware)
 * @returns {Order[]} 200 — Array of populated active orders.
 * @returns {object}  500 — Internal server error message.
 */
const getKitchenQueue = async (req, res) => {
  try {
    const activeOrders = await Order.find({
      orderStatus: { $in: ['Placed', 'Preparing', 'Ready'] },
    })
      .populate('studentId', 'name rollNumber')
      .populate('timeSlotId', 'slotLabel')
      .sort({ timeSlotId: 1, createdAt: 1 });

    res.status(200).json(activeOrders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch kitchen queue', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/staff/orders/:id/status
 * @description Moves an order through its lifecycle stages:
 *   Placed → Preparing → Ready → Completed (or Cancelled at any point).
 *   Automatically records the exact transition timestamp via statusTimestamps.
 * @param {string} req.params.id         - MongoDB ObjectId of the order.
 * @param {string} req.body.orderStatus  - Target status (must be in VALID_STATUSES).
 * @access Staff Only
 * @returns {object} 200 — { message, order } — updated order document.
 * @returns {object} 400 — Invalid status value or malformed ObjectId.
 * @returns {object} 404 — Order not found.
 * @returns {object} 500 — Internal server error.
 */
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID format' });
  }

  if (!orderStatus || !VALID_STATUSES.includes(orderStatus)) {
    return res.status(400).json({
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    // Stamp the transition timestamp for the target status (if applicable)
    const timestampField = STATUS_TIMESTAMP_MAP[orderStatus];
    const updatePayload = { orderStatus };
    if (timestampField) updatePayload[timestampField] = new Date();

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).populate('studentId', 'name rollNumber');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/staff/menu/:id/toggle
 * @description Inverts the `isAvailable` flag on a MenuItem document.
 *   Staff press this to instantly mark an item sold-out or restore it.
 *   The updated item is returned so the frontend can reflect the change immediately.
 * @param {string} req.params.id - MongoDB ObjectId of the MenuItem.
 * @access Staff Only
 * @returns {object} 200 — { message, menuItem } — updated menu item.
 * @returns {object} 400 — Malformed menu item ID format.
 * @returns {object} 404 — Menu item not found.
 * @returns {object} 500 — Internal server error.
 */
const toggleMenuItemStock = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid menu item ID format' });
  }

  try {
    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({
      message: `"${item.name}" is now ${item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`,
      menuItem: item,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle item stock', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/staff/menu
 * @description Returns every MenuItem sorted by category then name alphabetically.
 *   Powers the Stock Manager tab in StaffDashboard.jsx, giving staff a
 *   complete view of all items with their current availability status.
 * @access Staff Only
 * @returns {MenuItem[]} 200 — Sorted array of all menu items.
 * @returns {object}     500 — Internal server error.
 */
const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, name: 1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/staff/analytics
 * @description Computes today's sales performance using two MongoDB aggregation
 *   pipelines for efficiency (avoids loading all documents into Node memory):
 *
 *   Pipeline 1 — Order-level stats ($match → $group):
 *     Calculates todayRevenue, totalOrders, completedOrders, pendingOrders,
 *     cancelledOrders using conditional $sum expressions.
 *
 *   Pipeline 2 — Item-level sell counts ($match → $unwind → $group → $sort → $limit):
 *     Flattens each order's items array, groups by item name, sums quantities,
 *     and returns the top 5 best-selling items of the day.
 *
 * @access Staff Only
 * @returns {object} 200 — Analytics summary object with topSellingItems array.
 * @returns {object} 500 — Internal server error.
 */
const getStaffAnalytics = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // ── Pipeline 1: order-level stats ────────────────────────────────────────
    const [orderStats] = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          paymentStatus: 'Completed',
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          todayRevenue: {
            $sum: {
              $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$totalAmount', 0],
            },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Completed'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$orderStatus', ['Placed', 'Preparing']] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    // ── Pipeline 2: top-selling items ────────────────────────────────────────
    const topSellingItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          paymentStatus: 'Completed',
          orderStatus: { $ne: 'Cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          count: { $sum: '$items.quantity' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

    res.status(200).json({
      todayRevenue:    orderStats?.todayRevenue    || 0,
      totalOrders:     orderStats?.totalOrders     || 0,
      completedOrders: orderStats?.completedOrders || 0,
      pendingOrders:   orderStats?.pendingOrders   || 0,
      cancelledOrders: orderStats?.cancelledOrders || 0,
      topSellingItems,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getKitchenQueue,
  updateOrderStatus,
  toggleMenuItemStock,
  getMenuItems,
  getStaffAnalytics,
};
