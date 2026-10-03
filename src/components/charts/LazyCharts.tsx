"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const load = <T extends keyof typeof import("./Charts")>(name: T) =>
  dynamic(() => import("./Charts").then((m) => m[name] as never), { ssr: false, loading: () => <ChartSkeleton /> });

/** Recharts is heavy, so charts load on demand and never block first paint. */
export const TrendChart = load("TrendChart") as typeof import("./Charts").TrendChart;
export const BarsChart = load("BarsChart") as typeof import("./Charts").BarsChart;
export const DonutChart = load("DonutChart") as typeof import("./Charts").DonutChart;
export const Heatmap = load("Heatmap") as typeof import("./Charts").Heatmap;
