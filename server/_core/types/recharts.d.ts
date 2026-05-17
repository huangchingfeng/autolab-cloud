import type { ComponentType, ReactNode } from "react";

export interface ResponsiveContainerProps {
  children?: ReactNode;
  [key: string]: unknown;
}

export interface TooltipPayload {
  type?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  payload: Record<string, any>;
  color?: string;
  [key: string]: any;
}

export interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  className?: string;
  label?: ReactNode;
  labelClassName?: string;
  color?: string;
  labelFormatter?: (value: ReactNode, payload: TooltipPayload[]) => ReactNode;
  formatter?: (
    value: ReactNode,
    name: string | number,
    item: TooltipPayload,
    index: number,
    payload?: Record<string, any>
  ) => ReactNode;
  [key: string]: any;
}

export interface LegendPayload {
  type?: string;
  dataKey?: string | number;
  value?: string | number;
  color?: string;
  [key: string]: any;
}

export interface LegendProps {
  payload?: LegendPayload[];
  verticalAlign?: "top" | "middle" | "bottom" | string;
  [key: string]: any;
}

export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
export const Tooltip: ComponentType<TooltipProps>;
export const Legend: ComponentType<LegendProps>;
