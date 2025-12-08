"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/auth";
import { 
  TruckIcon, 
  AlertCircle, 
  Settings, 
  Users, 
  Wifi, 
  LogOut, 
  Package,
  FileText,
  ChevronRight,
  LayoutDashboard,
  UserCog,
  Moon,
  Sun,
  Banknote
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarThemeToggle } from "@/components/theme-toggle";

interface DashboardSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role?.toUpperCase() === "ADMIN";
  
  const menuItems = [
    {
      title: "Dashboard",
      href: isAdmin ? "/dashboard/admin" : "/dashboard/direction",
      icon: LayoutDashboard,
      showForDirection: true,
    },
    {
      title: "Tours",
      href: "/dashboard/tours",
      icon: TruckIcon,
      showForDirection: true,
    },
    {
      title: "Conflits",
      href: "/dashboard/conflits",
      icon: AlertCircle,
      showForDirection: true,
    },
    {
      title: "Finance",
      href: "/dashboard/finance",
      icon: Banknote,
      showForDirection: true,
    },
    {
      title: "Chauffeurs",
      href: "/dashboard/chauffeurs",
      icon: UserCog,
      showForDirection: true,
    },
    {
      title: "Utilisateurs",
      href: "/dashboard/utilisateurs",
      icon: Users,
      showForDirection: false,
    },
    {
      title: "WiFi Sécurisé",
      href: "/dashboard/wifi",
      icon: Wifi,
      showForDirection: false,
    },
    {
      title: "Identifiants Test",
      href: "/dashboard/test-credentials",
      icon: FileText,
      showForDirection: false,
    },
  ].filter(item => isAdmin || item.showForDirection);

  const handleSignOut = async () => {
    const formData = new FormData();
    await fetch("/api/auth/sign-out", {
      method: "POST",
      body: formData,
    });
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">
                  {isAdmin ? "Admin Panel" : "Direction"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Gestion des Caisses
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Préférences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarThemeToggle />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{user.name || "User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    En ligne
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
