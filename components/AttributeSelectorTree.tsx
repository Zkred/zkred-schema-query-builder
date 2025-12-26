'use client';

import { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { Attribute } from '@/lib/types';

interface TreeNodeProps {
  attribute: Attribute;
  level: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  currentPath: string;
}

function TreeNode({ attribute, level, selectedPath, onSelect, currentPath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(
    attribute.id === 'credentialSubject' || (attribute.dataType === 'object' && attribute.children && attribute.children.length > 0)
  );
  const hasChildren = attribute.children && attribute.children.length > 0;
  const attributePath = currentPath ? `${currentPath}.${attribute.name}` : attribute.name;
  const isSelected = selectedPath === attributePath;
  const isFolder = attribute.dataType === 'object' || hasChildren;
  const isSelectable = !isFolder && attribute.id !== 'credentialSubject-id';

  const getDataTypeLabel = (dataType: string) => {
    if (dataType === 'uri') return 'uri';
    if (dataType === 'date-time') return 'date-time';
    return dataType;
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 transition-colors ${
          isSelected ? 'bg-green-50' : isSelectable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
        } ${!isSelectable ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => isSelectable && onSelect(attributePath)}
      >
        {isFolder ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        {isFolder ? (
          <Folder className="h-4 w-4 text-gray-500" />
        ) : (
          <File className="h-4 w-4 text-gray-400" />
        )}
        <span className="flex-1 text-sm text-gray-900">
          {attribute.name}
        </span>
        {!isFolder && (
          <span className="text-xs text-gray-500">{getDataTypeLabel(attribute.dataType)}</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {attribute.children!.map((child) => (
            <TreeNode
              key={child.id}
              attribute={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              currentPath={attribute.id === 'credentialSubject' ? '' : attributePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AttributeSelectorTreeProps {
  attributes: Attribute[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export default function AttributeSelectorTree({ attributes, selectedPath, onSelect }: AttributeSelectorTreeProps) {
  const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');

  if (!credentialSubject) {
    return <div className="p-4 text-sm text-gray-500">No attributes available</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white">
      <div className="p-2">
        <TreeNode
          attribute={credentialSubject}
          level={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          currentPath=""
        />
      </div>
    </div>
  );
}

