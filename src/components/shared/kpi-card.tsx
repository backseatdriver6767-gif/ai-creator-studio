"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  gradient?: boolean;
}

export function KPICard({ title, value, description, icon: Icon, trend, gradient }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className={gradient ? "gradient-purple-blue text-white border-0 shadow-lg shadow-purple-500/25" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={`text-sm font-medium ${gradient ? "text-white/90" : "text-muted-foreground"}`}>
            {title}
          </CardTitle>
          {Icon && <Icon className={`h-4 w-4 ${gradient ? "text-white/80" : "text-muted-foreground"}`} />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {(description || trend) && (
            <p className={`text-xs mt-1 ${gradient ? "text-white/70" : "text-muted-foreground"}`}>
              {trend && (
                <span className={trend.positive ? "text-green-400" : "text-red-400"}>
                  {trend.positive ? "+" : ""}
                  {trend.value}%{" "}
                </span>
              )}
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
