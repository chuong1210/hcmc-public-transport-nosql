"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Route,
  Navigation,
  Search,
  BarChart3,
  Settings,
  LogOut,
  Bus,
  Calendar,
  Car,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  roles: ("admin" | "manager" | "user")[];
}

const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["admin", "manager", "user"],
  },
  {
    title: "Quản lý Trạm",
    icon: MapPin,
    href: "/dashboard/stations",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý Tuyến",
    icon: Route,
    href: "/dashboard/routes",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý Xe",
    icon: Car,
    href: "/dashboard/vehicles",
    roles: ["admin", "manager"],
  },
  {
    title: "Lịch trình",
    icon: Calendar,
    href: "/dashboard/schedules",
    roles: ["admin", "manager"],
  },
  {
    title: "Tìm lộ trình",
    icon: Navigation,
    href: "/dashboard/journey",
    roles: ["admin", "manager", "user"],
  },
  {
    title: "Truy vấn",
    icon: Search,
    href: "/dashboard/query",
    roles: ["admin", "manager"],
  },
  {
    title: "Thống kê",
    icon: BarChart3,
    href: "/dashboard/analytics",
    roles: ["admin", "manager"],
  },
  {
    title: "Quản lý User",
    icon: Users,
    href: "/dashboard/users",
    roles: ["admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  // Filter menu items based on user role
  const allowedMenuItems = allMenuItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // FIX: Improved active state detection
  const isMenuActive = (itemHref: string) => {
    // Exact match for dashboard
    if (itemHref === "/dashboard") {
      return pathname === "/dashboard";
    }

    // For other routes, check if pathname starts with the href
    return pathname?.startsWith(itemHref);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-64 items-center justify-center bg-linear-to-br from-sky-50 via-cyan-50 to-blue-50 border-r border-sky-200/50 shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-linear-to-br from-white via-sky-50/30 to-cyan-50/30 border-r border-sky-200/50 shadow-xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sky-200/50 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30">
          <Bus className="h-6 w-6 text-white" />
        </div>
        <span className="ml-3 text-xl font-bold linear-text-ocean">
          Bus Manager
        </span>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-4 border-b border-sky-200/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-br from-white to-sky-50 border border-sky-200/50 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-sky-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/30">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-sky-600 font-medium capitalize">
                {user.role === "admin"
                  ? "Quản trị viên"
                  : user.role === "manager"
                  ? "Quản lý"
                  : "Người dùng"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuActive(item.href); // FIX: Use improved detection

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 scale-105"
                  : "text-gray-700 hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50 hover:text-sky-700 hover:scale-102"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive
                    ? "drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]"
                    : "group-hover:scale-110"
                )}
              />
              <span
                className={cn(
                  "font-medium",
                  isActive && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                )}
              >
                {item.title}
              </span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-lg animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sky-200/50" />

      {/* Settings & Logout */}
      <div className="space-y-1 p-3 bg-linear-to-br from-white to-sky-50/30">
        {user?.role === "admin" && (
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
              pathname === "/dashboard/settings"
                ? "bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30"
                : "text-gray-700 hover:bg-linear-to-r hover:from-sky-50 hover:to-cyan-50 hover:text-sky-700"
            )}
          >
            <Settings className="h-5 w-5" />
            Cài đặt
          </Link>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-gray-700 hover:bg-linear-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
