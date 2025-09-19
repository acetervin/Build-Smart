import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import EstimationForm from "@/components/estimation-form";

export default function NewEstimate() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="container mx-auto px-4 lg:px-6 py-6">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground" data-testid="text-new-estimate-title">
                  New Material Estimate
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create a detailed Bill of Materials for your construction project
                </p>
              </div>

              {/* Estimation Form */}
              <div className="max-w-4xl">
                <EstimationForm fullWidth />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
