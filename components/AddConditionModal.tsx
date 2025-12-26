'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useQueryStore } from '@/store/query-store';
import AttributeSelectorTree from './AttributeSelectorTree';
import { Operator, ConditionItem } from '@/lib/query-types';
import { isV3Circuit } from '@/lib/query-generator';

interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  mode: 'condition' | 'selectiveDisclosure';
  editingCondition?: ConditionItem | null;
}

export default function AddConditionModal({
  isOpen,
  onClose,
  onAdd,
  mode,
  editingCondition,
}: AddConditionModalProps) {
  const {
    queryAttributes,
    circuitId,
    addCondition,
    updateCondition,
  } = useQueryStore();

  const [localAttributePath, setLocalAttributePath] = useState<string | null>(null);
  const [localOperator, setLocalOperator] = useState<Operator | null>(null);
  const [localValue, setLocalValue] = useState<string>('');
  const [localValueArray, setLocalValueArray] = useState<(string | number | boolean)[]>([]);
  const [valueInput, setValueInput] = useState<string>('');
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const operatorDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize form when editing or when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingCondition) {
        setLocalAttributePath(editingCondition.attributePath);
        setLocalOperator(editingCondition.operator);
        if (editingCondition.operator === 'exists') {
          // For exists operator, default to "true" if value is null
          setLocalValue(editingCondition.value === null || editingCondition.value === undefined 
            ? 'true' 
            : String(editingCondition.value));
        } else if (editingCondition.operator === 'in' || editingCondition.operator === 'nin') {
          setLocalValueArray(Array.isArray(editingCondition.value) ? editingCondition.value : []);
          setValueInput('');
        } else if (Array.isArray(editingCondition.value) && editingCondition.value.length === 2) {
          // Range operator
          setRangeFrom(String(editingCondition.value[0]));
          setRangeTo(String(editingCondition.value[1]));
        } else if (typeof editingCondition.value === 'boolean') {
          setLocalValue(String(editingCondition.value));
        } else {
          setLocalValue(editingCondition.value ? String(editingCondition.value) : '');
        }
      } else {
        // Reset for new condition
        setLocalAttributePath(null);
        setLocalOperator(null);
        setLocalValue('');
        setLocalValueArray([]);
        setValueInput('');
        setRangeFrom('');
        setRangeTo('');
      }
    }
  }, [isOpen, editingCondition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (operatorDropdownRef.current && !operatorDropdownRef.current.contains(event.target as Node)) {
        setIsOperatorDropdownOpen(false);
      }
    };

    if (isOperatorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOperatorDropdownOpen]);

  // Get selected attribute to determine data type and available operators
  const selectedAttribute = useMemo(() => {
    if (!localAttributePath) return null;
    return useQueryStore.getState().getQueryAttribute(localAttributePath);
  }, [localAttributePath]);

  // Get operator symbol mapping
  const getOperatorSymbol = (op: Operator): string => {
    const symbolMap: Record<Operator, string> = {
      eq: '$eq',
      neq: '$ne',
      in: '$in',
      nin: '$nin',
      lt: '$lt',
      gt: '$gt',
      lte: '$lte',
      gte: '$gte',
      between: '$between',
      nonbetween: '$nonbetween',
      exists: '$exists',
    };
    return symbolMap[op];
  };

  // Get available operators based on selected attribute data type
  const availableOperators = useMemo(() => {
    if (!selectedAttribute) {
      return [
        { value: 'eq', label: 'Is equal to', symbol: '$eq' },
        { value: 'neq', label: 'Is not equal to', symbol: '$ne' },
        { value: 'in', label: 'Matches one of the values', symbol: '$in' },
        { value: 'nin', label: 'Matches none of the values', symbol: '$nin' },
        { value: 'lt', label: 'Is less than', symbol: '$lt' },
        { value: 'gt', label: 'Is greater than', symbol: '$gt' },
        { value: 'lte', label: 'Is less than or equal to', symbol: '$lte' },
        { value: 'gte', label: 'Is greater than or equal to', symbol: '$gte' },
        { value: 'range', label: 'Falls within the range', symbol: '$range' },
        { value: 'nrange', label: 'Falls outside the range', symbol: '$nrange' },
        { value: 'exists', label: 'Exists', symbol: '$exists' },
      ];
    }

    const dataType = selectedAttribute.dataType;
    const baseOperators = [
      { value: 'eq', label: 'Is equal to', symbol: '$eq' },
      { value: 'neq', label: 'Is not equal to', symbol: '$ne' },
      { value: 'exists', label: 'Exists', symbol: '$exists' },
    ];

    switch (dataType) {
      case 'string':
      case 'uri':
        return [
          ...baseOperators,
          { value: 'in', label: 'Matches one of the values', symbol: '$in' },
          { value: 'nin', label: 'Matches none of the values', symbol: '$nin' },
        ];
      case 'number':
      case 'integer':
        return [
          ...baseOperators,
          { value: 'in', label: 'Matches one of the values', symbol: '$in' },
          { value: 'nin', label: 'Matches none of the values', symbol: '$nin' },
          { value: 'lt', label: 'Is less than', symbol: '$lt' },
          { value: 'gt', label: 'Is greater than', symbol: '$gt' },
          { value: 'lte', label: 'Is less than or equal to', symbol: '$lte' },
          { value: 'gte', label: 'Is greater than or equal to', symbol: '$gte' },
          { value: 'between', label: 'Falls within the range', symbol: '$between' },
          { value: 'nonbetween', label: 'Falls outside the range', symbol: '$nonbetween' },
        ];
      case 'boolean':
        return baseOperators;
      case 'date-time':
        return [
          ...baseOperators,
          { value: 'lt', label: 'Is less than', symbol: '$lt' },
          { value: 'gt', label: 'Is greater than', symbol: '$gt' },
          { value: 'lte', label: 'Is less than or equal to', symbol: '$lte' },
          { value: 'gte', label: 'Is greater than or equal to', symbol: '$gte' },
          { value: 'between', label: 'Falls within the range', symbol: '$between' },
          { value: 'nonbetween', label: 'Falls outside the range', symbol: '$nonbetween' },
        ];
      default:
        return baseOperators;
    }
  }, [selectedAttribute]);

  const handleAddValue = () => {
    if (!valueInput.trim()) return;

    if (selectedAttribute) {
      const dataType = selectedAttribute.dataType;
      let parsedValue: string | number | boolean = valueInput.trim();

      if (dataType === 'number' || dataType === 'integer') {
        const num = Number(valueInput.trim());
        if (!isNaN(num)) {
          parsedValue = num;
        } else {
          return; // Invalid number
        }
      } else if (dataType === 'boolean') {
        parsedValue = valueInput.trim() === 'true';
      }

      setLocalValueArray([...localValueArray, parsedValue]);
      setValueInput('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setLocalValueArray(localValueArray.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!localAttributePath) {
      return;
    }

    // For selective disclosure, only attribute is needed
    if (mode === 'selectiveDisclosure') {
      const conditionItem: ConditionItem = {
        id: editingCondition?.id || `condition-${Date.now()}-${Math.random()}`,
        type: mode,
        attributePath: localAttributePath,
        operator: 'eq', // Default operator for selective disclosure (not used in query generation)
        value: null, // No value needed for selective disclosure
      };

      if (editingCondition) {
        updateCondition(editingCondition.id, conditionItem);
      } else {
        addCondition(conditionItem);
      }

      onAdd();
      handleClose();
      return;
    }

    // For conditions, operator is required
    if (!localOperator) {
      return;
    }

    // Parse value based on operator and data type
    let parsedValue: string | number | boolean | [number, number] | (string | number | boolean)[] | null;

    if (localOperator === 'exists') {
      // For exists, store the selected value (true/false) even though query generator always uses true
      parsedValue = localValue === 'true';
    } else if (localOperator === 'in' || localOperator === 'nin') {
      // Use the array of values
      if (localValueArray.length === 0) {
        return; // Need at least one value
      }
      parsedValue = localValueArray;
    } else if (selectedAttribute) {
      const dataType = selectedAttribute.dataType;
      
      // Handle range operators first (they work for multiple data types)
      if (localOperator === 'between' || localOperator === 'nonbetween') {
        if (!rangeFrom.trim() || !rangeTo.trim()) {
          return; // Both values required
        }
        
        if (dataType === 'number' || dataType === 'integer') {
          const fromNum = Number(rangeFrom);
          const toNum = Number(rangeTo);
          if (isNaN(fromNum) || isNaN(toNum)) {
            return; // Invalid numbers
          }
          parsedValue = [fromNum, toNum];
        } else {
          // For other types (string, date-time), keep as strings
          parsedValue = [rangeFrom, rangeTo];
        }
      } else if (dataType === 'number' || dataType === 'integer') {
        parsedValue = localValue ? Number(localValue) : null;
      } else if (dataType === 'boolean') {
        parsedValue = localValue === 'true';
      } else if (dataType === 'string') {
        parsedValue = localValue;
      } else {
        parsedValue = localValue;
      }
    } else {
      // Fallback: if no attribute selected, try to parse range
      if (localOperator === 'between' || localOperator === 'nonbetween') {
        if (!rangeFrom.trim() || !rangeTo.trim()) {
          return;
        }
        parsedValue = [rangeFrom, rangeTo];
      } else {
        parsedValue = localValue;
      }
    }

    // Create condition item
    const conditionItem: ConditionItem = {
      id: editingCondition?.id || `condition-${Date.now()}-${Math.random()}`,
      type: mode,
      attributePath: localAttributePath,
      operator: localOperator,
      value: parsedValue,
    };

    // Add or update condition
    if (editingCondition) {
      updateCondition(editingCondition.id, conditionItem);
    } else {
      addCondition(conditionItem);
    }

    // Call onAdd callback
    onAdd();

    // Reset local state
    setLocalAttributePath(null);
    setLocalOperator(null);
    setLocalValue('');
    setLocalValueArray([]);
    setValueInput('');
    setRangeFrom('');
    setRangeTo('');
  };

  const handleClose = () => {
    setLocalAttributePath(null);
    setLocalOperator(null);
    setLocalValue('');
    setLocalValueArray([]);
    setValueInput('');
    setRangeFrom('');
    setRangeTo('');
    onClose();
  };

  const renderValueInput = () => {
    if (!localOperator || localOperator === 'exists') {
      return null;
    }

    if (!selectedAttribute) {
      return (
        <div className="text-sm text-gray-500">Please select an attribute first</div>
      );
    }

    const dataType = selectedAttribute.dataType;
    const isRange = localOperator === 'between' || localOperator === 'nonbetween';
    const isMulti = localOperator === 'in' || localOperator === 'nin';

    // Multi-value input for "in" and "nin" operators
    if (isMulti) {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddValue();
                }
              }}
              placeholder="Enter value"
              rows={3}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
            />
            <button
              type="button"
              onClick={handleAddValue}
              disabled={!valueInput.trim()}
              className="h-fit rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 hover:bg-gray-50 whitespace-nowrap self-start"
            >
              Add
            </button>
          </div>
          {localValueArray.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {localValueArray.map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                >
                  <span>{String(value)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(index)}
                    className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="Remove value"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (isRange) {
      return (
        <div className="space-y-3">
          <div>
            <input
              type={dataType === 'number' || dataType === 'integer' ? 'number' : 'text'}
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              placeholder='Enter "From" value'
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div>
            <input
              type={dataType === 'number' || dataType === 'integer' ? 'number' : 'text'}
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              placeholder='Enter "To" value'
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>
      );
    }

    if (dataType === 'boolean') {
      return (
        <select
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        >
          <option value="">Select value</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    return (
      <input
        type={dataType === 'number' || dataType === 'integer' ? 'number' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Enter value"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCondition ? 'Edit' : 'Add'} {mode === 'condition' ? 'condition' : 'selective disclosure'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Define attribute {mode === 'condition' ? 'condition' : 'disclosure'} and values
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Attribute */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Attribute <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={localAttributePath ? localAttributePath.split('.').pop() || localAttributePath : ''}
                  readOnly
                  placeholder="Select an attribute"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {selectedAttribute && (
                <select
                  value={selectedAttribute.dataType}
                  disabled
                  className="w-24 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                >
                  <option value={selectedAttribute.dataType}>{selectedAttribute.dataType}</option>
                </select>
              )}
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              <div className="p-2">
                <AttributeSelectorTree
                  attributes={queryAttributes}
                  selectedPath={localAttributePath}
                  onSelect={setLocalAttributePath}
                />
              </div>
            </div>
          </div>

          {/* Operator - Only show for conditions, not selective disclosure */}
          {mode === 'condition' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Operator <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={operatorDropdownRef}>
              <button
                type="button"
                onClick={() => localAttributePath && setIsOperatorDropdownOpen(!isOperatorDropdownOpen)}
                disabled={!localAttributePath}
                className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-left text-sm text-gray-900 transition-all disabled:cursor-not-allowed disabled:opacity-50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                  localOperator ? 'border-green-500 bg-white' : 'border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={localOperator ? 'text-gray-900' : 'text-gray-400'}>
                    {localOperator
                      ? availableOperators.find((op) => op.value === localOperator)?.label || 'Select operator'
                      : localAttributePath
                        ? 'Select operator'
                        : 'Select an attribute first'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOperatorDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Custom Dropdown */}
              {isOperatorDropdownOpen && localAttributePath && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {availableOperators.map((op) => {
                      const isSelected = localOperator === op.value;
                      // Operators that require V3 circuits: lte, gte, exists
                      const requiresV3 = op.value === 'lte' || op.value === 'gte' || op.value === 'exists';
                      const showV3Tag = requiresV3 && (!circuitId || isV3Circuit(circuitId));
                      
                      return (
                        <button
                          key={op.value}
                          type="button"
                          onClick={() => {
                            const newOperator = op.value as Operator;
                            setLocalOperator(newOperator);
                            if (newOperator === 'exists') {
                              setLocalValue('');
                              setLocalValueArray([]);
                              setValueInput('');
                              setRangeFrom('');
                              setRangeTo('');
                            } else if (newOperator === 'in' || newOperator === 'nin') {
                              // Clear range values for multi-value operators
                              setRangeFrom('');
                              setRangeTo('');
                              setLocalValue('');
                            } else if (newOperator === 'between' || newOperator === 'nonbetween') {
                              // Clear multi-value array for range operators
                              setLocalValueArray([]);
                              setValueInput('');
                              setLocalValue('');
                            } else {
                              // Clear array and range for other operators
                              setLocalValueArray([]);
                              setValueInput('');
                              setRangeFrom('');
                              setRangeTo('');
                            }
                            setIsOperatorDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-green-50 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{op.label}</span>
                          <div className="flex items-center gap-2">
                            {showV3Tag && (
                              <span className="rounded border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                V3 circuit (experimental)
                              </span>
                            )}
                            <span className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                              {op.symbol}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected operator tags (when dropdown is closed) */}
              {localOperator && !isOperatorDropdownOpen && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  {(() => {
                    const requiresV3 = localOperator === 'lte' || localOperator === 'gte' || localOperator === 'exists';
                    const showV3Tag = requiresV3 && (!circuitId || isV3Circuit(circuitId));
                    return showV3Tag ? (
                      <span className="rounded border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 whitespace-nowrap">
                        V3 circuit (experimental)
                      </span>
                    ) : null;
                  })()}
                  <span className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 whitespace-nowrap">
                    {getOperatorSymbol(localOperator)}
                  </span>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Value - Only show for conditions, not selective disclosure */}
          {mode === 'condition' && localOperator && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Value <span className="text-red-500">*</span>
              </label>
              {localOperator === 'exists' ? (
                <select
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Select value</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                renderValueInput()
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={
              !localAttributePath ||
              (mode === 'condition'
                ? !localOperator ||
                  (localOperator === 'exists'
                    ? false
                    : localOperator === 'in' || localOperator === 'nin'
                      ? localValueArray.length === 0
                      : localOperator === 'between' || localOperator === 'nonbetween'
                        ? !rangeFrom.trim() || !rangeTo.trim()
                        : !localValue)
                : false) // For selective disclosure, only attribute is required
            }
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:bg-green-700"
          >
            {editingCondition ? 'Update' : 'Add'} {mode === 'condition' ? 'condition' : 'selective disclosure'}
          </button>
        </div>
      </div>
    </div>
  );
}

