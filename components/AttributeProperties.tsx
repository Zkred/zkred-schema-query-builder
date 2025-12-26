'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useInteractions } from '@floating-ui/react';
import { useSchemaStore } from '@/store/schema-store';
import { AttributeConstraints } from '@/lib/types';

const attributeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(256, 'Name must be 256 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric characters, dash (-) and underscore (_)'),
  title: z.string().min(1, 'Title is required').max(256, 'Title must be 256 characters or less'),
  dataType: z.enum(['string', 'number', 'integer', 'boolean', 'uri', 'date-time', 'object']),
  description: z.string().min(1, 'Description is required'),
  required: z.boolean(),
  exclusiveMinimum: z.number().optional(),
  maximum: z.number().optional(),
  minimum: z.number().optional(),
  exclusiveMaximum: z.number().optional(),
});

type AttributeFormData = z.infer<typeof attributeFormSchema>;

type StringPropertyType = 'format' | 'maxLength' | 'minLength' | 'pattern' | 'default' | 'enum' | 'const' | 'examples' | 'comment';
type NumberPropertyType =
  | 'exclusiveMaximum'
  | 'exclusiveMinimum'
  | 'maximum'
  | 'minimum'
  | 'multipleOf'
  | 'default'
  | 'enum'
  | 'const'
  | 'examples'
  | 'comment';
type IntegerPropertyType =
  | 'format'
  | 'exclusiveMaximum'
  | 'exclusiveMinimum'
  | 'maximum'
  | 'minimum'
  | 'multipleOf'
  | 'default'
  | 'enum'
  | 'const'
  | 'examples'
  | 'comment';
type BooleanPropertyType = 'default' | 'enum' | 'const' | 'examples' | 'comment';

