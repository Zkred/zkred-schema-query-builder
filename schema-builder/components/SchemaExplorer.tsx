'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Check } from 'lucide-react';
import {
  fetchPrivadoSchemas,
  PrivadoSchema,
  fetchSchemaFromIPFS,
  extractJsonLdContext,
  extractSchemaType,
  isValidIPFSUrl,
  isValidHttpUrl,
} from '@/lib/schema-api';
import { importJsonSchema } from '@/lib/schema-importer';
import { useQueryStore } from '@/store/query-store';

interface SchemaExplorerProps {
  onSelectSchema: (jsonLdContextUrl: string, schemaType: string) => void;
  currentJsonLdContextUrl?: string;
  onSchemaParsed?: (attributes: any[]) => void;
}

export default function SchemaExplorer({
  onSelectSchema,
  currentJsonLdContextUrl,
  onSchemaParsed,
}: SchemaExplorerProps) {
  const { setQueryAttributes } = useQueryStore();
  const [schemas, setSchemas] = useState<PrivadoSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<PrivadoSchema | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Fetch schemas on mount
  useEffect(() => {
    const loadSchemas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchPrivadoSchemas(1000, 1);
        setSchemas(response.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schemas');
      } finally {
        setLoading(false);
      }
    };

    loadSchemas();
  }, []);

  // Filter schemas based on search query
  const filteredSchemas = useMemo(() => {
    if (!searchQuery.trim()) {
      return schemas;
    }

    const query = searchQuery.toLowerCase();
    return schemas.filter(
      (schema) =>
        schema.title.toLowerCase().includes(query) ||
        schema.description?.toLowerCase().includes(query) ||
        schema.type?.toLowerCase().includes(query) ||
        schema.url.toLowerCase().includes(query) ||
        schema.contextURL.toLowerCase().includes(query)
    );
  }, [schemas, searchQuery]);

  const handleSchemaSelect = async (schema: PrivadoSchema) => {
    setSelectedSchema(schema);
    setFetchingDetails(true);
    setError(null);

    try {
      // Fetch the full schema details from IPFS using the schema.url
      const schemaDetails = await fetchSchemaFromIPFS(schema.url);
      
      // Extract JSON-LD context and type from the fetched schema
      let jsonLdContext = extractJsonLdContext(schemaDetails);
      let schemaType = extractSchemaType(schemaDetails);

      // Fallback to API response values if extraction fails
      if (!jsonLdContext) {
        jsonLdContext = schema.contextURL;
        if (jsonLdContext && jsonLdContext.startsWith('ipfs://')) {
          jsonLdContext = jsonLdContext.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
      }

      if (!schemaType) {
        schemaType = schema.type;
      }

      if (!jsonLdContext || !schemaType) {
        throw new Error('Failed to extract JSON-LD context or schema type from schema');
      }

      // Parse the schema to extract attributes
      const importResult = importJsonSchema(schemaDetails);
      if (importResult.success && importResult.attributes) {
        // Set attributes in query store
        setQueryAttributes(importResult.attributes);
        if (onSchemaParsed) {
          onSchemaParsed(importResult.attributes);
        }
      }

      // Use the extracted values
      onSelectSchema(jsonLdContext, schemaType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema details from IPFS');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!url.trim()) return;

    // Check if it's a valid IPFS URL or HTTP URL
    if (!isValidIPFSUrl(url) && !isValidHttpUrl(url)) {
      setError('Invalid URL. Please enter a valid IPFS or HTTP URL.');
      return;
    }

    setFetchingDetails(true);
    setError(null);

    try {
      const schemaDetails = await fetchSchemaFromIPFS(url);
      
      const jsonLdContext = extractJsonLdContext(schemaDetails);
      const schemaType = extractSchemaType(schemaDetails);

      if (jsonLdContext && schemaType) {
        // Parse the schema to extract attributes
        const importResult = importJsonSchema(schemaDetails);
        if (importResult.success && importResult.attributes) {
          // Set attributes in query store
          setQueryAttributes(importResult.attributes);
          if (onSchemaParsed) {
            onSchemaParsed(importResult.attributes);
          }
        }
        
        onSelectSchema(jsonLdContext, schemaType);
      } else {
        throw new Error('Failed to extract JSON-LD context or schema type from schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema from URL');
    } finally {
      setFetchingDetails(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search schemas by name, description, or type..."
          className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading schemas...</span>
        </div>
      )}

      {/* Schema List */}
      {!loading && (
        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {filteredSchemas.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? 'No schemas found matching your search' : 'No schemas available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSchemas.map((schema) => (
                <button
                  key={schema.id}
                  onClick={() => handleSchemaSelect(schema)}
                  disabled={fetchingDetails}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50 ${
                    selectedSchema?.id === schema.id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">{schema.title}</h4>
                        {selectedSchema?.id === schema.id && fetchingDetails && (
                          <Loader2 className="h-3 w-3 animate-spin text-green-600" />
                        )}
                        {selectedSchema?.id === schema.id && !fetchingDetails && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      {schema.description && (
                        <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        {schema.type && <span>Type: {schema.type}</span>}
                        {schema.version && <span>v{schema.version}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Or Enter URL Manually */}
      <div className="border-t border-gray-200 pt-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Or enter schema URL manually
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://ipfs.io/ipfs/... or IPFS hash"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUrlSubmit(e.currentTarget.value);
              }
            }}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input) {
                handleUrlSubmit(input.value);
              }
            }}
            disabled={fetchingDetails}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            {fetchingDetails ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Fetch'
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Enter an IPFS URL, IPFS hash, or HTTP URL to fetch schema details
        </p>
      </div>
    </div>
  );
}

