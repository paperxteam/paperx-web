import re

with open('components/ProfilePanel.tsx', 'r') as f:
    code = f.read()

code = code.replace(
'''const renderPreferences = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
       
      <div className="flex-1 overflow-y-auto">
        {renderHeader("Preferences")}
        <div className="p-4 sm:p-6 space-y-7">''',
'''const renderPreferences = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
      {renderHeader("Preferences")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7">'''
)

with open('components/ProfilePanel.tsx', 'w') as f:
    f.write(code)
