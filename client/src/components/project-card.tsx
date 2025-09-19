import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    location?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  };
  expanded?: boolean;
}

export default function ProjectCard({ project, expanded = false }: ProjectCardProps) {
  const updatedAt = new Date(project.updatedAt);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer group"
      data-testid={`card-project-${project.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 
            className="font-medium text-foreground group-hover:text-primary transition-colors"
            data-testid={`text-project-name-${project.id}`}
          >
            {project.name}
          </h3>
          <Badge variant="secondary" className="text-xs">Active</Badge>
        </div>

        {expanded && project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {project.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              <span data-testid={`text-project-location-${project.id}`}>
                {project.location}
              </span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            <span data-testid={`text-project-updated-${project.id}`}>
              Updated {timeAgo}
            </span>
          </div>
        </div>

        {expanded && project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {expanded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Est. 450 m³</span>
            </div>
            <Button size="sm" variant="outline" data-testid={`button-view-project-${project.id}`}>
              View Details
            </Button>
          </div>
        ) : (
          <div className="text-right">
            <span 
              className="text-xs text-green-600 font-medium"
              data-testid={`text-project-volume-${project.id}`}
            >
              450 m³
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