export default function AttributeProperties() {
  const { selectedAttributeId, getAttribute, updateAttribute } = useSchemaStore();
  const selectedAttribute = selectedAttributeId ? getAttribute(selectedAttributeId) : null;
  const [activeStringProperties, setActiveStringProperties] = useState<Set<StringPropertyType>>(
    new Set()
  );
  const [activeNumberProperties, setActiveNumberProperties] = useState<Set<NumberPropertyType>>(
    new Set()
  );
  const [activeIntegerProperties, setActiveIntegerProperties] = useState<Set<IntegerPropertyType>>(
    new Set()
  );
  const [activeBooleanProperties, setActiveBooleanProperties] = useState<Set<BooleanPropertyType>>(
    new Set()
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const { refs, floatingStyles, context } = useFloating({
    open: isAdvancedOpen,
    onOpenChange: setIsAdvancedOpen,
    placement: 'right-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });
  
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const isUpdatingFromStore = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: selectedAttribute
      ? {
          name: selectedAttribute.name,
          title: selectedAttribute.title,
          dataType: selectedAttribute.dataType,
          description: selectedAttribute.description,
          required: selectedAttribute.required,
          exclusiveMinimum: selectedAttribute.constraints?.exclusiveMinimum,
          maximum: selectedAttribute.constraints?.maximum,
          minimum: selectedAttribute.constraints?.minimum,
          exclusiveMaximum: selectedAttribute.constraints?.exclusiveMaximum,
        }
      : undefined,
  });

  // Update form when selected attribute changes (but prevent infinite loop)
  useEffect(() => {
    if (selectedAttribute && !isUpdatingFromStore.current) {
      isUpdatingFromStore.current = true;
      reset({
        name: selectedAttribute.name,
        title: selectedAttribute.title,
        dataType: selectedAttribute.dataType,
        description: selectedAttribute.description,
        required: selectedAttribute.required,
        exclusiveMinimum: selectedAttribute.constraints?.exclusiveMinimum,
        maximum: selectedAttribute.constraints?.maximum,
        minimum: selectedAttribute.constraints?.minimum,
        exclusiveMaximum: selectedAttribute.constraints?.exclusiveMaximum,
      });

      // Set active string properties
      if (selectedAttribute.dataType === 'string') {
        const activeProps = new Set<StringPropertyType>();
        if (selectedAttribute.constraints?.format) activeProps.add('format');
        if (selectedAttribute.constraints?.maxLength !== undefined) activeProps.add('maxLength');
        if (selectedAttribute.constraints?.minLength !== undefined) activeProps.add('minLength');
        if (selectedAttribute.constraints?.pattern) activeProps.add('pattern');
        if (selectedAttribute.constraints?.default !== undefined) activeProps.add('default');
        if (selectedAttribute.constraints?.enum) activeProps.add('enum');
        if (selectedAttribute.constraints?.const !== undefined) activeProps.add('const');
        if (selectedAttribute.constraints?.examples) activeProps.add('examples');
        if (selectedAttribute.constraints?.comment) activeProps.add('comment');
        setActiveStringProperties(activeProps);
      }

      // Set active number properties
      if (selectedAttribute.dataType === 'number') {
        const activeNumProps = new Set<NumberPropertyType>();
        if (selectedAttribute.constraints?.exclusiveMaximum !== undefined)
          activeNumProps.add('exclusiveMaximum');
        if (selectedAttribute.constraints?.exclusiveMinimum !== undefined)
          activeNumProps.add('exclusiveMinimum');
        if (selectedAttribute.constraints?.maximum !== undefined) activeNumProps.add('maximum');
        if (selectedAttribute.constraints?.minimum !== undefined) activeNumProps.add('minimum');
        if (selectedAttribute.constraints?.multipleOf !== undefined) activeNumProps.add('multipleOf');
        if (selectedAttribute.constraints?.default !== undefined) activeNumProps.add('default');
        if (selectedAttribute.constraints?.enum) activeNumProps.add('enum');
        if (selectedAttribute.constraints?.const !== undefined) activeNumProps.add('const');
        if (selectedAttribute.constraints?.examples) activeNumProps.add('examples');
        if (selectedAttribute.constraints?.comment) activeNumProps.add('comment');
        setActiveNumberProperties(activeNumProps);
      }

      // Set active integer properties
      if (selectedAttribute.dataType === 'integer') {
        const activeIntProps = new Set<IntegerPropertyType>();
        if (selectedAttribute.constraints?.format) activeIntProps.add('format');
        if (selectedAttribute.constraints?.exclusiveMaximum !== undefined)
          activeIntProps.add('exclusiveMaximum');
        if (selectedAttribute.constraints?.exclusiveMinimum !== undefined)
          activeIntProps.add('exclusiveMinimum');
        if (selectedAttribute.constraints?.maximum !== undefined) activeIntProps.add('maximum');
        if (selectedAttribute.constraints?.minimum !== undefined) activeIntProps.add('minimum');
        if (selectedAttribute.constraints?.multipleOf !== undefined) activeIntProps.add('multipleOf');
        if (selectedAttribute.constraints?.default !== undefined) activeIntProps.add('default');
        if (selectedAttribute.constraints?.enum) activeIntProps.add('enum');
        if (selectedAttribute.constraints?.const !== undefined) activeIntProps.add('const');
        if (selectedAttribute.constraints?.examples) activeIntProps.add('examples');
        if (selectedAttribute.constraints?.comment) activeIntProps.add('comment');
        setActiveIntegerProperties(activeIntProps);
      }

      // Set active boolean properties
      if (selectedAttribute.dataType === 'boolean') {
        const activeBoolProps = new Set<BooleanPropertyType>();
        if (selectedAttribute.constraints?.default !== undefined) activeBoolProps.add('default');
        if (selectedAttribute.constraints?.enum) activeBoolProps.add('enum');
        if (selectedAttribute.constraints?.const !== undefined) activeBoolProps.add('const');
        if (selectedAttribute.constraints?.examples) activeBoolProps.add('examples');
        if (selectedAttribute.constraints?.comment) activeBoolProps.add('comment');
        setActiveBooleanProperties(activeBoolProps);
      }

      // Reset flag after a short delay to allow form to update
      setTimeout(() => {
        isUpdatingFromStore.current = false;
      }, 100);
    }
  }, [selectedAttribute?.id, reset]);

  const watchedName = watch('name');
  const watchedTitle = watch('title');
  const watchedDataType = watch('dataType');
  const showNumberConstraints = watchedDataType === 'number';
  const showIntegerAdvanced = watchedDataType === 'integer';
  const showStringAdvanced = watchedDataType === 'string';
  const showBooleanAdvanced = watchedDataType === 'boolean';

  const handleStringPropertyChange = (
    property: StringPropertyType,
    value: string | number | undefined
  ) => {
    if (!selectedAttributeId) return;

    const currentConstraints = selectedAttribute?.constraints || {};
    const newConstraints: AttributeConstraints = { ...currentConstraints };

    if (value === undefined || value === '') {
      delete newConstraints[property];
      const newActive = new Set(activeStringProperties);
      newActive.delete(property);
      setActiveStringProperties(newActive);
    } else {
      if (property === 'maxLength' || property === 'minLength') {
        newConstraints[property] = Number(value);
      } else if (property === 'enum' || property === 'examples') {
        // Parse comma-separated values
        const values = (value as string)
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        newConstraints[property] = values.length > 0 ? values : undefined;
      } else if (property === 'const') {
        newConstraints.const = value as string | number | boolean;
      } else {
        newConstraints[property] = value as string;
      }
      if (!activeStringProperties.has(property)) {
        setActiveStringProperties(new Set([...activeStringProperties, property]));
      }
    }

    isUpdatingFromStore.current = true;
    updateAttribute(selectedAttributeId, {
      constraints: Object.keys(newConstraints).length > 0 ? newConstraints : undefined,
    });
    setTimeout(() => {
      isUpdatingFromStore.current = false;
    }, 100);
  };

  const handleNumberPropertyChange = (
    property: NumberPropertyType,
    value: number | string | undefined
  ) => {
    if (!selectedAttributeId) return;

    const currentConstraints = selectedAttribute?.constraints || {};
    const newConstraints: AttributeConstraints = { ...currentConstraints };

    if (value === undefined || value === '') {
      delete newConstraints[property];
      const newActive = new Set(activeNumberProperties);
      newActive.delete(property);
      setActiveNumberProperties(newActive);
    } else {
      if (property === 'exclusiveMaximum' || property === 'exclusiveMinimum' || 
                 property === 'maximum' || property === 'minimum' || property === 'multipleOf') {
        newConstraints[property] = Number(value);
      } else if (property === 'enum' || property === 'examples') {
        // Parse comma-separated values
        const values = (value as string)
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((v) => {
            const num = Number(v);
            return isNaN(num) ? v : num;
          });
        if (values.length > 0) {
          newConstraints[property] = values as (string | number)[];
        } else {
          delete newConstraints[property];
        }
      } else if (property === 'const') {
        const num = Number(value);
        newConstraints.const = isNaN(num) ? value as string : num;
      } else if (property === 'default') {
        const num = Number(value);
        newConstraints.default = isNaN(num) ? value as string : num;
      } else {
        newConstraints[property] = value as string;
      }
      if (!activeNumberProperties.has(property)) {
        setActiveNumberProperties(new Set([...activeNumberProperties, property]));
      }
    }

    isUpdatingFromStore.current = true;
    updateAttribute(selectedAttributeId, {
      constraints: Object.keys(newConstraints).length > 0 ? newConstraints : undefined,
    });
    setTimeout(() => {
      isUpdatingFromStore.current = false;
    }, 100);
  };

  const handleBooleanPropertyChange = (
    property: BooleanPropertyType,
    value: string | boolean | undefined
  ) => {
    if (!selectedAttributeId) return;

    const currentConstraints = selectedAttribute?.constraints || {};
    const newConstraints: AttributeConstraints = { ...currentConstraints };

    if (value === undefined || value === '') {
      delete newConstraints[property];
      const newActive = new Set(activeBooleanProperties);
      newActive.delete(property);
      setActiveBooleanProperties(newActive);
    } else {
      if (property === 'default' || property === 'const') {
        // For boolean, convert string to boolean
        if (typeof value === 'string') {
          newConstraints[property] = value === 'true';
        } else {
          newConstraints[property] = value as boolean;
        }
      } else if (property === 'enum' || property === 'examples') {
        // Parse comma-separated values
        const values = (value as string)
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((v) => v === 'true' || v === 'false' ? v === 'true' : v);
        newConstraints[property] = values.length > 0 ? values : undefined;
      } else {
        newConstraints[property] = value as string;
      }
      if (!activeBooleanProperties.has(property)) {
        setActiveBooleanProperties(new Set([...activeBooleanProperties, property]));
      }
    }

    isUpdatingFromStore.current = true;
    updateAttribute(selectedAttributeId, {
      constraints: Object.keys(newConstraints).length > 0 ? newConstraints : undefined,
    });
    setTimeout(() => {
      isUpdatingFromStore.current = false;
    }, 100);
  };

  const handleIntegerPropertyChange = (
    property: IntegerPropertyType,
    value: string | number | undefined
  ) => {
    if (!selectedAttributeId) return;

    const currentConstraints = selectedAttribute?.constraints || {};
    const newConstraints: AttributeConstraints = { ...currentConstraints };

    if (value === undefined || value === '') {
      delete newConstraints[property];
      const newActive = new Set(activeIntegerProperties);
      newActive.delete(property);
      setActiveIntegerProperties(newActive);
    } else {
      if (property === 'exclusiveMaximum' || property === 'exclusiveMinimum' || 
                 property === 'maximum' || property === 'minimum' || property === 'multipleOf') {
        newConstraints[property] = Number(value);
      } else if (property === 'enum' || property === 'examples') {
        // Parse comma-separated values
        const values = (value as string)
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((v) => {
            const num = Number(v);
            return isNaN(num) ? v : num;
          });
        if (values.length > 0) {
          newConstraints[property] = values as (string | number)[];
        } else {
          delete newConstraints[property];
        }
      } else if (property === 'const') {
        const num = Number(value);
        newConstraints.const = isNaN(num) ? value as string : num;
      } else if (property === 'default') {
        const num = Number(value);
        newConstraints.default = isNaN(num) ? value as string : num;
      } else {
        newConstraints[property] = value as string;
      }
      if (!activeIntegerProperties.has(property)) {
        setActiveIntegerProperties(new Set([...activeIntegerProperties, property]));
      }
    }

    isUpdatingFromStore.current = true;
    updateAttribute(selectedAttributeId, {
      constraints: Object.keys(newConstraints).length > 0 ? newConstraints : undefined,
    });
    setTimeout(() => {
      isUpdatingFromStore.current = false;
    }, 100);
  };

  const onSubmit = (data: AttributeFormData) => {
    if (!selectedAttributeId || isUpdatingFromStore.current) return;

    const constraints: AttributeConstraints | undefined =
      showNumberConstraints &&
      (data.exclusiveMinimum !== undefined ||
        data.maximum !== undefined ||
        data.minimum !== undefined ||
        data.exclusiveMaximum !== undefined)
        ? {
            exclusiveMinimum: data.exclusiveMinimum,
            maximum: data.maximum,
            minimum: data.minimum,
            exclusiveMaximum: data.exclusiveMaximum,
          }
        : selectedAttribute?.constraints;

    isUpdatingFromStore.current = true;
    updateAttribute(selectedAttributeId, {
      name: data.name,
      title: data.title,
      dataType: data.dataType,
      description: data.description,
      required: data.required,
      constraints,
    });
    setTimeout(() => {
      isUpdatingFromStore.current = false;
    }, 100);
  };

  // Debounced auto-save on blur
  const handleBlur = () => {
    handleSubmit(onSubmit)();
  };


  if (!selectedAttribute) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Select an attribute to edit its properties
      </div>
    );
  }

  // Disable editing for root object (credentialSubject) and system attributes
  const isRootObject = selectedAttribute.id === 'credentialSubject';
  const isSystemAttribute = selectedAttribute.id === 'credentialSubject-id';

  if (isRootObject || isSystemAttribute) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Attribute properties</h2>
        </div>
        <div className="flex flex-1 items-center justify-center bg-white px-6 py-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isRootObject ? 'credentialSubject' : 'id'} is a system attribute
            </p>
            <p className="mt-2 text-xs text-gray-500">
              System attributes cannot be edited
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Attribute properties</h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className="text-xs text-green-600 hover:underline"
                onClick={handleSubmit(onSubmit)}
              >
                Validate
              </button>
            </div>
            <div className="relative">
              <input
                {...register('name')}
                type="text"
                maxLength={256}
                onBlur={handleBlur}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-16 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                  (watchedName?.length || 0) > 240
                    ? 'text-red-500'
                    : (watchedName?.length || 0) > 200
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`}
              >
                {watchedName?.length || 0}/256
              </span>
            </div>
            {errors.name && (
              <span className="mt-1 text-xs text-red-500">{errors.name.message}</span>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Only alphanumeric characters, dash (-) and underscore (_)
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register('title')}
                type="text"
                maxLength={256}
                onBlur={handleBlur}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-16 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                  (watchedTitle?.length || 0) > 240
                    ? 'text-red-500'
                    : (watchedTitle?.length || 0) > 200
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`}
              >
                {watchedTitle?.length || 0}/256
              </span>
            </div>
            {errors.title && (
              <span className="mt-1 text-xs text-red-500">{errors.title.message}</span>
            )}
          </div>

          {/* Data Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Data type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                {...register('dataType')}
                onChange={(e) => {
                  register('dataType').onChange(e);
                  handleBlur();
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="integer">integer</option>
                <option value="boolean">boolean</option>
                <option value="object">object</option>
              </select>
              <div className="relative">
                <button
                  ref={refs.setReference}
                  {...getReferenceProps()}
                  type="button"
                  disabled={watchedDataType === 'object'}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white hover:bg-gray-50"
                  title={watchedDataType === 'object' ? 'Advanced options are disabled for object type' : 'Advanced options'}
                >
                  Advanced
                </button>

                {/* Advanced Popover */}
                {isAdvancedOpen && (watchedDataType === 'string' || watchedDataType === 'number' || watchedDataType === 'integer' || watchedDataType === 'boolean') && typeof window !== 'undefined' && createPortal(
                  <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    {...getFloatingProps()}
                    className="z-[99999] w-96 rounded-lg border border-gray-200 bg-white shadow-xl"
                  >
                    <div className="max-h-[80vh] overflow-y-auto p-4">
                      {showStringAdvanced && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">Advanced</h3>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Format
                              </label>
                              <select
                                value={selectedAttribute?.constraints?.format || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange('format', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                              >
                                <option value="">Select a format</option>
                                <option value="email">email</option>
                                <option value="uri">uri</option>
                                <option value="date">date</option>
                                <option value="date-time">date-time</option>
                                <option value="time">time</option>
                                <option value="uuid">uuid</option>
                                <option value="hostname">hostname</option>
                                <option value="ipv4">ipv4</option>
                                <option value="ipv6">ipv6</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Max Length
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.maxLength || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange(
                                    'maxLength',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="99"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Min Length
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.minLength || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange(
                                    'minLength',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Pattern
                              </label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.pattern || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange('pattern', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 font-mono"
                                placeholder="^[a-zA-Z0-9]+$"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Default
                              </label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.default?.toString() || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange('default', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="default value"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Enum</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.enum
                                    ? selectedAttribute.constraints.enum.join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleStringPropertyChange('enum', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="Value 1, Value 2, Value 3"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Const</label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.const?.toString() || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange('const', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="const value"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Examples</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.examples
                                    ? selectedAttribute.constraints.examples.join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleStringPropertyChange('examples', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="Example 1, Example 2, Example 3"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Comment</label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.comment || ''}
                                onChange={(e) =>
                                  handleStringPropertyChange('comment', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="A comment about the attribute"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {showNumberConstraints && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">Advanced</h3>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Exclusive Maximum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.exclusiveMaximum || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'exclusiveMaximum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="99"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Exclusive Minimum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.exclusiveMinimum || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'exclusiveMinimum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Maximum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.maximum || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'maximum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="99"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Minimum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.minimum || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'minimum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Multiple Of
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.multipleOf || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'multipleOf',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="5"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Default
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.default?.toString() || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'default',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="33"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Enum</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.enum
                                    ? selectedAttribute.constraints.enum.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleNumberPropertyChange('enum', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="10, 20, 30"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Const
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.const?.toString() || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange(
                                    'const',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="100"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Examples</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.examples
                                    ? selectedAttribute.constraints.examples.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleNumberPropertyChange('examples', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="40, 50, 60"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Comment</label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.comment || ''}
                                onChange={(e) =>
                                  handleNumberPropertyChange('comment', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="A comment about the attribute"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {showIntegerAdvanced && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">Advanced</h3>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Format
                              </label>
                              <select
                                value={selectedAttribute?.constraints?.format || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange('format', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                              >
                                <option value="">Select a format</option>
                                <option value="int32">int32</option>
                                <option value="int64">int64</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Exclusive Maximum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.exclusiveMaximum || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'exclusiveMaximum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="99"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Exclusive Minimum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.exclusiveMinimum || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'exclusiveMinimum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Maximum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.maximum || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'maximum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="99"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Minimum
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.minimum || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'minimum',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Multiple Of
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.multipleOf || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'multipleOf',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="5"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-32 text-xs font-medium text-gray-700">
                                Default
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.default?.toString() || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'default',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="33"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Enum</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.enum
                                    ? selectedAttribute.constraints.enum.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleIntegerPropertyChange('enum', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="10, 20, 30"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Const
                              </label>
                              <input
                                type="number"
                                value={selectedAttribute?.constraints?.const?.toString() || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange(
                                    'const',
                                    e.target.value ? Number(e.target.value) : undefined
                                  )
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="100"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Examples</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.examples
                                    ? selectedAttribute.constraints.examples.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleIntegerPropertyChange('examples', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="40, 50, 60"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Comment</label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.comment || ''}
                                onChange={(e) =>
                                  handleIntegerPropertyChange('comment', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="A comment about the attribute"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {showBooleanAdvanced && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">Advanced</h3>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Default
                              </label>
                              <div className="flex flex-1 items-center gap-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="radio"
                                    name="boolean-default"
                                    checked={selectedAttribute?.constraints?.default === true}
                                    onChange={() => handleBooleanPropertyChange('default', true)}
                                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-xs text-gray-700">true</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="radio"
                                    name="boolean-default"
                                    checked={selectedAttribute?.constraints?.default === false}
                                    onChange={() => handleBooleanPropertyChange('default', false)}
                                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-xs text-gray-700">false</span>
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Enum</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.enum
                                    ? selectedAttribute.constraints.enum.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleBooleanPropertyChange('enum', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="true, false"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">
                                Const
                              </label>
                              <div className="flex flex-1 items-center gap-4">
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="radio"
                                    name="boolean-const"
                                    checked={selectedAttribute?.constraints?.const === true}
                                    onChange={() => handleBooleanPropertyChange('const', true)}
                                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-xs text-gray-700">true</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                  <input
                                    type="radio"
                                    name="boolean-const"
                                    checked={selectedAttribute?.constraints?.const === false}
                                    onChange={() => handleBooleanPropertyChange('const', false)}
                                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <span className="text-xs text-gray-700">false</span>
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Examples</label>
                              <input
                                type="text"
                                value={
                                  selectedAttribute?.constraints?.examples
                                    ? selectedAttribute.constraints.examples.map(v => String(v)).join(', ')
                                    : ''
                                }
                                onChange={(e) =>
                                  handleBooleanPropertyChange('examples', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="true, false"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="w-24 text-xs font-medium text-gray-700">Comment</label>
                              <input
                                type="text"
                                value={selectedAttribute?.constraints?.comment || ''}
                                onChange={(e) =>
                                  handleBooleanPropertyChange('comment', e.target.value || undefined)
                                }
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
                                placeholder="A comment about the attribute"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
            {watchedDataType === 'object' && (
              <p className="mt-2 text-xs text-gray-500">
                Object attributes can contain nested attributes. Select this attribute in the tree and click &quot;Add&quot; to add nested properties.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={4}
              onBlur={handleBlur}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <span className="mt-1 text-xs text-red-500">{errors.description?.message}</span>
          </div>

          {/* Required */}
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                {...register('required')}
                type="checkbox"
                onChange={(e) => {
                  register('required').onChange(e);
                  handleBlur();
                }}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}

