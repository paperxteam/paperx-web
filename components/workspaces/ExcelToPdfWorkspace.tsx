import React, { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '../Button';

export const ExcelToPdfWorkspace: React.FC<{ onComplete: (blob: Blob, name: string) => void }> = ({ onComplete }) => {
  return <div className="p-6">Excel to PDF Workspace Ready</div>;
};
