"use client";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

const NetworkStatusProvider = dynamic(
  () => import("@/context/NetworkStatusContext").then(mod => mod.NetworkStatusProvider),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("react-hot-toast").then(mod => mod.Toaster),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NetworkStatusProvider>
        <>
          {children}
          <Toaster position="bottom-center" />
        </>
      </NetworkStatusProvider>
    </ErrorBoundary>
  );
}
