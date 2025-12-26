'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle } from 'lucide-react';
import { useSchemaStore } from '@/store/schema-store';
import { importJsonSchema } from '@/lib/schema-importer';

interface ImportSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportSchemaModal({ isOpen, onClose }: ImportSchemaModalProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reset } = useSchemaStore();

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!input.trim()) {
      setError('Please paste a JSON Schema or URL');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      let schemaData: unknown;

      // Check if input is a URL
      if (input.trim().startsWith('http://') || input.trim().startsWith('https://')) {
        const response = await fetch(input.trim());
        if (!response.ok) {
          throw new Error('Failed to fetch schema from URL');
        }
        schemaData = await response.json();
      } else {
        // Parse as JSON
        schemaData = JSON.parse(input.trim());
      }

      // Import the schema
      const result = importJsonSchema(schemaData);
      
      if (result.error) {
        setError(result.error);
        setIsImporting(false);
        return;
      }

      // Reset store and set imported data
      reset();
      useSchemaStore.setState({
        metadata: result.metadata!,
        attributes: result.attributes!,
        currentStep: 2,
      });

      // Navigate to attributes page
      router.push('/attributes');

      onClose();
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import schema');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setInput('');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">Import Schema</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="mb-3 text-sm leading-relaxed text-gray-600">
            Save time by pasting an existing JSON schema or schema URL to import it. Your schema
            and attribute details will be automatically filled.
          </p>

          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            Since array and null types are not supported yet, the schema will be imported without
            these attribute types.
          </p>

          {/* Input */}
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Paste a JSON Schema or an URL to import it"
            className="w-full rounded-lg border-2 border-green-500/50 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-500/20"
            rows={8}
          />

          {/* Error */}
          {error && (
            <div className="mt-4 animate-slide-up rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <p className="text-sm leading-relaxed text-green-800">
              When you import a schema, any ongoing editing will be discarded
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={!input.trim() || isImporting}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98] ${
              input.trim() && !isImporting
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400 hover:shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

