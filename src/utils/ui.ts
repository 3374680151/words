import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn 风格 cn（原项目同款：clsx + tailwind-merge）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
