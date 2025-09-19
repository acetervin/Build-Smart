import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Calculator, Database, DollarSign } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalProjects: number;
    totalEstimates: number;
    totalVolume: number;
    costSavings: number;
  };
  loading?: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      icon: FolderOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12%",
      changeText: "from last month",
      testId: "stat-total-projects"
    },
    {
      title: "Material Estimates",
      value: stats?.totalEstimates || 0,
      icon: Calculator,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+8%",
      changeText: "from last month",
      testId: "stat-material-estimates"
    },
    {
      title: "Concrete Volume",
      value: `${stats?.totalVolume || 0} m³`,
      icon: Database,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      change: "+23%",
      changeText: "from last month",
      testId: "stat-concrete-volume"
    },
    {
      title: "Cost Savings",
      value: `$${(stats?.costSavings || 0).toLocaleString()}`,
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+15%",
      changeText: "from last month",
      testId: "stat-cost-savings"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p 
                  className="text-2xl font-bold text-foreground" 
                  data-testid={card.testId}
                >
                  {loading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-green-600">{card.change}</span>
              <span className="text-sm text-muted-foreground ml-2">{card.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
