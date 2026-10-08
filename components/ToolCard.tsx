import React from 'react';
import { Tool } from '../types';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { AnimatedToolIcon } from './AnimatedToolIcon';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const IconComponent = tool?.icon || FileText;

  return (
    <motion.div 
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col p-5 h-full bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/60 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon Container with Stable Canonical Placement */}
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <AnimatedToolIcon 
            toolId={tool.id} 
            fallbackIcon={IconComponent} 
            size={44} 
            className="w-11 h-11" 
          />
        </div>

        {/* Badges - Stable Pill Badge (No Blinking) */}
        <div className="flex items-center gap-1.5 pt-1">
          {tool.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs">
              New
            </span>
          )}
          {tool.isPopular && !tool.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Popular
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-1 tracking-tight">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 font-medium">
          {tool.description}
        </p>
      </div>
    </motion.div>
  );
};