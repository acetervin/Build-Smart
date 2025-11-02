import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { estimateMaterials, validateEstimationInput, getPresetMixRatios, DEFAULT_DENSITIES } from "@/lib/estimator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResultsModal from "./results-modal";
import type { EstimationResult } from "@shared/schema";

const estimationSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  location: z.string().optional(),
  volumeM3: z.number().positive("Volume must be positive").min(0.01, "Minimum volume is 0.01 m³"),
  concreteClass: z.string().default("C20/25"),
  cementRatio: z.number().positive("Cement ratio must be positive"),
  sandRatio: z.number().positive("Sand ratio must be positive"),
  aggRatio: z.number().positive("Aggregate ratio must be positive"),
  cementDensity: z.number().positive("Cement density must be positive"),
  sandDensity: z.number().positive("Sand density must be positive"),
  aggDensity: z.number().positive("Aggregate density must be positive"),
  dryFactor: z.number().positive().max(3),
  wastageFactor: z.number().min(0).max(50),
});

type EstimationFormData = z.infer<typeof estimationSchema>;

interface EstimationFormProps {
  fullWidth?: boolean;
  demoMode?: boolean;
  fixedConcreteClass?: string;
  fixedVolume?: number;
  currency?: string;
}

export default function EstimationForm({
  fullWidth = false,
  demoMode = false,
  fixedConcreteClass,
  fixedVolume,
  currency = "$"
}: EstimationFormProps) {
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [calculationResults, setCalculationResults] = useState<EstimationResult | null>(null);
  const [realtimeResults, setRealtimeResults] = useState<EstimationResult | null>(null);

  const form = useForm<EstimationFormData>({
    resolver: zodResolver(estimationSchema),
    defaultValues: {
      projectName: demoMode ? "Demo Project" : "",
      location: demoMode ? "Nairobi, Kenya" : "",
      volumeM3: fixedVolume || 100,
      concreteClass: fixedConcreteClass || "C20/25",
      cementRatio: 1,
      sandRatio: 2,
      aggRatio: 4,
      cementDensity: DEFAULT_DENSITIES.cement,
      sandDensity: DEFAULT_DENSITIES.sand,
      aggDensity: DEFAULT_DENSITIES.agg,
      dryFactor: 1.54,
      wastageFactor: 5,
    },
  });

  // Watch form values for real-time calculation
  const watchedValues = form.watch();

  // Fetch material presets
  const { data: presets } = useQuery({
    queryKey: ["/api/materials/presets"],
    retry: false,
  });

  // Calculate materials mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: EstimationFormData) => {
      const input = {
        volumeM3: data.volumeM3,
        mixRatio: {
          cement: data.cementRatio,
          sand: data.sandRatio,
          agg: data.aggRatio,
        },
        densities: {
          cement: data.cementDensity,
          sand: data.sandDensity,
          agg: data.aggDensity,
        },
        dryFactor: data.dryFactor,
        wastageFactor: data.wastageFactor,
      };

      const response = await apiRequest("POST", "/api/v1/estimate", input);
      return response.json();
    },
    onSuccess: (data) => {
      setCalculationResults(data.results);
      setShowResults(true);
      toast({
        title: "Calculation Complete",
        description: "Material estimate has been generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Failed to calculate materials",
        variant: "destructive",
      });
    },
  });

  // Real-time calculation effect (client-side preview)
  useEffect(() => {
    const {
      volumeM3,
      cementRatio,
      sandRatio,
      aggRatio,
      cementDensity,
      sandDensity,
      aggDensity,
      dryFactor,
      wastageFactor
    } = watchedValues;

    // Only calculate if we have valid inputs
    if (volumeM3 > 0 && cementRatio > 0 && sandRatio > 0 && aggRatio > 0) {
      try {
        const input = {
          volumeM3,
          mixRatio: { cement: cementRatio, sand: sandRatio, agg: aggRatio },
          densities: { cement: cementDensity, sand: sandDensity, agg: aggDensity },
          dryFactor,
          wastageFactor,
        };

        const results = estimateMaterials(input);
        setRealtimeResults(results);
      } catch (error) {
        setRealtimeResults(null);
      }
    } else {
      setRealtimeResults(null);
    }
  }, [watchedValues]);

  // Handle concrete class preset selection
  const handleConcreteClassChange = (value: string) => {
    form.setValue("concreteClass", value);

    if (presets?.mixRatios && presets.mixRatios[value]) {
      const ratio = presets.mixRatios[value];
      form.setValue("cementRatio", ratio.cement);
      form.setValue("sandRatio", ratio.sand);
      form.setValue("aggRatio", ratio.agg);
    }
  };

  const onSubmit = (data: EstimationFormData) => {
    // Validate inputs
    const validationErrors = validateEstimationInput({
      volumeM3: data.volumeM3,
      mixRatio: {
        cement: data.cementRatio,
        sand: data.sandRatio,
        agg: data.aggRatio,
      },
      densities: {
        cement: data.cementDensity,
        sand: data.sandDensity,
        agg: data.aggDensity,
      },
      dryFactor: data.dryFactor,
      wastageFactor: data.wastageFactor,
    });

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    calculateMutation.mutate(data);
  };

  return (
    <>
      <Card className={fullWidth ? "w-full" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>New Material Estimate</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate precise quantities for concrete materials
          </p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="High-rise Foundation Block A"
                          {...field}
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Construction Site, Downtown"
                          {...field}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Concrete Specifications */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Concrete Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="volumeM3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concrete Volume (m³) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="100.0"
                            disabled={demoMode}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-volume"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="concreteClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concrete Class</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={handleConcreteClassChange}
                          disabled={demoMode}
                          data-testid="select-concrete-class"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="C20/25">C20/25 (Class 20)</SelectItem>
                            <SelectItem value="C25/30">C25/30 (Class 25)</SelectItem>
                            <SelectItem value="C30/37">C30/37 (Class 30)</SelectItem>
                            <SelectItem value="C35/45">C35/45 (Class 35)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Mix Ratio */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Mix Ratio (Parts)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cementRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cement</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-cement-ratio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sandRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sand</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-sand-ratio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aggRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aggregate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="4"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-aggregate-ratio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Material Densities */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Material Densities (kg/m³)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cementDensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cement Density</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1440"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-cement-density"
                          />
                        </FormControl>
                        <FormDescription>Default: 1440 kg/m³</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sandDensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sand Density</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1600"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-sand-density"
                          />
                        </FormControl>
                        <FormDescription>Default: 1600 kg/m³</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aggDensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aggregate Density</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1750"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-aggregate-density"
                          />
                        </FormControl>
                        <FormDescription>Default: 1750 kg/m³</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Adjustments */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Adjustments & Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dryFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dry Volume Factor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1.54"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-dry-factor"
                          />
                        </FormControl>
                        <FormDescription>Accounts for material bulking</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wastageFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wastage Factor (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            placeholder="5"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-wastage-factor"
                          />
                        </FormControl>
                        <FormDescription>Overall material wastage</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Real-time Preview */}
              {realtimeResults && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Preview:</strong> Cement: {realtimeResults.cement.bags} bags,
                    Sand: {realtimeResults.sand.tonnes}t,
                    Aggregate: {realtimeResults.aggregate.tonnes}t
                    (Total: {currency}{realtimeResults.totals.estimatedCost})
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={calculateMutation.isPending}
                  data-testid="button-calculate-materials"
                >
                  {calculateMutation.isPending ? "Calculating..." : "Calculate Materials"}
                </Button>
                <Button type="button" variant="secondary" data-testid="button-save-draft">
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  data-testid="button-reset"
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        results={calculationResults}
        projectName={form.getValues("projectName")}
        location={form.getValues("location")}
        currency={currency}
      />
    </>
  );
}
