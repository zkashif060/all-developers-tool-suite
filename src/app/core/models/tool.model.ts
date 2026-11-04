export type ToolCategory =
  | 'JSON & Data'
  | 'Encoding'
  | 'Security & Tokens'
  | 'Generators'
  | 'Date & Time'
  | 'Testing & Development';

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string; // Lucide icon identifier key
  route: string;
  keywords: string[];
  popular?: boolean;
}

export interface CategoryInfo {
  name: ToolCategory;
  slug: string;
  description: string;
  icon: string;
}

