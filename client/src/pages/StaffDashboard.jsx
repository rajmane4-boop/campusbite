// [Anish] StaffDashboard.jsx
// Kitchen staff view: live order queue + status controls + daily analytics
// Branch: feat/anish-staff-dashboard

import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  ChefHat,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  IndianRupee,
  Flame,
  Package,
  ToggleLeft,
  ToggleRight,
  Search,
} from 'lucide-react';

// ─── Status config: colour + label for each order state ────────────────────
const STATUS_CONFIG = {
  Placed: {
    label: 'Placed',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-300',
    dot: 'bg-blue-500',
  },
  Preparing: {
    label: 'Preparing',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
  },
  Ready: {
    label: 'Ready ✓',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300',
    dot: 'bg-emerald-500',
  },
  Completed: {
    label: 'Completed',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-300',
    dot: 'bg-gray-400',
  },
  Cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-100',
    text: 'text-red-700',
    ring: 'ring-red-300',
    dot: 'bg-red-500',
  },
};

// Which next status can staff assign (forward-only flow)
const NEXT_STATUS_MAP = {
  Placed: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Completed',
};

// ─── Small stat card ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

// ─── Order card inside the kitchen queue ────────────────────────────────────
const OrderCard = ({ order, onStatusChange, loading }) => {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.Placed;
  const nextStatus = NEXT_STATUS_MAP[order.orderStatus];

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-300 ${cfg.ring} ring-1`}>
      {/* Header row */}
      <div className={`flex items-center justify-between px-5 py-3 rounded-t-2xl ${cfg.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
          <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>
        <span className="text-xs font-mono font-bold text-gray-700 bg-white/70 px-2 py-0.5 rounded-md">
          {order.pickupToken}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {order.studentName || order.studentId?.name || 'Student'}
            </p>
            <p className="text-xs text-gray-400">
              {order.rollNumber || order.studentId?.rollNumber || ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Slot</p>
            <p className="text-xs font-semibold text-gray-700">
              {order.slotLabel || order.timeSlotId?.slotLabel || '—'}
            </p>
          </div>
        </div>

        {/* Items list */}
        <ul className="space-y-1 mb-4">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm text-gray-700">
              <span className="truncate">{item.name}</span>
              <span className="font-semibold ml-2 shrink-0">× {item.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">₹{order.totalAmount}</span>
          {nextStatus ? (
            <button
              onClick={() => onStatusChange(order._id, nextStatus)}
              disabled={loading === order._id}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === order._id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Mark {nextStatus}
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">No action needed</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const StaffDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'stock' | 'analytics'
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'Placed' | 'Preparing' | 'Ready'
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'
  const [queueLoading, setQueueLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [error, setError] = useState('');

  // Fetch kitchen queue
  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.get('/staff/kitchen-queue');
      setQueue(data);
      setLastRefreshed(new Date());
    } catch {
      setError('Failed to load kitchen queue. Is the server running?');
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // Fetch daily analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await axiosInstance.get('/staff/analytics');
      setAnalytics(data);
    } catch {
      // silently fail analytics — queue is the critical view
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Fetch all menu items for stock manager
  const fetchMenuItems = useCallback(async () => {
    setMenuLoading(true);
    try {
      const { data } = await axiosInstance.get('/staff/menu');
      setMenuItems(data);
    } catch {
      setError('Failed to load menu items.');
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Toggle stock availability for a menu item
  const handleToggleStock = async (itemId) => {
    setTogglingId(itemId);
    try {
      const { data } = await axiosInstance.patch(`/staff/menu/${itemId}/toggle`);
      // Optimistic update in local list
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === itemId ? { ...item, isAvailable: data.menuItem.isAvailable } : item
        )
      );
    } catch {
      setError('Failed to toggle item. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchAnalytics();
    fetchMenuItems();
    // Auto-refresh queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue, fetchAnalytics, fetchMenuItems]);

  // Status update handler
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axiosInstance.patch(`/staff/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      // Optimistic update in local state
      setQueue((prev) =>
        prev
          .map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
          .filter((o) => ['Placed', 'Preparing', 'Ready'].includes(o.orderStatus))
      );
    } catch {
      setError('Status update failed. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Group queue by status for display order
  const placed = queue.filter((o) => o.orderStatus === 'Placed');
  const preparing = queue.filter((o) => o.orderStatus === 'Preparing');
  const ready = queue.filter((o) => o.orderStatus === 'Ready');
  const orderedQueue = [...placed, ...preparing, ...ready];
  const displayedQueue =
    queueFilter === 'ALL'
      ? orderedQueue
      : orderedQueue.filter((o) => o.orderStatus === queueFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Header Bar ── */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">CampusBite Kitchen</h1>
              <p className="text-orange-100 text-xs">Staff Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-orange-200 hidden sm:block">
                Refreshed {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => { fetchQueue(); fetchAnalytics(); }}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Tab Nav ── */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Kitchen Queue
            {queue.length > 0 && (
              <span className="bg-white/30 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {queue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'stock'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Stock Manager
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Today's Analytics
          </button>
        </div>

        {/* ══════════ QUEUE TAB ══════════ */}
        {activeTab === 'queue' && (
          <>
            {/* Quick Status Count & Filter Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setQueueFilter('ALL')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  queueFilter === 'ALL'
                    ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">All Active</span>
                  <span className={`text-lg font-black ${queueFilter === 'ALL' ? 'text-white' : 'text-gray-900'}`}>
                    {queue.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setQueueFilter(queueFilter === 'Placed' ? 'ALL' : 'Placed')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  queueFilter === 'Placed'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-blue-50/70 border-blue-200 text-blue-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${queueFilter === 'Placed' ? 'bg-white' : 'bg-blue-500'} animate-pulse`} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Placed</span>
                  </div>
                  <span className={`text-lg font-black ${queueFilter === 'Placed' ? 'text-white' : 'text-blue-900'}`}>
                    {placed.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setQueueFilter(queueFilter === 'Preparing' ? 'ALL' : 'Preparing')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  queueFilter === 'Preparing'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                    : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${queueFilter === 'Preparing' ? 'bg-white' : 'bg-amber-500'} animate-pulse`} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Preparing</span>
                  </div>
                  <span className={`text-lg font-black ${queueFilter === 'Preparing' ? 'text-white' : 'text-amber-900'}`}>
                    {preparing.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setQueueFilter(queueFilter === 'Ready' ? 'ALL' : 'Ready')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  queueFilter === 'Ready'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${queueFilter === 'Ready' ? 'bg-white' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Ready</span>
                  </div>
                  <span className={`text-lg font-black ${queueFilter === 'Ready' ? 'text-white' : 'text-emerald-900'}`}>
                    {ready.length}
                  </span>
                </div>
              </button>
            </div>

            {queueLoading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading kitchen queue...</span>
              </div>
            ) : orderedQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-300" />
                <p className="font-semibold text-gray-500">All caught up! No active orders.</p>
                <p className="text-sm">New orders will appear here automatically.</p>
              </div>
            ) : displayedQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 bg-white rounded-2xl border border-gray-100 p-8">
                <p className="font-semibold text-gray-600">No orders currently in "{queueFilter}" status.</p>
                <button
                  onClick={() => setQueueFilter('ALL')}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition"
                >
                  Show all active orders ({queue.length})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedQueue.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    loading={updatingId}
                  />
                ))}
              </div>
            )}
          </>
        )}
        {/* ══════════ STOCK MANAGER TAB ══════════ */}
        {activeTab === 'stock' && (
          <>
            {menuLoading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading menu items...</span>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
                <Package className="w-10 h-10" />
                <p>No menu items found.</p>
              </div>
            ) : (
              (() => {
                const inStockCount = menuItems.filter((i) => i.isAvailable).length;
                const outOfStockCount = menuItems.length - inStockCount;
                const allCategories = ['ALL', ...new Set(menuItems.map((i) => i.category))];

                const filteredItems = menuItems.filter((item) => {
                  const matchesSearch = item.name.toLowerCase().includes(stockSearch.toLowerCase());
                  const matchesCategory = stockCategoryFilter === 'ALL' || item.category === stockCategoryFilter;
                  const matchesStatus =
                    stockStatusFilter === 'ALL' ||
                    (stockStatusFilter === 'IN_STOCK' && item.isAvailable) ||
                    (stockStatusFilter === 'OUT_OF_STOCK' && !item.isAvailable);
                  return matchesSearch && matchesCategory && matchesStatus;
                });

                const displayedCategories = [...new Set(filteredItems.map((i) => i.category))];

                return (
                  <div className="space-y-6">
                    {/* Stock Overview Stats & Filters */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                      {/* Metric summary counters */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setStockStatusFilter('ALL')}
                          className={`p-3 rounded-xl border text-left transition ${
                            stockStatusFilter === 'ALL'
                              ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wider font-semibold">Total Menu</p>
                          <p className="text-xl font-black">{menuItems.length}</p>
                        </button>
                        <button
                          onClick={() => setStockStatusFilter(stockStatusFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
                          className={`p-3 rounded-xl border text-left transition ${
                            stockStatusFilter === 'IN_STOCK'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wider font-semibold">In Stock</p>
                          <p className="text-xl font-black">{inStockCount}</p>
                        </button>
                        <button
                          onClick={() => setStockStatusFilter(stockStatusFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
                          className={`p-3 rounded-xl border text-left transition ${
                            stockStatusFilter === 'OUT_OF_STOCK'
                              ? 'bg-red-600 border-red-600 text-white shadow-sm'
                              : 'bg-red-50/70 border-red-200 text-red-800 hover:bg-red-100/60'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wider font-semibold">Sold Out</p>
                          <p className="text-xl font-black">{outOfStockCount}</p>
                        </button>
                      </div>

                      {/* Search Bar + Category Pills */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            placeholder="Search dishes or drinks..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                          />
                          {stockSearch && (
                            <button
                              onClick={() => setStockSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Category selection chips */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                          {allCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setStockCategoryFilter(cat)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                                stockCategoryFilter === cat
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Filtered items or empty state */}
                    {filteredItems.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center space-y-3">
                        <Package className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="font-semibold text-gray-700">No items match your criteria</p>
                        <p className="text-xs text-gray-400">Try adjusting your search query or category filters.</p>
                        <button
                          onClick={() => {
                            setStockSearch('');
                            setStockCategoryFilter('ALL');
                            setStockStatusFilter('ALL');
                          }}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg transition inline-block"
                        >
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      displayedCategories.map((cat) => (
                        <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* Category header */}
                          <div className="px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-orange-700 uppercase tracking-wide">{cat}</h2>
                            <span className="text-xs font-semibold text-orange-600/80 bg-white/60 px-2 py-0.5 rounded-md">
                              {filteredItems.filter((i) => i.category === cat).length} items
                            </span>
                          </div>
                          {/* Items list */}
                          <ul className="divide-y divide-gray-50">
                            {filteredItems
                              .filter((item) => item.category === cat)
                              .map((item) => (
                                <li
                                  key={item._id}
                                  className={`flex items-center justify-between px-5 py-3 transition-colors ${
                                    !item.isAvailable ? 'bg-gray-50/70' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Veg / non-veg dot */}
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                        item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm font-semibold truncate ${
                                          item.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'
                                        }`}
                                      >
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-gray-400">₹{item.price}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleToggleStock(item._id)}
                                    disabled={togglingId === item._id}
                                    title={item.isAvailable ? 'Mark as Sold Out' : 'Mark as Available'}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                      item.isAvailable
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                  >
                                    {togglingId === item._id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : item.isAvailable ? (
                                      <ToggleRight className="w-4 h-4" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4" />
                                    )}
                                    {item.isAvailable ? 'In Stock' : 'Sold Out'}
                                  </button>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()
            )}
          </>
        )}

        {/* ══════════ ANALYTICS TAB ══════════ */}

        {activeTab === 'analytics' && (
          <>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading analytics...</span>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={IndianRupee}
                    label="Today's Revenue"
                    value={`₹${analytics.todayRevenue?.toLocaleString('en-IN') || 0}`}
                    accent="bg-gradient-to-br from-orange-500 to-amber-500"
                  />
                  <StatCard
                    icon={ClipboardList}
                    label="Total Orders"
                    value={analytics.totalOrders || 0}
                    accent="bg-gradient-to-br from-blue-500 to-indigo-500"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={analytics.completedOrders || 0}
                    accent="bg-gradient-to-br from-emerald-500 to-teal-500"
                  />
                  <StatCard
                    icon={Clock}
                    label="Pending"
                    value={analytics.pendingOrders || 0}
                    accent="bg-gradient-to-br from-amber-500 to-yellow-500"
                  />
                </div>

                {/* Top selling items */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h2 className="text-base font-bold text-gray-900">Top Selling Items Today</h2>
                  </div>
                  {analytics.topSellingItems && analytics.topSellingItems.length > 0 ? (
                    <ul className="space-y-3">
                      {analytics.topSellingItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500'
                                : idx === 1
                                ? 'bg-gray-400'
                                : idx === 2
                                ? 'bg-orange-400'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                {item.name}
                              </span>
                              <span className="text-sm font-bold text-orange-600 ml-2 shrink-0">
                                {item.count} sold
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (item.count /
                                      (analytics.topSellingItems[0]?.count || 1)) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No sales data for today yet.
                    </p>
                  )}
                </div>

                {/* Cancelled orders note */}
                {analytics.cancelledOrders > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{analytics.cancelledOrders}</strong> order(s) were cancelled today.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
                <AlertCircle className="w-10 h-10" />
                <p>Could not load analytics.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
