import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDistance(meters: number): string {
  if (!meters && meters !== 0) return "0 m";
  
  // Nếu khoảng cách lớn hơn 1000m thì đổi sang km
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`; 
  }
  
  // Nếu nhỏ hơn 1000m thì giữ nguyên mét
  return `${Math.round(meters)} m`;
}
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'terminal':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'intermediate':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'stop':
      return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'normal':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'express':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'rapid':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}