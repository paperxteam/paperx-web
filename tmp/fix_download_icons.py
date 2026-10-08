with open('App.tsx', 'r') as f:
    content = f.read()

target = """            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[15px] font-normal leading-relaxed max-w-md mx-auto text-balance">
              Get the official PaperX Android app. Fast, secure, and private.
            </p>
          </div>

          {/* Feature Highlight Boxes with Layered 3D Bubble Depth */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-2.5">
            {/* Box 1: 100% Free */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-emerald-100/90 via-emerald-50 to-emerald-100/60 dark:from-emerald-900/60 dark:via-emerald-950/80 dark:to-emerald-950 border border-emerald-200/90 dark:border-emerald-700/60 border-b-2 border-b-emerald-300/80 dark:border-b-emerald-950 shadow-[0_3px_8px_rgba(16,185,129,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(5,150,105,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-1.5 shrink-0 relative z-10">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 drop-shadow-[0_1px_1px_rgba(16,185,129,0.25)]" />
              </div>
              <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight relative z-10">0% Risk</span>
              <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal mt-0.5 relative z-10">Your files stay yours</span>
            </motion.div>

            {/* Box 2: Instant Speed */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-amber-100/90 via-amber-50 to-amber-100/60 dark:from-amber-900/60 dark:via-amber-950/80 dark:to-amber-950 border border-amber-200/90 dark:border-amber-700/60 border-b-2 border-b-amber-300/80 dark:border-b-amber-950 shadow-[0_3px_8px_rgba(245,158,11,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(217,119,6,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-1.5 shrink-0 relative z-10">
                <Zap size={18} className="text-amber-500 dark:text-amber-400 drop-shadow-[0_1px_1px_rgba(245,158,11,0.25)]" />
              </div>
              <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight relative z-10">Instant Speed</span>
              <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal mt-0.5 relative z-10">Millisecond file dispatch</span>
            </motion.div>

            {/* Box 3: Private & Secure */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-blue-100/90 via-blue-50 to-blue-100/60 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-950 border border-blue-200/90 dark:border-blue-700/60 border-b-2 border-b-blue-300/80 dark:border-b-blue-950 shadow-[0_3px_8px_rgba(59,130,246,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(37,99,235,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-1.5 shrink-0 relative z-10">
                <Lock size={18} className="text-blue-600 dark:text-blue-400 drop-shadow-[0_1px_1px_rgba(59,130,246,0.25)]" />
              </div>
              <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight relative z-10">Risk Free</span>
              <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal mt-0.5 relative z-10">100% Secure</span>
            </motion.div>
          </div>"""

replacement = """            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[15px] font-normal leading-relaxed max-w-md mx-auto text-balance">
              Get the official PaperX app. Fast, secure, and private.
            </p>
          </div>

          {/* Feature Highlight Boxes with Layered 3D Bubble Depth - Perfectly Aligned */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-2.5 items-stretch">
            {/* Box 1: 0% Risk */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-2.5 sm:p-3.5 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center select-none overflow-hidden h-full min-h-[114px] sm:min-h-[122px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-emerald-100/90 via-emerald-50 to-emerald-100/60 dark:from-emerald-900/60 dark:via-emerald-950/80 dark:to-emerald-950 border border-emerald-200/90 dark:border-emerald-700/60 border-b-2 border-b-emerald-300/80 dark:border-b-emerald-950 shadow-[0_3px_8px_rgba(16,185,129,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(5,150,105,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 drop-shadow-[0_1px_1px_rgba(16,185,129,0.25)]" />
              </div>
              <div className="min-h-[22px] sm:min-h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">0% Risk</span>
              </div>
              <div className="min-h-[26px] sm:min-h-[28px] flex items-start justify-center w-full relative z-10 mt-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight">Your files stay yours</span>
              </div>
            </motion.div>

            {/* Box 2: Instant Speed */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-2.5 sm:p-3.5 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center select-none overflow-hidden h-full min-h-[114px] sm:min-h-[122px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-amber-100/90 via-amber-50 to-amber-100/60 dark:from-amber-900/60 dark:via-amber-950/80 dark:to-amber-950 border border-amber-200/90 dark:border-amber-700/60 border-b-2 border-b-amber-300/80 dark:border-b-amber-950 shadow-[0_3px_8px_rgba(245,158,11,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(217,119,6,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <Zap size={18} className="text-amber-500 dark:text-amber-400 drop-shadow-[0_1px_1px_rgba(245,158,11,0.25)]" />
              </div>
              <div className="min-h-[22px] sm:min-h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">Instant Speed</span>
              </div>
              <div className="min-h-[26px] sm:min-h-[28px] flex items-start justify-center w-full relative z-10 mt-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight">Millisecond file dispatch</span>
              </div>
            </motion.div>

            {/* Box 3: Risk Free */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative p-2.5 sm:p-3.5 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center select-none overflow-hidden h-full min-h-[114px] sm:min-h-[122px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-blue-100/90 via-blue-50 to-blue-100/60 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-950 border border-blue-200/90 dark:border-blue-700/60 border-b-2 border-b-blue-300/80 dark:border-b-blue-950 shadow-[0_3px_8px_rgba(59,130,246,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(37,99,235,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <Lock size={18} className="text-blue-600 dark:text-blue-400 drop-shadow-[0_1px_1px_rgba(59,130,246,0.25)]" />
              </div>
              <div className="min-h-[22px] sm:min-h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">Risk Free</span>
              </div>
              <div className="min-h-[26px] sm:min-h-[28px] flex items-start justify-center w-full relative z-10 mt-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight">100% Secure</span>
              </div>
            </motion.div>
          </div>"""

assert target in content, "target not found"
new_content = content.replace(target, replacement, 1)

with open('App.tsx', 'w') as f:
    f.write(new_content)
print('Successfully fixed icon alignment and removed Android from upper text!')
