import type { ComponentType, HTMLAttributes, ReactNode } from "react";

export interface ResizableComponentProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  [key: string]: unknown;
}

export const PanelGroup: ComponentType<ResizableComponentProps>;
export const Panel: ComponentType<ResizableComponentProps>;
export const PanelResizeHandle: ComponentType<ResizableComponentProps>;
