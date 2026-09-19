import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', ...props }) => {
  // Extract icon component dynamically from lucide-react exports
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];

  if (!IconComponent) {
    return <Icons.File className={className} {...props} />;
  }

  return <IconComponent className={className} {...props} />;
};