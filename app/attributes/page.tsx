'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AttributesTree from '@/components/AttributesTree';
import AttributeProperties from '@/components/AttributeProperties';
import JsonPreview from '@/components/JsonPreview';
import { useSchemaStore } from '@/store/schema-store';
import { ArrowLeft, Download, Wallet } from 'lucide-react';
import { generateJsonSchema } from '@/lib/schema-generator';

export default function AttributesPage() {
  const router = useRouter();
  const { metadata, attributes, setCurrentStep, addAttribute, currentStep, selectedAttributeId, getAttribute } = useSchemaStore();

  useEffect(() => {
    if (currentStep === 1) {
      router.push('/');
    }
  }, [currentStep, router]);

  const handleDownload = () => {
    try {
      const schema = generateJsonSchema(metadata, attributes);
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.schemaType}-v${metadata.version}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download schema:', error);
    }
  };

  const handleAddAttribute = () => {
    const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');
    if (!credentialSubject) return;

    // Determine parent: if selected attribute is an object, add to it; otherwise add to credentialSubject
    let parentId = 'credentialSubject';
    let parentAttribute = credentialSubject;

    if (selectedAttributeId) {
      const selected = getAttribute(selectedAttributeId);
      if (selected && selected.dataType === 'object' && selected.id !== 'credentialSubject') {
        parentId = selected.id;
        parentAttribute = selected;
      }
    }

    // Check non-merklized limit (only for direct children of credentialSubject)
    if (metadata.credentialType === 'non-merklized' && parentId === 'credentialSubject') {
      const attributeCount =
        credentialSubject.children?.filter((c) => c.id !== 'credentialSubject-id').length || 0;
      if (attributeCount >= 4) {
        alert('Non-merklized credentials support a maximum of 4 attributes');
        return;
      }
    }

    addAttribute(
      {
        name: `attribute${Date.now()}`,
        title: 'New Attribute',
        dataType: 'string',
        description: '',
        required: false,
      },
      parentId
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 pb-20">
        <div className="w-1/2 border-r border-gray-200">
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-200">
              <AttributesTree onAddClick={handleAddAttribute} />
            </div>
            <div className="w-1/2">
              <AttributeProperties />
            </div>
          </div>
        </div>
        <div className="w-1/2">
          <JsonPreview />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={() => {
              setCurrentStep(1);
              router.push('/');
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Wallet className="h-4 w-4" />
              Connect wallet to publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

