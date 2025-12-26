'use client';

import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useQueryStore } from '@/store/query-store';
import { generateZKQuery, generateQueryRequest, generateQueryObjects } from '@/lib/query-generator';

export default function QueryPreview() {
  const queryState = useQueryStore();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const query = useMemo(() => {
    try {
      return generateZKQuery(queryState);
    } catch {
      return null;
    }
  }, [queryState]);

  const queryObjects = useMemo(() => {
    try {
      return generateQueryObjects(queryState);
    } catch {
      return [];
    }
  }, [queryState]);

  const request = useMemo(() => {
    try {
      return generateQueryRequest(queryState);
    } catch {
      return null;
    }
  }, [queryState]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Query Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (query) {
                navigator.clipboard.writeText(JSON.stringify(query, null, 2));
                alert('Query copied to clipboard!');
              }
            }}
            disabled={!query}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 hover:bg-gray-50"
          >
            Copy Query
          </button>
          <button
            onClick={() => {
              if (request) {
                navigator.clipboard.writeText(JSON.stringify(request, null, 2));
                alert('Request copied to clipboard!');
              }
            }}
            disabled={!request}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 hover:bg-gray-50"
          >
            Copy Request
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="space-y-6 p-6">
          {/* Query Objects Preview (Array format) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Implement verification query</h3>
              <button
                onClick={() => {
                  if (queryObjects.length > 0) {
                    navigator.clipboard.writeText(JSON.stringify(queryObjects, null, 2));
                    alert('Query objects copied to clipboard!');
                  }
                }}
                disabled={queryObjects.length === 0}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
            <p className="mb-2 text-xs text-gray-500">
              Follow our documentation guide to implement the query to your application.
            </p>
            <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => handleCopy(
                  queryObjects.length > 0 ? JSON.stringify(queryObjects, null, 2) : '',
                  'queryObjects'
                )}
                className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
                title="Copy to clipboard"
                disabled={queryObjects.length === 0}
              >
                {copiedSection === 'queryObjects' ? (
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
                  padding: '1rem',
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
                {queryObjects.length > 0 ? JSON.stringify(queryObjects, null, 2) : '// Add conditions or selective disclosures to generate queries'}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* ZK Query Preview (Legacy format) */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">ZK Query (Combined)</h3>
            <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => handleCopy(
                  query ? JSON.stringify(query, null, 2) : '',
                  'query'
                )}
                className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
                title="Copy to clipboard"
                disabled={!query}
              >
                {copiedSection === 'query' ? (
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
                  padding: '1rem',
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
                {query ? JSON.stringify(query, null, 2) : '// Fill in the form to generate query'}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Query Request Preview */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Query Request (JWZ)</h3>
            <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => handleCopy(
                  request ? JSON.stringify(request, null, 2) : '',
                  'request'
                )}
                className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
                title="Copy to clipboard"
                disabled={!request}
              >
                {copiedSection === 'request' ? (
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
                  padding: '1rem',
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
                {request ? JSON.stringify(request, null, 2) : '// Fill in the form to generate request'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

