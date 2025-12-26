'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Upload, Info } from 'lucide-react';
import ImportSchemaModal from './ImportSchemaModal';

export default function Header() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation Buttons - Prominent */}
            <div className="flex gap-2">
              <Link
                href="/"
                className={`flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  pathname === '/' || pathname === '/attributes'
                    ? 'border-green-500 bg-green-500 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Schema Builder
              </Link>
              <Link
                href="/query-builder"
                className={`flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  pathname?.includes('query-builder')
                    ? 'border-green-500 bg-green-500 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Query Builder
              </Link>
            </div>
            
            {/* Title and Description */}
            <div className="flex-1 px-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {pathname?.includes('query-builder') ? 'Query Builder' : 'Schema Builder'}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {pathname?.includes('query-builder')
                  ? 'Create verification queries for zero-knowledge proof credentials'
                  : 'Create trusted and tamper-proof verifiable credential schemas'}
              </p>
            </div>
            
            {/* Action Buttons - Only show on Schema Builder */}
            {pathname !== '/query-builder' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                >
                  <Upload className="h-4 w-4" />
                  Import Schema
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]">
                  <Info className="h-4 w-4" />
                  Supported formats
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ImportSchemaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}

