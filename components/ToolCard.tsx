import React from 'react';
import { Tool } from '../types';
import { motion } from 'motion/react';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col p-5 h-full bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 hover:border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon Container with Smooth Animation */}
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-gray-900 group-hover:bg-black group-hover:text-white shadow-sm group-hover:shadow-lg group-hover:shadow-black/20 transition-all duration-300">
            <motion.div
                whileHover={{ scale: 1.15, rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
                <tool.icon 
                  size={20} 
                  strokeWidth={1.5} 
                />
            </motion.div>
        </div>

        {/* Badges - Minimal dots */}
        <div className="flex gap-2">
            {tool.isNew && (
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" title="New Tool"></span>
            )}
            {tool.isPopular && !tool.isNew && (
            <span className="w-2 h-2 rounded-full bg-gray-400" title="Popular"></span>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-base font-black text-gray-900 mb-1 tracking-tight">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 font-medium">
          {tool.description}
        </p>
      </div>
    </motion.div>
  );
};