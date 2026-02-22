"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md flex flex-col gap-4 text-center">
        <h1 className="text-base sm:text-base lg:text-2xl font-bold mb-4">Admin Panel</h1>
        <p className="text-gray-600 mb-6">Access administrative features</p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
