"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ClipboardList,
  Package,
  Wrench,
  ChevronLeft,
  LogOut,
  User,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Work Orders",
    href: "/dashboard/workorders",
    icon: ClipboardList,
  },
  {
    title: "Quotes",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Materials",
    href: "/dashboard/materials",
    icon: Package,
  },
  {
    title: "Technicians",
    href: "/dashboard/technicians",
    icon: Wrench,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Get current page title based on pathname
  const currentPage =
    menuItems.find((item) => pathname?.startsWith(item.href))?.title ||
    "Dashboard";

  useEffect(() => {
    // Restore collapsed state from localStorage (if available)
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch (_) {
      // no-op: localStorage might be unavailable
    }

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        // Extract name from email (before @) or use user metadata
        const name =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    // Persist collapsed state
    try {
      localStorage.setItem("sidebarCollapsed", String(collapsed));
    } catch (_) {
      // ignore write errors
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header with Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4 transition-all",
          collapsed ? "justify-center px-2" : "gap-2"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <span className="text-base font-bold">M1</span>
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold">{currentPage}</span>
        )}
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 pt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - User */}
      <div className="border-t p-3 space-y-2">
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full hover:bg-accent",
                collapsed ? "h-10 w-10 p-0" : "justify-start gap-3 px-3"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="/avatars/user.jpg" alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName
                    ? userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left">
                  <p className="text-sm font-medium leading-none">
                    {userName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {userEmail || "user@example.com"}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align={collapsed ? "end" : "start"}
            side="right"
            sideOffset={collapsed ? 5 : 0}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userName || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
