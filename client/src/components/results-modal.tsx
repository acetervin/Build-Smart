import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Save, X } from "lucide-react";
import type { EstimationResult } from "@shared/schema";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: EstimationResult | null;
  projectName: string;
  location?: string;
  currency?: string;
}

export default function ResultsModal({
  isOpen,
  onClose,
  results,
  projectName,
  location,
  currency = "$",
}: ResultsModalProps) {
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  // Export mutations
  const exportMutation = useMutation({
    mutationFn: async ({ format }: { format: string }) => {
      if (!results) throw new Error("No results to export");
      
      setExportLoading(format);
      
      const response = await apiRequest("POST", `/api/v1/estimate/export/${format}`, {
        results,
        projectName,
        location,
      });

      // Handle different response types
      if (format === 'json') {
        return await response.json();
      } else {
        return await response.text();
      }
    },
    onSuccess: (data, variables) => {
      const { format } = variables;
      
      if (format === 'json') {
        // Download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-zA-Z0-9-_]/g, '_')}_BoM_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Download CSV file
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-zA-Z0-9-_]/g, '_')}_BoM_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Open PDF in new window
        const blob = new Blob([data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export Successful",
        description: `BoM exported as ${format.toUpperCase()} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export BoM",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setExportLoading(null);
    },
  });

  const handleExport = (format: string) => {
    exportMutation.mutate({ format });
  };

  const handleSaveProject = () => {
    // TODO: Implement save to project functionality
    toast({
      title: "Save Project",
      description: "Project saving functionality will be implemented",
    });
  };

  const handleShareLink = () => {
    // TODO: Implement share link functionality
    toast({
      title: "Share Link",
      description: "Share link functionality will be implemented",
    });
  };

  if (!results) return null;

  const formatNumber = (num: number) => num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatCurrency = (num: number) => `${currency}${formatNumber(num)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Bill of Materials (BoM)
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="button-close-results"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[70vh] space-y-6">
          {/* Project Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium" data-testid="text-project-name-result">
                    {projectName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-medium" data-testid="text-volume-result">
                    {results.parameters.volumeM3} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mix Ratio</p>
                  <p className="font-medium" data-testid="text-mix-ratio-result">
                    {results.parameters.mixRatio.cement}:{results.parameters.mixRatio.sand}:{results.parameters.mixRatio.agg}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium" data-testid="text-location-result">
                    {location || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Requirements Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-foreground">Material</th>
                    <th className="text-right p-4 text-sm font-medium text-foreground">Volume (m³)</th>
                    <th className="text-right p-4 text-sm font-medium text-foreground">Mass (kg)</th>
                    <th className="text-right p-4 text-sm font-medium text-foreground">Units</th>
                    <th className="text-right p-4 text-sm font-medium text-foreground">Cost Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border" data-testid="row-cement-result">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">Portland Cement</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-cement-volume">
                      {formatNumber(results.cement.volume)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-cement-mass">
                      {formatNumber(results.cement.mass)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-cement-units">
                      {results.cement.bags} bags (50kg)
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-green-600" data-testid="text-cement-cost">
                      {formatCurrency(results.cement.bags! * 760)}
                    </td>
                  </tr>
                  <tr className="border-t border-border" data-testid="row-sand-result">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-medium">Fine Sand</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-sand-volume">
                      {formatNumber(results.sand.volume)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-sand-mass">
                      {formatNumber(results.sand.mass)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-sand-units">
                      {formatNumber(results.sand.tonnes)} tonnes
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-green-600" data-testid="text-sand-cost">
                      {formatCurrency(results.sand.tonnes * 50)}
                    </td>
                  </tr>
                  <tr className="border-t border-border" data-testid="row-aggregate-result">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="font-medium">Coarse Aggregate</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-aggregate-volume">
                      {formatNumber(results.aggregate.volume)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-aggregate-mass">
                      {formatNumber(results.aggregate.mass)}
                    </td>
                    <td className="p-4 text-right text-sm" data-testid="text-aggregate-units">
                      {formatNumber(results.aggregate.tonnes)} tonnes
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-green-600" data-testid="text-aggregate-cost">
                      {formatCurrency(results.aggregate.tonnes * 35)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted">
                  <tr data-testid="row-total-result">
                    <td className="p-4 font-semibold">TOTAL</td>
                    <td className="p-4 text-right font-semibold" data-testid="text-total-volume">
                      {formatNumber(results.totals.volume)}
                    </td>
                    <td className="p-4 text-right font-semibold" data-testid="text-total-mass">
                      {formatNumber(results.totals.mass)}
                    </td>
                    <td className="p-4 text-right font-semibold">Mixed Units</td>
                    <td className="p-4 text-right font-semibold text-green-600" data-testid="text-total-cost">
                      {formatCurrency(results.totals.estimatedCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Parameters Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Calculation Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Dry Factor:</span>
                  <span className="ml-2 font-medium">{results.parameters.dryFactor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Wastage:</span>
                  <span className="ml-2 font-medium">{results.parameters.wastageFactor}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cement Density:</span>
                  <span className="ml-2 font-medium">{results.parameters.densities.cement} kg/m³</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Report ID:</span>
                  <span className="ml-2 font-medium">EST-{Date.now()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            onClick={handleSaveProject}
            className="flex-1"
            data-testid="button-save-to-project"
          >
            <Save className="w-4 h-4 mr-2" />
            Save to Project
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={exportLoading === 'csv'}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading === 'csv' ? 'Exporting...' : 'Export CSV'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleExport('pdf')}
            disabled={exportLoading === 'pdf'}
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleExport('json')}
            disabled={exportLoading === 'json'}
            data-testid="button-export-json"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading === 'json' ? 'Exporting...' : 'Export JSON'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShareLink}
            data-testid="button-share-link"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
