'use client';

import { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { useSchemaStore } from '@/store/schema-store';
import { Attribute } from '@/lib/types';

interface TreeNodeProps {
  attribute: Attribute;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TreeNode({ attribute, level, selectedId, onSelect }: TreeNodeProps) {
  // Auto-expand credentialSubject and object types with children
  const [isExpanded, setIsExpanded] = useState(
    attribute.id === 'credentialSubject' || (attribute.dataType === 'object' && attribute.children && attribute.children.length > 0)
  );
  const hasChildren = attribute.children && attribute.children.length > 0;
  const isSelected = selectedId === attribute.id;
  const isFolder = attribute.dataType === 'object' || hasChildren;

  const getDataTypeLabel = (dataType: string) => {
    if (dataType === 'uri') return 'uri';
    if (dataType === 'date-time') return 'date-time';
    return dataType;
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 ${
          isSelected ? 'bg-green-50' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(attribute.id)}
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
          {attribute.id === 'credentialSubject' && (
            <span className="ml-1 text-red-500">*</span>
          )}
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
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AttributesTreeProps {
  onAddClick: () => void;
}

export default function AttributesTree({ onAddClick }: AttributesTreeProps) {
  const { attributes, selectedAttributeId, selectAttribute, removeAttribute, metadata, getAttribute } =
    useSchemaStore();

  const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');
  const canRemove = selectedAttributeId && 
    selectedAttributeId !== 'credentialSubject' && 
    selectedAttributeId !== 'credentialSubject-id';
  
  // Determine if we can add: check if selected attribute is an object, or if we can add to credentialSubject
  let canAdd = false;
  if (selectedAttributeId) {
    const selected = getAttribute(selectedAttributeId);
    if (selected && selected.dataType === 'object' && selected.id !== 'credentialSubject') {
      canAdd = true; // Can always add to object attributes (except credentialSubject which has special rules)
    }
  }
  
  // For credentialSubject, check non-merklized limit
  if (!selectedAttributeId || (selectedAttributeId === 'credentialSubject')) {
    canAdd = metadata.credentialType === 'merklized' || 
      (metadata.credentialType === 'non-merklized' && 
       (credentialSubject?.children?.filter(c => c.id !== 'credentialSubject-id').length || 0) < 4);
  }

  if (!credentialSubject) {
    return <div className="p-4 text-sm text-gray-500">No attributes defined</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Define attributes</h2>
      </div>
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex gap-3">
          <button
            onClick={onAddClick}
            disabled={!canAdd}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
          >
            Add
          </button>
          <button
            onClick={() => canRemove && removeAttribute(selectedAttributeId!)}
            disabled={!canRemove}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-red-400 hover:bg-red-50 hover:shadow-md active:scale-[0.98]"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TreeNode
          attribute={credentialSubject}
          level={0}
          selectedId={selectedAttributeId}
          onSelect={selectAttribute}
        />
      </div>
    </div>
  );
}

