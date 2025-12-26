'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SchemaForm from '@/components/SchemaForm';
import JsonPreview from '@/components/JsonPreview';
import { useSchemaStore } from '@/store/schema-store';

export default function Home() {
  const router = useRouter();
  const { currentStep } = useSchemaStore();

  useEffect(() => {
    if (currentStep === 2) {
      router.push('/attributes');
    }
  }, [currentStep, router]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <div className="w-1/2 border-r border-gray-200">
          <SchemaForm />
        </div>
        <div className="w-1/2">
          <JsonPreview />
        </div>
      </div>
    </div>
  );
}
