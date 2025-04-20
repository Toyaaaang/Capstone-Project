'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen justify-between bg-gray-100">
      {/* Header Section */}
      <main className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900">Warehouse Operations Management System</h1>
        <p className="text-lg text-gray-600 mt-4 max-w-2xl">
          A streamlined solution to manage stock tracking, procurement, and material requisitions efficiently. 
          Enhance warehouse operations with real-time data and process automation.
        </p>
        
        {/* Buttons */}
        <div className="mt-6 space-x-4">
          <Button className="px-6 py-3" onClick={() => router.push('/register')}>
            Get Started
          </Button>
          <Button variant="outline" className="px-6 py-3" onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </main>
      
      {/* Footer Section */}
      <footer className="bg-gray-900 text-white text-center py-4">
        <p>&copy; {new Date().getFullYear()} Capstone Project -- WOMS -- All rights reserved.</p>
      </footer>
    </div>
  );
}