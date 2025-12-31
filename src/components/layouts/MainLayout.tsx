import { Outlet } from "react-router-dom";
import { BottomNavBar } from "@/components/BottomNavBar";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <BottomNavBar />
    </div>
  );
}
