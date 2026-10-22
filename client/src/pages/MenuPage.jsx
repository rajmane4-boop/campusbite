import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Sparkles, Utensils, RefreshCw } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

// Fallback initial items for offline/standalone preview
const DEFAULT_MENU_FALLBACK = [
  {
    _id: '1',
    name: 'Crispy Samosa (2 pcs)',
    category: 'Snacks',
    price: 30,
    isVeg: true,
    isAvailable: true,
    prepTime: 5,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '2',
    name: 'Aloo Tikki Burger',
    category: 'Snacks',
    price: 60,
    isVeg: true,
    isAvailable: true,
    prepTime: 10,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '3',
    name: 'Veg Grilled Cheese Sandwich',
    category: 'Snacks',
    price: 70,
    isVeg: true,
    isAvailable: true,
    prepTime: 8,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '4',
    name: 'Chicken Roll',
    category: 'Snacks',
    price: 90,
    isVeg: false,
    isAvailable: true,
    prepTime: 12,
    imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '5',
    name: 'Special Veg Thali',
    category: 'Meals',
    price: 110,
    isVeg: true,
    isAvailable: true,
    prepTime: 15,
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '6',
    name: 'Paneer Butter Masala Combo',
    category: 'Meals',
    price: 130,
    isVeg: true,
    isAvailable: true,
    prepTime: 15,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '7',
    name: 'Chicken Biryani with Raita',
    category: 'Meals',
    price: 150,
    isVeg: false,
    isAvailable: true,
    prepTime: 12,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '8',
    name: 'Masala Chai',
    category: 'Beverages',
    price: 15,
    isVeg: true,
    isAvailable: true,
    prepTime: 3,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '9',
    name: 'Cold Coffee with Ice Cream',
    category: 'Beverages',
    price: 60,
    isVeg: true,
    isAvailable: true,
    prepTime: 5,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
  },
  {
    _id: '10',
    name: 'Fresh Mango Lassi',
    category: 'Beverages',
    price: 50,
    isVeg: true,
    isAvailable: false, // Demo out of stock
    prepTime: 5,
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=60',
  },
];

const categories = ['All', 'Snacks', 'Meals', 'Beverages'];

const MenuPage = () => {
  const { isStaff } = useAuth();
  const navigate = useNavigate();

  // Staff members should only manage the kitchen and stock, not place orders
  useEffect(() => {
    if (isStaff) {
      navigate('/staff-dashboard', { replace: true });
    }
  }, [isStaff, navigate]);

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch menu from backend API with fallback
  const fetchMenu = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (selectedCategory !== 'All') queryParams.push(`category=${selectedCategory}`);
      if (dietaryFilter === 'veg') queryParams.push('isVeg=true');
      if (dietaryFilter === 'non-veg') queryParams.push('isVeg=false');
      if (searchQuery.trim()) queryParams.push(`search=${encodeURIComponent(searchQuery.trim())}`);

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await axiosInstance.get(`/menu${queryString}`);

      if (Array.isArray(res.data) && res.data.length > 0) {
        setMenuItems(res.data);
      } else {
        // Filter fallback dataset locally if backend returns empty or isn't connected
        filterFallback();
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback menu data:', err.message);
      filterFallback();
    } finally {
      setLoading(false);
    }
  };

  const filterFallback = () => {
    let list = [...DEFAULT_MENU_FALLBACK];
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    if (dietaryFilter === 'veg') {
      list = list.filter((item) => item.isVeg === true);
    } else if (dietaryFilter === 'non-veg') {
      list = list.filter((item) => item.isVeg === false);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }
    setMenuItems(list);
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedCategory, dietaryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Canteen Food Catalog</h1>
            <p className="text-orange-100 text-sm mt-1">
              Select freshly prepared snacks, hearty meals, and refreshing beverages for instant pre-ordering
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Hot items ready in 5-15 mins</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Real-time Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by name (e.g. Samosa, Burger)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Toggle Switch */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold w-full md:w-auto justify-center">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  dietaryFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Diets
              </button>
              <button
                onClick={() => setDietaryFilter('veg')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Veg Only</span>
              </button>
              <button
                onClick={() => setDietaryFilter('non-veg')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  dietaryFilter === 'non-veg'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-red-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-300" />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-gray-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="ml-auto text-xs font-medium text-gray-400 pl-4 hidden sm:block">
              Showing {menuItems.length} items
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
              <p className="text-sm font-medium">Loading freshly prepared canteen catalog...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No food items found</h3>
              <p className="text-xs text-gray-500 mt-1">
                Try adjusting your search query or dietary filters
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setDietaryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <FoodCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
