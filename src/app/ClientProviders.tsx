"use client";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotificationHandler from "@/components/NotificationHandler";
import UpdateBanner from "@/components/UpdateBanner";

const NetworkStatusProvider = dynamic(
  () => import("@/context/NetworkStatusContext").then(mod => mod.NetworkStatusProvider),
  { ssr: false }
);

const ThemeProvider = dynamic(
  () => import("@/context/ThemeContext").then(mod => mod.ThemeProvider),
  { ssr: false }
);

const UpdateProvider = dynamic(
  () => import("@/context/UpdateContext").then(mod => mod.UpdateProvider),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("react-hot-toast").then(mod => mod.Toaster),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkStatusProvider>
          <UpdateProvider>
            <>
              <UpdateBanner />
              <NotificationHandler />
              {children}
              <Toaster position="bottom-center" />
            </>
          </UpdateProvider>
        </NetworkStatusProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
