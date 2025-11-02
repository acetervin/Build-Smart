import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import EstimationForm from "@/components/estimation-form";
import ProjectCard from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Database, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery<{
    totalProjects: number;
    totalEstimates: number;
    totalVolume: number;
    costSavings: number;
    recentEstimates: any[];
    recentProjects: any[];
  }>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError as Error)) {
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
  }, [statsError, toast]);

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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                    Material Estimation Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Create precise Bill of Materials for concrete construction projects
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                  <Button variant="secondary" data-testid="button-import-project">
                    Import Project
                  </Button>
                  <Link href="/new-estimate">
                    <Button className="flex items-center space-x-2" data-testid="button-new-estimate">
                      <PlusCircle className="w-4 h-4" />
                      <span>New Estimate</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <StatsCards 
                stats={dashboardStats} 
                loading={statsLoading} 
              />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Estimation Form */}
                <div className="lg:col-span-2">
                  <EstimationForm />
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                  {/* Recent Projects */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {statsLoading ? (
                          <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-12 bg-muted rounded-lg"></div>
                              </div>
                            ))}
                          </div>
                        ) : dashboardStats?.recentProjects?.length ? (
                          dashboardStats.recentProjects.map((project: any) => (
                            <ProjectCard key={project.id} project={project} />
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
                            <Link href="/new-estimate">
                              <Button size="sm" variant="outline">
                                Create First Project
                              </Button>
                            </Link>
                          </div>
                        )}
                        
                        {/*dashboardStats.recentProjects?.length > 0 &&*/ (
                          <Link href ="/projects">
                            <Button variant="ghost" className="w-full text-primary hover:text-primary/80 font-medium" data-testid="button-view-all-projects">
                              View All Projects →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Tools */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Quick Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        data-testid="button-import-csv"
                      >
                        <FileText className="w-5 h-5 text-primary mr-3" />
                        <span className="text-sm font-medium">Import CSV Data</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        data-testid="button-material-database"
                      >
                        <Database className="w-5 h-5 text-primary mr-3" />
                        <span className="text-sm font-medium">Material Database</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        data-testid="button-cost-analysis"
                      >
                        <TrendingUp className="w-5 h-5 text-primary mr-3" />
                        <span className="text-sm font-medium">Cost Analysis</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
