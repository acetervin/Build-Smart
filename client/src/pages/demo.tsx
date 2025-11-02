import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import EstimationForm from "@/components/estimation-form";

export default function Demo() {
  const [, setLocation] = useLocation();

  const handleBackToHome = () => setLocation("/");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    ConstructAI Demo
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Try our material estimator - No account required
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Demo Mode</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Demo Notice */}
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Demo Mode</h3>
                  <p className="text-sm text-amber-700">
                    This is a demonstration of our AI-powered construction material estimator.
                    You can test all features including real-time calculations and export options.
                    Results are not saved - sign up for a free account to save your estimates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimation Form */}
          <EstimationForm
            fullWidth
            demoMode={true}
            fixedConcreteClass="C25/30"
            fixedVolume={50}
            currency="KSH"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ConstructAI</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ready to save your estimates and access advanced features?
          </p>
          <Button onClick={() => setLocation("/signup")} size="sm">
            Sign Up Free
          </Button>
        </div>
      </footer>
    </div>
  );
}
