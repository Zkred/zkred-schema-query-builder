'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSchemaStore } from '@/store/schema-store';
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const schemaFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(256, 'Title must be 256 characters or less'),
  schemaType: z
    .string()
    .min(1, 'Schema type is required')
    .max(256, 'Schema type must be 256 characters or less')
    .regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed'),
  version: z.string().min(1, 'Version is required'),
  description: z.string().min(1, 'Description is required'),
  credentialType: z.enum(['merklized', 'non-merklized']),
});

type SchemaFormData = z.infer<typeof schemaFormSchema>;

export default function SchemaForm() {
  const { metadata, setMetadata, setCurrentStep } = useSchemaStore();
  const [showAdvanced, setShowAdvanced] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SchemaFormData>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: metadata,
  });

  const watchedTitle = watch('title');
  const watchedSchemaType = watch('schemaType');
  const watchedCredentialType = watch('credentialType');

  const onSubmit = (data: SchemaFormData) => {
    setMetadata(data);
    setCurrentStep(2);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Define schema</h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Schema Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Schema type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register('schemaType')}
                type="text"
                maxLength={256}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-16 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors ${
                  (watchedSchemaType?.length || 0) > 240
                    ? 'text-red-500'
                    : (watchedSchemaType?.length || 0) > 200
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`}
              >
                {watchedSchemaType?.length || 0}/256
              </span>
            </div>
            {errors.schemaType && (
              <span className="mt-1 text-xs text-red-500">{errors.schemaType.message}</span>
            )}
            <p className="mt-1 text-xs text-gray-500">Only alphanumeric characters allowed.</p>
          </div>

          {/* Version */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              {...register('version')}
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <span className="mt-1 text-xs text-red-500">{errors.version?.message}</span>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <span className="mt-1 text-xs text-red-500">{errors.description?.message}</span>
          </div>

          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-700"
            >
              <span>Advanced options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Credential type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                      <input
                        {...register('credentialType')}
                        type="radio"
                        value="merklized"
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Merklized</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Default option for majority of schemas.
                        </div>
                      </div>
                      {watchedCredentialType === 'merklized' && (
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      )}
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                      <input
                        {...register('credentialType')}
                        type="radio"
                        value="non-merklized"
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Non-merklized</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Used mostly for on-chain interactions. Supports a maximum of 4 attributes.{' '}
                          <a
                            href="#"
                            className="text-green-600 hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Learn more here
                          </a>
                          .
                        </div>
                      </div>
                      {watchedCredentialType === 'non-merklized' && (
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 active:scale-[0.98]"
            >
              Define attributes
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

