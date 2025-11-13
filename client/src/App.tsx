import React from "react";
import { Route,Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import MagicLogin from "@/pages/magic-login";
import Dashboard from "@/pages/dashboard";
import NewEstimate from "@/pages/new-estimate";
import Projects from "@/pages/projects";
import Reports from "@/pages/report";
import ReportsList from "@/pages/reports";
import Demo from "@/pages/demo";
import NotFound from "@/pages/not-found";

// Import the real useAuth hook
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/magic-login" component={MagicLogin} />
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/demo" component={Demo} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/new-estimate" component={NewEstimate} />
          <Route path="/reports" component={ReportsList} />
          <Route path="/report/:id" component={Reports} />
          {/* Add more public routes here */}
          
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/new-estimate" component={NewEstimate} />
          <Route path="/reports" component={ReportsList} />
          <Route path="/report/:id" component={Reports} />
          {/* Add more authenticated routes here */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
