import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check the status of your Photon Merchants order.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
