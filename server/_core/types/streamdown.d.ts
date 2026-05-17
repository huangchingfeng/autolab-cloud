import type { ComponentType, ReactNode } from "react";

export interface StreamdownProps {
  children?: ReactNode;
  [key: string]: unknown;
}

export const Streamdown: ComponentType<StreamdownProps>;
