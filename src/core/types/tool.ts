export type ToolCategory =
  | 'essentials'
  | 'edit'
  | 'security'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'ai-intelligence'
  | 'super-modules'
  | 'business';

export type ToolBadge = 'NEW' | 'AI' | 'WASM' | 'HOT' | 'PRO' | 'FAST' | 'OFFLINE';

export type AccentColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  badge?: ToolBadge;
  accentColor: AccentColor;
  keywords: string[];
  shortcut?: string;
  isFeatured?: boolean;
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  tagline: string;
  iconName: string;
  accentColor: AccentColor;
  count?: number;
}