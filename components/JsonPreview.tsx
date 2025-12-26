'use client';

import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSchemaStore } from '@/store/schema-store';
import { generateJsonSchema, generateJsonLdContext } from '@/lib/schema-generator';

type PreviewFormat = 'json-schema' | 'json-ld-context';

export default function JsonPreview() {
  const { metadata, attributes } = useSchemaStore();
  const [format, setFormat] = useState<PreviewFormat>('json-schema');
  const [copied, setCopied] = useState(false);

  const previewContent = useMemo(() => {
    try {
      if (format === 'json-ld-context') {
        return generateJsonLdContext(metadata, attributes);
      }
      return generateJsonSchema(metadata, attributes);
    } catch {
      return { error: 'Failed to generate schema' };
    }
  }, [metadata, attributes, format]);

  const jsonString = useMemo(() => {
    return JSON.stringify(previewContent, null, 2);
  }, [previewContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as PreviewFormat)}
          className="rounded-lg border-2 border-green-500 bg-white px-3 py-1.5 text-sm font-medium text-green-600 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30 hover:border-green-600"
        >
          <option value="json-schema">JSON Schema</option>
          <option value="json-ld-context">JSON LD Context</option>
        </select>
      </div>
      <div className="relative flex-1 overflow-auto bg-gray-50">
        <button
          onClick={handleCopy}
          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
        <SyntaxHighlighter
          language="json"
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: '#ffffff',
            fontSize: '0.75rem',
            lineHeight: '1.5',
          }}
          showLineNumbers
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#9ca3af',
            userSelect: 'none',
          }}
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

