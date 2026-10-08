import type { ButtonHTMLAttributes } from "react";

export function DemoButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`demo-button ${className}`} {...props} />;
}