import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

export interface DayPickerClassNames {
  [key: string]: string;
}

export interface DayPickerProps {
  className?: string;
  classNames?: DayPickerClassNames;
  showOutsideDays?: boolean;
  captionLayout?: string;
  formatters?: Record<string, (date: Date, ...args: unknown[]) => string>;
  components?: Record<string, ComponentType<any>>;
  [key: string]: unknown;
}

export interface CalendarDay {
  date: Date;
}

export interface CalendarModifiers {
  focused?: boolean;
  selected?: boolean;
  range_start?: boolean;
  range_end?: boolean;
  range_middle?: boolean;
  [key: string]: boolean | undefined;
}

export interface DayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  day: CalendarDay;
  modifiers: CalendarModifiers;
  children?: ReactNode;
}

export const DayPicker: ComponentType<DayPickerProps>;
export const DayButton: ComponentType<DayButtonProps>;
export function getDefaultClassNames(): DayPickerClassNames;
