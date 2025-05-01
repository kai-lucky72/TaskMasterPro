import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/hooks/use-mobile";

interface PerformanceChartProps {
  data: any[];
  type?: "bar" | "line";
}

export default function PerformanceChart({ data, type = "bar" }: PerformanceChartProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [chartType, setChartType] = useState<"bar" | "line">(type);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  
  // Get role-specific colors
  const getPrimaryColor = () => {
    if (!user) return "#2563eb"; // default blue
    
    switch (user.role) {
      case "admin": return "#2563eb"; // blue
      case "manager": return "#9333ea"; // purple
      case "sales_staff": return "#16a34a"; // green
      case "team_leader": return "#d97706"; // amber
      case "individual_agent": return "#ea580c"; // orange
      case "sales_agent": return "#ea580c"; // orange
      default: return "#2563eb"; // default blue
    }
  };
  
  const getSecondaryColor = () => {
    if (!user) return "#60a5fa"; // default lighter blue
    
    switch (user.role) {
      case "admin": return "#60a5fa"; // lighter blue
      case "manager": return "#c084fc"; // lighter purple
      case "sales_staff": return "#4ade80"; // lighter green
      case "team_leader": return "#fbbf24"; // lighter amber
      case "individual_agent": return "#fb923c"; // lighter orange
      case "sales_agent": return "#fb923c"; // lighter orange
      default: return "#60a5fa"; // default lighter blue
    }
  };
  
  // Determine available metrics based on first data point
  useEffect(() => {
    if (data && data.length > 0) {
      const metrics = Object.keys(data[0]).filter(key => key !== 'name');
      setSelectedMetrics(metrics);
    }
  }, [data]);
  
  // Toggle selection of a metric
  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Card>
          <CardContent className="p-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="mt-1">
              {payload.map((entry, index) => (
                <p key={index} className="text-xs" style={{ color: entry.color }}>
                  {`${entry.name}: ${entry.value}`}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  
    return null;
  };
  
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BarChart className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">No Performance Data</h3>
        <p className="text-sm text-slate-500">
          Performance data will appear here as you track your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <Tabs defaultValue={chartType} onValueChange={(value) => setChartType(value as "bar" | "line")}>
          <TabsList>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-wrap gap-2">
          {Object.keys(data[0])
            .filter(key => key !== 'name')
            .map(metric => (
              <Button
                key={metric}
                variant="outline"
                size="sm"
                className={`text-xs ${selectedMetrics.includes(metric) ? 'bg-slate-100' : ''}`}
                onClick={() => toggleMetric(metric)}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Button>
            ))
          }
        </div>
      </div>
      
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: isMobile ? 0 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.includes('clients') && (
                <Bar 
                  dataKey="clients" 
                  name="Clients" 
                  fill={getPrimaryColor()} 
                />
              )}
              {selectedMetrics.includes('revenue') && (
                <Bar 
                  dataKey="revenue" 
                  name="Revenue (RWF)" 
                  fill={getSecondaryColor()} 
                />
              )}
              {selectedMetrics.includes('sales') && (
                <Bar 
                  dataKey="sales" 
                  name="Sales" 
                  fill={getPrimaryColor()} 
                />
              )}
              {/* Support other metrics as needed */}
              {selectedMetrics
                .filter(metric => !['clients', 'revenue', 'sales'].includes(metric))
                .map((metric, index) => (
                  <Bar 
                    key={metric}
                    dataKey={metric}
                    name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    fill={index % 2 === 0 ? getPrimaryColor() : getSecondaryColor()}
                  />
                ))
              }
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: isMobile ? 0 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.includes('clients') && (
                <Line 
                  type="monotone" 
                  dataKey="clients" 
                  name="Clients" 
                  stroke={getPrimaryColor()} 
                  activeDot={{ r: 8 }}
                />
              )}
              {selectedMetrics.includes('revenue') && (
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue (RWF)" 
                  stroke={getSecondaryColor()} 
                />
              )}
              {selectedMetrics.includes('sales') && (
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  name="Sales" 
                  stroke={getPrimaryColor()} 
                />
              )}
              {/* Support other metrics as needed */}
              {selectedMetrics
                .filter(metric => !['clients', 'revenue', 'sales'].includes(metric))
                .map((metric, index) => (
                  <Line 
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    stroke={index % 2 === 0 ? getPrimaryColor() : getSecondaryColor()}
                  />
                ))
              }
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
