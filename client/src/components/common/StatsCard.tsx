import { StatsData } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  data: StatsData;
  className?: string;
}

export default function StatsCard({ data, className }: StatsCardProps) {
  // Determine color class based on the color prop
  const getColorClass = () => {
    switch (data.color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'amber':
        return 'bg-amber-100 text-amber-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Format the change indicator
  const getChangeIndicator = () => {
    if (data.change === undefined) return null;
    
    const isPositive = data.change > 0;
    
    return (
      <span className={cn(
        "text-sm font-medium flex items-center",
        isPositive ? 'text-green-600' : 'text-red-600'
      )}>
        {isPositive ? <ArrowUp className="text-xs mr-1 h-3 w-3" /> : <ArrowDown className="text-xs mr-1 h-3 w-3" />}
        {Math.abs(data.change)}%
      </span>
    );
  };

  return (
    <Card className={cn("shadow-sm border border-slate-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{data.title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{data.value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", getColorClass())}>
            {typeof data.icon === 'string' ? (
              <i className={data.icon}></i>
            ) : (
              data.icon
            )}
          </div>
        </div>
        <div className="mt-4 text-sm">
          {getChangeIndicator()}
          {data.changeText && (
            <span className="text-slate-500 ml-1">{data.changeText}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
