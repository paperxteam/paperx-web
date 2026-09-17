const fs = require('fs');
let code = fs.readFileSync('components/ProfilePanel.tsx', 'utf8');

code = code.replace(
  /const renderPreferences = \(\) => \(\n    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">\n       \n      <div className="flex-1 overflow-y-auto">\n        {renderHeader\("Preferences"\)}\n        <div className="p-4 sm:p-6 space-y-7">/,
  `const renderPreferences = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
      {renderHeader("Preferences")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7">`
);

fs.writeFileSync('components/ProfilePanel.tsx', code);
