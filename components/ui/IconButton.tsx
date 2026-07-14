import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "dark" | "light" | "accent";
};

export function IconButton({ label, children, tone = "dark", className = "", ...props }: Props) {
  return (
    <button className={`icon-button icon-button--${tone} ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
