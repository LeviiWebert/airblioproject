
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  colorClass = 'text-primary',
}: StatCardProps) => {
  return (
    <Card className="dashboard-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="mt-2 flex items-baseline">
              <p className={cn("dashboard-stat", colorClass)}>{value}</p>
            </div>
            {description && (
              <p className="mt-1 dashboard-stat-label">{description}</p>
            )}
            {trend && (
              <div className={`mt-2 flex items-center text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? (
                  <>
                    <span className="inline-block mr-1">↑</span> {trend.value}%
                  </>
                ) : (
                  <>
                    <span className="inline-block mr-1">↓</span> {trend.value}%
                  </>
                )}
                <span className="ml-1 text-muted-foreground">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-full p-3", colorClass.replace('text', 'bg').replace('primary', 'primary/10'))}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
