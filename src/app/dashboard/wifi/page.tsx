import { DashboardHeader } from "@/components/dashboard-header";
import { WiFiClient } from "./wifi-client";

export default function WiFiPage() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "WiFi Sécurisé" },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <WiFiClient />
      </div>
    </>
  );
}
