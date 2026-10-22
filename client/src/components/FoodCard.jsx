// [Pushkar] FoodCard.jsx - Individual menu item card with "Add" button and stock status
import React from 'react';
import { Plus, Minus, Clock, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const FoodCard = ({ item }) => {
  const { isStaff } = useAuth();
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((i) => i._id === item._id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        item.isAvailable
          ? 'border-gray-200/80 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5'
          : 'border-gray-200 opacity-60 grayscale'
      }`}
    >
      <div>
        {/* Image Container */}
        <div className="relative h-44 w-full overflow-hidden bg-gray-100">
          <img
            src={
              item.imageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
            }
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Dietary Badge (Veg / Non-Veg) */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className={item.isVeg ? 'text-emerald-700' : 'text-red-700'}>
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Prep Time Pill */}
          {item.prepTime && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>{item.prepTime}m</span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="p-4">
          <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">
            {item.category}
          </div>
          <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
        <div>
          <span className="text-xs text-gray-500">Price</span>
          <div className="text-lg font-extrabold text-gray-900">₹{item.price}</div>
        </div>

        <div>
          {isStaff ? (
            <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200">
              Staff View
            </span>
          ) : !item.isAvailable ? (
            <button
              disabled
              className="px-3.5 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg p-1">
              <button
                onClick={() => updateQuantity(item._id, -1)}
                className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-orange-600 hover:bg-orange-100 transition shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm text-orange-800 px-1">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(item._id, 1)}
                className="w-7 h-7 flex items-center justify-center bg-orange-600 text-white rounded-md hover:bg-orange-700 transition shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
