import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, className, actions }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between", className)}>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {description && <p className="text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
}
