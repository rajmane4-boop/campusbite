// [Arnav] CheckoutPage.jsx - Time slot picker & Mock UPI/Card payment
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Zap,
  Users,
  ChevronRight,
  CreditCard,
  RefreshCw,
  Wallet,
  QrCode,
  X,
  Check,
  Smartphone,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// Fallback pickup slots matching backend seed data
const FALLBACK_SLOTS = [
  { _id: 'slot_1', slotLabel: '11:30 AM - 11:45 AM', maxCapacity: 25, bookedCount: 4, availableSpots: 21, isFull: false, urgencyStatus: 'available' },
  { _id: 'slot_2', slotLabel: '11:45 AM - 12:00 PM', maxCapacity: 25, bookedCount: 8, availableSpots: 17, isFull: false, urgencyStatus: 'available' },
  { _id: 'slot_3', slotLabel: '12:00 PM - 12:15 PM', maxCapacity: 25, bookedCount: 15, availableSpots: 10, isFull: false, urgencyStatus: 'available' },
  { _id: 'slot_4', slotLabel: '12:15 PM - 12:30 PM', maxCapacity: 30, bookedCount: 22, availableSpots: 8, isFull: false, urgencyStatus: 'available' },
  { _id: 'slot_5', slotLabel: '12:30 PM - 12:45 PM', maxCapacity: 30, bookedCount: 27, availableSpots: 3, isFull: false, urgencyStatus: 'filling-fast' },
  { _id: 'slot_6', slotLabel: '12:45 PM - 01:00 PM', maxCapacity: 25, bookedCount: 12, availableSpots: 13, isFull: false, urgencyStatus: 'available' },
  { _id: 'slot_7', slotLabel: '01:00 PM - 01:15 PM', maxCapacity: 25, bookedCount: 23, availableSpots: 2, isFull: false, urgencyStatus: 'filling-fast' },
  { _id: 'slot_8', slotLabel: '01:15 PM - 01:30 PM', maxCapacity: 20, bookedCount: 20, availableSpots: 0, isFull: true, urgencyStatus: 'full' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isStaff } = useAuth();

  useEffect(() => {
    if (isStaff) {
      navigate('/staff-dashboard', { replace: true });
    }
  }, [isStaff, navigate]);

  const {
    cartItems,
    cartTotal,
    taxAmount,
    packagingFee,
    grandTotal,
    totalItemCount,
    selectedSlot,
    setSelectedSlot,
    clearCart,
  } = useCart();

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState(null);

  // Payment Modal & Flow State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'wallet' | 'upi' | 'card'
  const [processingState, setProcessingState] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [processingStepText, setProcessingStepText] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Student Info Details
  const [studentName, setStudentName] = useState('Riya Sharma');
  const [rollNumber, setRollNumber] = useState('CS2026-042');

  // Fetch available slots from backend with resilient fallback
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await axiosInstance.get('/slots');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSlots(res.data);
          if (!selectedSlot) {
            const firstAvailable = res.data.find((s) => !s.isFull && s.availableSpots > 0);
            if (firstAvailable) setSelectedSlot(firstAvailable);
          }
        } else {
          setSlots(FALLBACK_SLOTS);
          if (!selectedSlot) setSelectedSlot(FALLBACK_SLOTS[0]);
        }
      } catch (err) {
        console.warn('Backend slots unavailable, using offline fallback:', err.message);
        setSlots(FALLBACK_SLOTS);
        if (!selectedSlot) setSelectedSlot(FALLBACK_SLOTS[0]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, []);

  // Handle slot selection with validation
  const handleSelectSlot = (slot) => {
    if (slot.isFull || slot.availableSpots <= 0) {
      setSlotError('This slot is fully booked. Please select another 15-minute window.');
      return;
    }
    setSlotError(null);
    setSelectedSlot(slot);
  };

  // Trigger Mock Payment & Order Creation Simulation
  const handleProcessPayment = async () => {
    if (!selectedSlot) {
      setSlotError('Please choose a pickup slot before paying.');
      return;
    }

    setProcessingState('processing');
    setProcessingStepText('Connecting to Campus Payment Gateway...');

    // 1.5-second realistic simulated processing steps
    setTimeout(() => {
      setProcessingStepText(`Processing ₹${grandTotal} via ${paymentMethod.toUpperCase()}...`);
    }, 600);

    setTimeout(() => {
      setProcessingStepText(`Securing counter slot: ${selectedSlot.slotLabel}...`);
    }, 1100);

    setTimeout(async () => {
      let createdOrderData = null;

      try {
        // Attempt backend POST /api/orders
        const orderPayload = {
          timeSlotId: selectedSlot._id,
          items: cartItems.map((item) => ({
            menuItemId: item._id,
            name: item.name,
            quantity: item.quantity || 1,
            price: item.price,
          })),
          totalAmount: grandTotal,
          paymentStatus: 'Completed',
          paymentMethod,
          studentName,
          rollNumber,
        };

        const res = await axiosInstance.post('/orders', orderPayload);
        if (res.data && res.data.pickupToken) {
          createdOrderData = res.data;
        }
      } catch (err) {
        console.warn('Backend /api/orders unavailable, creating resilient local order:', err.message);
      }

      // Generate realistic daily pickup token (e.g. CB-248) if backend is still in scaffolding
      if (!createdOrderData) {
        const randomNum = Math.floor(100 + Math.random() * 900);
        createdOrderData = {
          _id: `order_${Date.now()}`,
          pickupToken: `CB-${randomNum}`,
          orderStatus: 'Placed',
          paymentStatus: 'Completed',
          totalAmount: grandTotal,
          slotLabel: selectedSlot.slotLabel,
          timeSlotId: selectedSlot._id,
          items: cartItems,
          studentName,
          rollNumber,
          createdAt: new Date().toISOString(),
        };
      } else {
        createdOrderData.slotLabel = selectedSlot.slotLabel;
      }

      // Save latest order in localStorage for OrderTrackingPage & ProfileHistory integration
      try {
        localStorage.setItem('campusbite_latest_order', JSON.stringify(createdOrderData));
        const pastOrders = JSON.parse(localStorage.getItem('campusbite_past_orders') || '[]');
        pastOrders.unshift(createdOrderData);
        localStorage.setItem('campusbite_past_orders', JSON.stringify(pastOrders.slice(0, 10)));
      } catch (e) {
        console.warn('Failed saving order history locally:', e);
      }

      setConfirmedOrder(createdOrderData);
      setProcessingState('success');
      clearCart();
    }, 1500);
  };

  // If cart is empty and not in confirmed state, render empty prompt
  if (cartItems.length === 0 && !confirmedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-xl">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-4 border border-orange-100">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Tray is Empty</h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Please select at least one item from the canteen menu before scheduling a pickup slot.
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover:from-orange-700 hover:to-amber-700 transition"
          >
            <span>Explore Canteen Menu</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Breadcrumb & Title */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Campus Ordering</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-3">Schedule Pickup & Checkout</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a 15-minute counter pickup slot to avoid canteen queues during rush hours
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Time Slot Selection & Delivery Instructions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Slot Picker Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Select Pickup Time Slot</h2>
                    <p className="text-xs text-gray-500">15-minute managed canteen counter windows</p>
                  </div>
                </div>

                <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-medium hidden sm:block">
                  Today&apos;s Slots
                </div>
              </div>

              {slotError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{slotError}</span>
                </div>
              )}

              {loadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mb-2" />
                  <p className="text-xs">Checking live counter capacity...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?._id === slot._id;
                    const isFull = slot.isFull || slot.availableSpots <= 0;
                    const isFillingFast = slot.urgencyStatus === 'filling-fast' || (slot.availableSpots <= 5 && !isFull);

                    return (
                      <div
                        key={slot._id}
                        onClick={() => handleSelectSlot(slot)}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500 shadow-md shadow-orange-500/10'
                            : isFull
                            ? 'border-gray-200 bg-gray-100/70 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock
                              className={`w-4 h-4 ${
                                isSelected ? 'text-orange-600' : isFull ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? 'text-orange-900' : isFull ? 'text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {slot.slotLabel}
                            </span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                          )}
                        </div>

                        {/* Capacity Metric Pill */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          {isFull ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-md">
                              Slot Full
                            </span>
                          ) : isFillingFast ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>{slot.availableSpots} spots left!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <Users className="w-3 h-3 text-emerald-500" />
                              <span>{slot.availableSpots} spots open</span>
                            </span>
                          )}

                          <span className="text-[11px] text-gray-400 font-medium">
                            Cap: {slot.maxCapacity || 25}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Student Instructions Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/80 rounded-3xl p-5 flex items-start space-x-3.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">How Express Counter Pickup Works:</p>
                <p className="text-amber-800/90 leading-relaxed">
                  Upon payment confirmation, a unique <strong>4-digit Pickup Token (e.g. CB-104)</strong> will be generated. Simply show your token badge at the counter during your reserved time slot to receive your hot, freshly packed meal!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Payment Button (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-base font-bold text-gray-900">Tray Summary</h2>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-gray-800 font-medium truncate">{item.name}</span>
                      <span className="text-gray-400 font-semibold">×{item.quantity || 1}</span>
                    </div>
                    <span className="font-bold text-gray-900 ml-2">
                      ₹{item.price * (item.quantity || 1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected Slot Confirmation Badge */}
              <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-orange-900">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                      Reserved Pickup Window
                    </span>
                    <span className="font-bold text-gray-900">
                      {selectedSlot ? selectedSlot.slotLabel : 'Select a slot on the left'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Math */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>5% Canteen GST</span>
                  <span className="font-semibold text-gray-900">₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tray & Eco-Packaging</span>
                  <span className="font-semibold text-gray-900">₹{packagingFee}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between text-base font-black text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-orange-600">₹{grandTotal}</span>
                </div>
              </div>

              {/* Open Payment Modal Button */}
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={!selectedSlot || selectedSlot.isFull}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  !selectedSlot || selectedSlot.isFull
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-500/25'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Select Payment Method (₹{grandTotal})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Mock Payment Modal                                            */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => processingState !== 'processing' && setIsPaymentModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 z-10 transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Campus Checkout</h3>
                  <p className="text-xs text-orange-100">Slot: {selectedSlot?.slotLabel}</p>
                </div>
              </div>

              {processingState !== 'processing' && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {processingState === 'processing' ? (
                // 1.5s Processing Spinner Screen
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                    <Sparkles className="w-6 h-6 text-orange-500 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Processing Payment...</h4>
                    <p className="text-xs text-orange-600 font-semibold mt-1 animate-pulse">
                      {processingStepText}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 max-w-xs">
                    Please do not close or refresh your browser while the canteen order token is being generated.
                  </p>
                </div>
              ) : processingState === 'success' && confirmedOrder ? (
                // Order Confirmed Success Screen with Token Badge
                <div className="py-4 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Payment Successful & Slot Reserved
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mt-2">Order Confirmed!</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Present this digital token at the express pickup counter
                    </p>
                  </div>

                  {/* High Impact Digital Pickup Token Badge */}
                  <div className="p-5 bg-gradient-to-b from-orange-50 to-amber-50/60 border-2 border-dashed border-orange-300 rounded-3xl relative overflow-hidden">
                    <div className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                      Digital Pickup Token
                    </div>
                    <div className="text-4xl font-black text-gray-900 tracking-tight my-2 font-mono">
                      {confirmedOrder.pickupToken}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded-xl shadow-xs border border-orange-200">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      <span>{confirmedOrder.slotLabel}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3">
                      Canteen Counter 2 • Hot Meals & Quick Snacks
                    </p>
                  </div>

                  {/* Action Navigation Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        navigate('/order-tracking');
                      }}
                      className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
                    >
                      <span>Track Order</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        navigate('/menu');
                      }}
                      className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                      Back to Menu
                    </button>
                  </div>
                </div>
              ) : (
                // Payment Method Selector Form
                <div className="space-y-5">
                  {/* Student Details Review */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Student Name</span>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="font-bold text-gray-900 bg-transparent outline-none w-full border-b border-transparent focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block">Roll / Staff ID</span>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        className="font-bold text-gray-900 bg-transparent outline-none w-full border-b border-transparent focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-2.5">
                      Select Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* UPI QR Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'upi'
                            ? 'border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-500 shadow-xs'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-orange-600" />
                        <span className="text-xs font-bold">UPI QR</span>
                      </button>

                      {/* Campus Wallet Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'wallet'
                            ? 'border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-500 shadow-xs'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold">Campus Wallet</span>
                      </button>

                      {/* Card Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                          paymentMethod === 'card'
                            ? 'border-orange-500 bg-orange-50/70 text-orange-900 ring-2 ring-orange-500 shadow-xs'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-bold">Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Details for Selected Payment Mode */}
                  {paymentMethod === 'upi' && (
                    <div className="p-4 bg-orange-50/40 border border-orange-200 rounded-2xl flex flex-col items-center text-center space-y-3">
                      <div className="w-36 h-36 bg-white p-2.5 rounded-2xl border-2 border-orange-200 shadow-xs flex items-center justify-center">
                        {/* Simulated QR Code Graphics */}
                        <div className="w-full h-full bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white text-[10px] p-2 leading-tight font-mono">
                          <QrCode className="w-12 h-12 text-white mb-1" />
                          <span>SCAN & PAY</span>
                          <span className="text-amber-400 font-bold">₹{grandTotal}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-800">canteen@campusbite.upi</span>
                        <p className="text-[11px] text-gray-500">
                          Supports GPay, PhonePe, Paytm, and BHIM
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-900">Student Wallet Balance:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">₹550.00</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-800/80">
                        <span>Deduction for this meal:</span>
                        <span className="font-bold text-gray-900">- ₹{grandTotal}.00</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-2 flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Balance after payment:</span>
                        <span>₹{550 - grandTotal}.00</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                      <div>
                        <span className="text-gray-500 block mb-1 text-[11px]">Card Number</span>
                        <input
                          type="text"
                          readOnly
                          value="•••• •••• •••• 4242"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-mono font-bold text-gray-700"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500 block mb-1 text-[11px]">Valid Thru</span>
                          <input
                            type="text"
                            readOnly
                            value="12/28"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-700"
                          />
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1 text-[11px]">CVV</span>
                          <input
                            type="password"
                            readOnly
                            value="•••"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handleProcessPayment}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <span>Pay ₹{grandTotal} & Confirm Pickup Slot</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;


