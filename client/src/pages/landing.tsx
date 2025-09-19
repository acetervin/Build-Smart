import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Building2, FileText, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/20">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                ConstructAI
              </h1>
            </div>
            <h2 className="text-xl lg:text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              AI-Powered Construction Material Estimator
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Generate precise Bill of Materials for concrete construction projects using advanced volumetric calculations. 
              Save time, reduce waste, and optimize material procurement with intelligent estimation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="px-8 py-3"
                data-testid="button-login"
              >
                Get Started - Sign In
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3"
                data-testid="button-demo"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Why Choose ConstructAI?
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for construction professionals who need accurate material estimates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 hover:shadow-md transition-shadow" data-testid="card-feature-precision">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Precision Calculations</h4>
            <p className="text-sm text-muted-foreground">
              Uses volumetric mix method with ±0.5% accuracy for concrete material estimation
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-md transition-shadow" data-testid="card-feature-projects">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Project Management</h4>
            <p className="text-sm text-muted-foreground">
              Organize estimates by project, save templates, and track material usage over time
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-md transition-shadow" data-testid="card-feature-exports">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Export & Share</h4>
            <p className="text-sm text-muted-foreground">
              Generate professional BoM reports in CSV, PDF, and JSON formats for easy sharing
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-md transition-shadow" data-testid="card-feature-optimization">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Cost Optimization</h4>
            <p className="text-sm text-muted-foreground">
              Built-in wastage factors and supplier pricing integration to minimize material costs
            </p>
          </Card>
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              How It Works
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 3-step process to generate accurate material estimates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold text-foreground mb-2">Input Parameters</h4>
              <p className="text-sm text-muted-foreground">
                Enter concrete volume, mix ratio, and material densities with helpful presets
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold text-foreground mb-2">Calculate Materials</h4>
              <p className="text-sm text-muted-foreground">
                AI processes your inputs using proven engineering formulas and industry standards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold text-foreground mb-2">Export & Use</h4>
              <p className="text-sm text-muted-foreground">
                Download professional BoM reports and share with suppliers and stakeholders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
          Ready to Optimize Your Material Estimation?
        </h3>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join construction professionals who trust ConstructAI for accurate, efficient material planning
        </p>
        <Button 
          size="lg" 
          onClick={handleLogin}
          className="px-8 py-3"
          data-testid="button-cta-login"
        >
          Start Your Free Estimate
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ConstructAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Serverless AI-powered material estimation for modern construction projects
          </p>
        </div>
      </footer>
    </div>
  );
}
