import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  FolderOpen,
  Database,
  FileText,
  Settings
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "New Estimate",
    href: "/new-estimate",
    icon: Calculator,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "Materials Database",
    href: "/materials",
    icon: Database,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border hidden lg:block">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href || 
            (item.href === "/" && location === "/dashboard");
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span className={cn("font-medium", isActive && "font-semibold")}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {/* Quick Stats */}
      <div className="p-4 mt-8">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Projects</span>
            <span className="text-sm font-medium" data-testid="stat-active-projects">--</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This Month</span>
            <span className="text-sm font-medium" data-testid="stat-monthly-estimates">--</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Saved</span>
            <span className="text-sm font-medium text-green-600" data-testid="stat-total-saved">--</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
