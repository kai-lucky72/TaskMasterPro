import { StatsData } from "@/types";
import StatsCard from "@/components/common/StatsCard";

interface StatsProps {
  data: StatsData[];
}

export default function Stats({ data }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {data.map((stat, index) => (
        <StatsCard key={index} data={stat} />
      ))}
    </div>
  );
}
