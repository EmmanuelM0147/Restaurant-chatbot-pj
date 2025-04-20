import { MenuItem } from '../types';

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Jollof Rice',
    price: 2000,
    description: 'Spicy and flavorful Nigerian Jollof rice',
    category: 'Main Dishes'
  },
  {
    id: 2,
    name: 'Fried Rice',
    price: 1800,
    description: 'Nigerian-style fried rice with mixed vegetables',
    category: 'Main Dishes'
  },
  {
    id: 3,
    name: 'Chicken',
    price: 1500,
    description: 'Grilled or fried chicken',
    category: 'Proteins'
  },
  {
    id: 4,
    name: 'Beef Suya',
    price: 2000,
    description: 'Spicy grilled beef with traditional suya spices',
    category: 'Proteins'
  },
  {
    id: 5,
    name: 'Moi Moi',
    price: 800,
    description: 'Steamed bean pudding with vegetables',
    category: 'Sides'
  },
  {
    id: 6,
    name: 'Plantain',
    price: 500,
    description: 'Fried sweet plantains',
    category: 'Sides'
  },
  {
    id: 7,
    name: 'Chapman',
    price: 700,
    description: 'Nigerian cocktail drink',
    category: 'Beverages'
  },
  {
    id: 8,
    name: 'Zobo',
    price: 500,
    description: 'Hibiscus drink',
    category: 'Beverages'
  }
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Cache menu items in localStorage
export const cacheMenuItems = (): void => {
  localStorage.setItem('menuItems', JSON.stringify(menuItems));
  localStorage.setItem('menuLastUpdated', new Date().toISOString());
};

// Get cached menu items
export const getCachedMenuItems = (): MenuItem[] | null => {
  const cached = localStorage.getItem('menuItems');
  const lastUpdated = localStorage.getItem('menuLastUpdated');
  
  if (!cached || !lastUpdated) return null;
  
  // Check if cache is older than 1 hour
  const cacheAge = Date.now() - new Date(lastUpdated).getTime();
  if (cacheAge > 3600000) return null;
  
  return JSON.parse(cached);
};

// Get menu items with cache fallback
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const cached = getCachedMenuItems();
  if (cached) return cached;
  
  // In a real app, we would fetch from API here
  cacheMenuItems();
  return menuItems;
};