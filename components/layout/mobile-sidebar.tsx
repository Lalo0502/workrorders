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
  Menu,
  Bell,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Work Orders",
    href: "/dashboard/workorders",
    icon: ClipboardList,
  },
  {
    title: "Materials",
    href: "/dashboard/materials",
    icon: Package,
  },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const name =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">M1</span>
            </div>
            <span className="text-lg font-semibold">Work Orders</span>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col space-y-1 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section - User Profile & Actions */}
        <div className="border-t p-3 space-y-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3"
            size="sm"
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                3
              </Badge>
            </div>
            <span className="text-sm font-medium">Notifications</span>
          </Button>

          <Separator />

          {/* User Info */}
          <div className="flex items-center gap-3 px-3">
            <Avatar className="h-9 w-9">
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
            <div className="flex flex-col">
              <p className="text-sm font-medium leading-none">
                {userName || "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {userEmail || "user@example.com"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-red-600 hover:text-red-600"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
