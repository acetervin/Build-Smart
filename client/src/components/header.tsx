import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Search, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">ConstructAI</h1>
                  <p className="text-xs text-muted-foreground">Material Estimator</p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex relative">
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 w-64"
                data-testid="input-search-header"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"
                  }
                </p>
                <p className="text-xs text-muted-foreground">Site Engineer</p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer">
                  <span className="text-sm text-primary-foreground font-medium">
                    {getInitials(user?.firstName, user?.lastName)}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
