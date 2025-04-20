import React from 'react';
import { Utensils } from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">FoodChat</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <button className="text-gray-600 hover:text-primary transition-colors">
                  Order History
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-gray-100 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} FoodChat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};