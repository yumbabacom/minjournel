'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AMTradePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview by default
    router.push('/am-trade/overview');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
    </div>
  );
}
