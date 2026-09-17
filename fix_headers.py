import re

with open('components/ProfilePanel.tsx', 'r') as f:
    code = f.read()

# 1. Update renderHeader
code = code.replace(
    '<div className="px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between ios-glass-drawer sticky top-0 z-20 relative">',
    '<div className="absolute top-0 left-0 w-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between ios-glass-drawer z-20">'
)

# 2. Update renderMenu header
code = code.replace(
    '<div className="p-6 flex items-center justify-center border-b border-gray-50 dark:border-gray-800 relative">',
    '<div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex items-center justify-center border-b border-gray-200/50 dark:border-gray-800/50 ios-glass-drawer z-20">'
)

# 3. Add pt-16 to flex-1 overflow-y-auto (for views that use renderHeader)
# We will just replace all `flex-1 overflow-y-auto p-` with `flex-1 overflow-y-auto pt-[60px] sm:pt-[64px] p-`
code = re.sub(
    r'className="flex-1 overflow-y-auto (p-[^"]+)"',
    r'className="flex-1 overflow-y-auto pt-[60px] sm:pt-[64px] \1"',
    code
)

# Also ensure containers are relative
code = code.replace(
    'animate-slide-in-right bg-white dark:bg-gray-900"',
    'animate-slide-in-right bg-white dark:bg-gray-900 relative"'
)
code = code.replace(
    'animate-fade-in-up bg-white dark:bg-gray-900"',
    'animate-fade-in-up bg-white dark:bg-gray-900 relative"'
)
code = code.replace(
    'animate-slide-in-right bg-white dark:bg-stone-900"',
    'animate-slide-in-right bg-white dark:bg-stone-900 relative"'
)

with open('components/ProfilePanel.tsx', 'w') as f:
    f.write(code)
