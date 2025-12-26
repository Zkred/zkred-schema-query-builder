'use client';

import Header from '@/components/Header';
import QueryBuilderForm from '@/components/QueryBuilderForm';
import QueryPreview from '@/components/QueryPreview';

export default function QueryBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <div className="w-1/2 border-r border-gray-200">
          <QueryBuilderForm />
        </div>
        <div className="w-1/2">
          <QueryPreview />
        </div>
      </div>
    </div>
  );
}

