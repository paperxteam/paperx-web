import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '../Button';

export const TxtToPdfWorkspace: React.FC<{ onComplete: (blob: Blob, name: string) => void }> = ({ onComplete }) => {
  return <div className="p-6">TXT to PDF Workspace Ready</div>;
};
