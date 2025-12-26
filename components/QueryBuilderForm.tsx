'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryStore } from '@/store/query-store';
import AttributeSelectorTree from './AttributeSelectorTree';
import SchemaExplorer from './SchemaExplorer';
import AddConditionModal from './AddConditionModal';
import {
  CircuitId,
  Operator,
  VerificationType,
  ConditionItem,
} from '@/lib/query-types';
import {
  isV3Circuit,
  generateZKQuery,
  generateQueryRequest,
} from '@/lib/query-generator';
import {
  fetchSchemaFromIPFS,
  extractJsonLdContext,
  extractSchemaType,
  isValidIPFSUrl,
} from '@/lib/schema-api';

export default function QueryBuilderForm() {
  const {
    jsonLdContextUrl,
    schemaType,
    selectedAttributePath,
    proofType,
    circuitId,
    enableProofOfUniqueness,
    nullifierSessionId,
    queryType,
    issuerDid,
    skipRevocationCheck,
    verificationType,
    network,
    requestId,
    contractAddress,
    queryAttributes,
    conditions,
    setJsonLdContextUrl,
    setSchemaType,
    setProofType,
    setCircuitId,
    setEnableProofOfUniqueness,
    setNullifierSessionId,
    setQueryType,
    setIssuerDid,
    setSkipRevocationCheck,
    setVerificationType,
    setNetwork,
    setRequestId,
    setContractAddress,
    removeCondition,
    clearConditions,
    getQueryAttribute,
  } = useQueryStore();
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [showSchemaExplorer, setShowSchemaExplorer] = useState(false);
  const [fetchingSchema, setFetchingSchema] = useState(false);
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);
  const [addConditionMode, setAddConditionMode] = useState<'condition' | 'selectiveDisclosure'>('condition');
  const [editingCondition, setEditingCondition] = useState<ConditionItem | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showAttributeField, setShowAttributeField] = useState(false);
  const prevQueryTypeRef = useRef(queryType);

  const isV3 = useMemo(() => isV3Circuit(circuitId), [circuitId]);

  // Clear conditions when query type changes between main categories
  // (credentialIssued vs condition/selectiveDisclosure)
  useEffect(() => {
    const prevType = prevQueryTypeRef.current;
    const currentType = queryType;
    
    // Only clear if switching between main categories
    const isMainCategorySwitch = 
      (prevType === 'credentialIssued' && (currentType === 'condition' || currentType === 'selectiveDisclosure')) ||
      ((prevType === 'condition' || prevType === 'selectiveDisclosure') && currentType === 'credentialIssued');
    
    if (isMainCategorySwitch) {
      clearConditions();
    }
    
    prevQueryTypeRef.current = currentType;
  }, [queryType, clearConditions]);

  // Format condition text for display
  const formatConditionText = (condition: ConditionItem): string => {
    const attribute = getQueryAttribute(condition.attributePath);
    const attributeName = attribute?.title || attribute?.name || condition.attributePath;
    
    // For selective disclosure, just show that the value will be revealed
    if (condition.type === 'selectiveDisclosure') {
      return `${attributeName} value will be revealed`;
    }
    
    const operatorLabels: Record<Operator, string> = {
      eq: 'is equal to',
      neq: 'is not equal to',
      in: 'matches one of the values',
      nin: 'matches none of the values',
      lt: 'is less than',
      gt: 'is greater than',
      lte: 'is less than or equal to',
      gte: 'is greater than or equal to',
      between: 'falls within the range',
      nonbetween: 'falls outside the range',
      exists: 'exists',
    };

    const operatorText = operatorLabels[condition.operator] || condition.operator;

    if (condition.operator === 'exists') {
      // Check if value is false to show "does not exist"
      const value = condition.value;
      if (value === false || value === 'false') {
        return `${attributeName} does not exist in the credential`;
      }
      return `${attributeName} ${operatorText} in the credential`;
    }

    let valueText = '';
    if (condition.operator === 'in' || condition.operator === 'nin') {
      const values = Array.isArray(condition.value) ? condition.value : [];
      valueText = values.map(v => String(v)).join(', ');
    } else if (condition.operator === 'between' || condition.operator === 'nonbetween') {
      const range = Array.isArray(condition.value) && condition.value.length === 2 
        ? condition.value 
        : [0, 0];
      valueText = `${range[0]}, ${range[1]}`;
    } else {
      valueText = condition.value !== null ? String(condition.value) : '';
    }

    return `${attributeName} ${operatorText} ${valueText}`;
  };

  // Auto-fetch schema when IPFS URL/hash is manually entered
  useEffect(() => {
    if (!jsonLdContextUrl || jsonLdContextUrl.trim() === '') {
      setFetchingSchema(false);
      return;
    }

    // Only auto-fetch if it looks like an IPFS URL or hash (not regular HTTP URLs)
    // Regular HTTP URLs might be direct JSON-LD context URLs
    if (isValidIPFSUrl(jsonLdContextUrl)) {
      const fetchSchema = async () => {
        // Don't fetch if schema type is already set (user might have already fetched)
        if (schemaType) return;

        setFetchingSchema(true);
        try {
          const schemaDetails = await fetchSchemaFromIPFS(jsonLdContextUrl);
          const extractedContext = extractJsonLdContext(schemaDetails);
          const extractedType = extractSchemaType(schemaDetails);

          // Only set schema type if we found a valid one (not generic types)
          if (extractedType && extractedType !== 'object' && extractedType !== 'array') {
            setSchemaType(extractedType);
          }
          // If we got a different context URL, update it
          if (extractedContext && extractedContext !== jsonLdContextUrl) {
            setJsonLdContextUrl(extractedContext);
          }
        } catch (error) {
          // Silently fail - user might be typing or URL might not be a schema
          console.error('Failed to auto-fetch schema:', error);
        } finally {
          setFetchingSchema(false);
        }
      };

      // Debounce the fetch (wait 1.5 seconds after user stops typing)
      const timeoutId = setTimeout(fetchSchema, 1500);
      return () => clearTimeout(timeoutId);
    } else {
      setFetchingSchema(false);
    }
  }, [jsonLdContextUrl, schemaType, setSchemaType, setJsonLdContextUrl]);

  const handleSchemaSelect = (jsonLdContext: string, type: string) => {
    setJsonLdContextUrl(jsonLdContext);
    setSchemaType(type);
    setShowSchemaExplorer(false);
  };

  // Get selected attribute to determine data type

  const handleTestQuery = () => {
    const query = generateZKQuery(useQueryStore.getState());
    if (!query) {
      alert('Please fill in all required fields');
      return;
    }

    const request = generateQueryRequest(useQueryStore.getState());
    if (!request) {
      alert('Failed to generate query request');
      return;
    }

    // Generate QR code data (JWZ token format)
    const qrData = JSON.stringify(request);
    setQrCodeData(qrData);
    setShowQrCode(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Query Builder</h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
        <div className="space-y-6">
          {/* URL to JSON-LD Context */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                URL to JSON-LD Context <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSchemaExplorer(!showSchemaExplorer)}
                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <Search className="h-3 w-3" />
                {showSchemaExplorer ? 'Hide' : 'Browse'} Schemas
              </button>
            </div>

            {/* Schema Explorer */}
            {showSchemaExplorer && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Schema Explorer</h3>
                  <button
                    type="button"
                    onClick={() => setShowSchemaExplorer(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <SchemaExplorer
                  onSelectSchema={handleSchemaSelect}
                  currentJsonLdContextUrl={jsonLdContextUrl}
                />
              </div>
            )}

            <div className="relative">
              <input
                type="url"
                value={jsonLdContextUrl}
                onChange={(e) => setJsonLdContextUrl(e.target.value)}
                placeholder="https://ipfs.io/ipfs/... or enter URL manually"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              {fetchingSchema && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the URL pointing to the JSON-LD Context of the schema, or use the Schema Explorer above
            </p>
          </div>

          {/* Schema Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Schema Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={schemaType}
              readOnly
              placeholder="Auto-filled from selected schema"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none"
            />
          </div>

          {/* Show subsequent sections only after schema is selected */}
          {jsonLdContextUrl && schemaType && (
            <>
          {/* Attribute Field - View Only */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setShowAttributeField(!showAttributeField)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
            >
              <div>
                <span className="text-sm font-medium text-gray-700">Attribute Field</span>
                <p className="mt-1 text-xs text-gray-500">View available attributes from the schema</p>
              </div>
              {showAttributeField ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {showAttributeField && (
              <div className="border-t border-gray-200 p-4">
                <div className="max-h-[500px] overflow-y-auto">
                  <AttributeSelectorTree
                    attributes={queryAttributes}
                    selectedPath={selectedAttributePath}
                    onSelect={() => {}} // Read-only: no-op function
                  />
                </div>
                {selectedAttributePath && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: <span className="font-mono">{selectedAttributePath}</span>
                  </p>
                )}
              </div>
            )}
          </div>


          {/* Criteria */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Criteria <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Credential Possession */}
              <button
                type="button"
                onClick={() => {
                  if (queryType !== 'credentialIssued') {
                    clearConditions();
                    setQueryType('credentialIssued');
                  }
                }}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  queryType === 'credentialIssued'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Credential Possession</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Verify that a credential exists in the user&apos;s wallet.
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        queryType === 'credentialIssued'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {queryType === 'credentialIssued' && (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Condition / Selective Disclosure */}
              <div
                className={`w-full rounded-lg border-2 p-4 transition-all ${
                  queryType === 'condition' || queryType === 'selectiveDisclosure'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        // Default to condition when selecting this option
                        if (queryType === 'credentialIssued') {
                          clearConditions();
                          setQueryType('condition');
                        }
                      }}
                    >
                      <h3 className="text-sm font-semibold text-gray-900">
                        Condition / Selective Disclosure
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Define conditions for an attribute&apos;s value or choose to reveal the value entirely.
                      </p>
                    </div>
                    {(queryType === 'condition' || queryType === 'selectiveDisclosure') && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCondition(null);
                            setAddConditionMode('condition');
                            setShowAddConditionModal(true);
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            queryType === 'condition'
                              ? 'border-green-500 bg-green-100 text-green-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          + Add condition
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCondition(null);
                            setAddConditionMode('selectiveDisclosure');
                            setShowAddConditionModal(true);
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            queryType === 'selectiveDisclosure'
                              ? 'border-green-500 bg-green-100 text-green-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          + Add selective disclosure
                        </button>
                      </div>
                    )}
                    {/* Conditions List */}
                    {conditions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {conditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-purple-600">
                                  {getQueryAttribute(condition.attributePath)?.title || 
                                   getQueryAttribute(condition.attributePath)?.name || 
                                   condition.attributePath}
                                </span>
                                {' '}
                                <span className="text-gray-500">
                                  {formatConditionText(condition).split(' ').slice(1).join(' ')}
                                </span>
                              </p>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCondition(condition);
                                  setAddConditionMode(condition.type);
                                  setShowAddConditionModal(true);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Edit condition"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCondition(condition.id)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                                aria-label="Delete condition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        // Default to condition when selecting this option
                        if (queryType === 'credentialIssued') {
                          clearConditions();
                          setQueryType('condition');
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={`h-5 w-5 rounded-full border-2 ${
                          queryType === 'condition' || queryType === 'selectiveDisclosure'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {(queryType === 'condition' || queryType === 'selectiveDisclosure') && (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Issuer DID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Issuer DID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={issuerDid}
              onChange={(e) => setIssuerDid(e.target.value)}
              placeholder="did:polygonid:polygon:main:2qE1BZ7gcmEoP2KppvFPCZqyzyb5tK9T6GUM5eR"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter issuer DID or use <span className="font-mono">*</span> to accept any issuer (not recommended)
            </p>
          </div>

          {/* Verification Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Verification Type
            </label>
            <select
              value={verificationType}
              onChange={(e) => {
                const newVerificationType = e.target.value as VerificationType;
                setVerificationType(newVerificationType);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="off-chain">Off-chain</option>
              <option value="on-chain">On-chain</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700">Advanced Options</span>
              {showAdvancedOptions ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {showAdvancedOptions && (
              <div className="border-t border-gray-200 p-4 space-y-6">
                {/* Circuit ID */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Circuit ID <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300">
                      <input
                        type="radio"
                        name="circuitId"
                        value="credentialAtomicQuerySigV2"
                        checked={circuitId === 'credentialAtomicQuerySigV2'}
                        onChange={(e) => {
                          setCircuitId(e.target.value as CircuitId);
                          setProofType('SIG');
                        }}
                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex-1 text-sm text-gray-700">Credential Atomic Query Signature v2</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300">
                      <input
                        type="radio"
                        name="circuitId"
                        value="credentialAtomicQueryMTPV2"
                        checked={circuitId === 'credentialAtomicQueryMTPV2'}
                        onChange={(e) => {
                          setCircuitId(e.target.value as CircuitId);
                          setProofType('MTP');
                        }}
                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex-1 text-sm text-gray-700">Credential Atomic Query MTP v2</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300">
                      <input
                        type="radio"
                        name="circuitId"
                        value="credentialAtomicQueryV3"
                        checked={circuitId === 'credentialAtomicQueryV3'}
                        onChange={(e) => {
                          setCircuitId(e.target.value as CircuitId);
                          // V3 can use either SIG or MTP, default to SIG
                          if (!proofType) {
                            setProofType('SIG');
                          }
                        }}
                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex-1 text-sm text-gray-700">Credential Atomic Query v3 (experimental)</span>
                    </label>
                  </div>
                  {circuitId && isV3 && (
                    <p className="mt-2 text-xs text-yellow-600">
                      ⚠️ V3 circuits are experimental. Use with caution.
                    </p>
                  )}
                </div>

                {/* Proof Type */}
                {circuitId && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Proof type <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {/* "Any" option - only for V3 circuits */}
                      {isV3 && (
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300">
                          <input
                            type="radio"
                            name="proofType"
                            value=""
                            checked={!proofType}
                            onChange={() => setProofType(null)}
                            className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className={`flex-1 text-sm ${!proofType ? 'text-gray-700' : 'text-gray-400'}`}>Any</span>
                        </label>
                      )}
                      {/* BJJSignature2021 - for SIG circuits or V3 */}
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                        circuitId === 'credentialAtomicQuerySigV2' || isV3
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}>
                        <input
                          type="radio"
                          name="proofType"
                          value="SIG"
                          checked={proofType === 'SIG'}
                          onChange={() => {
                            if (circuitId === 'credentialAtomicQuerySigV2' || isV3) {
                              setProofType('SIG');
                            }
                          }}
                          disabled={circuitId === 'credentialAtomicQueryMTPV2'}
                          className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500 disabled:cursor-not-allowed"
                        />
                        <span className={`flex-1 text-sm ${proofType === 'SIG' ? 'text-gray-700' : 'text-gray-400'}`}>BJJSignature2021</span>
                      </label>
                      {/* Iden3SparseMerkleTreeProof - for MTP circuits or V3 */}
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                        circuitId === 'credentialAtomicQueryMTPV2' || isV3
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}>
                        <input
                          type="radio"
                          name="proofType"
                          value="MTP"
                          checked={proofType === 'MTP'}
                          onChange={() => {
                            if (circuitId === 'credentialAtomicQueryMTPV2' || isV3) {
                              setProofType('MTP');
                            }
                          }}
                          disabled={circuitId === 'credentialAtomicQuerySigV2'}
                          className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500 disabled:cursor-not-allowed"
                        />
                        <span className={`flex-1 text-sm ${proofType === 'MTP' ? 'text-gray-700' : 'text-gray-400'}`}>Iden3SparseMerkleTreeProof</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Skip Revocation Check */}
                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={skipRevocationCheck}
                      onChange={(e) => setSkipRevocationCheck(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Skip Revocation Check
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-yellow-600">
                    ⚠️ Skipping revocation check is not recommended for production use
                  </p>
                </div>

              </div>
            )}
          </div>

          {/* Proof of Uniqueness (V3 only) */}
          {isV3 && (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableProofOfUniqueness}
                  onChange={(e) => setEnableProofOfUniqueness(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable Proof of Uniqueness
                </span>
              </label>
              {enableProofOfUniqueness && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nullifier Session ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={nullifierSessionId}
                    onChange={(e) => setNullifierSessionId(e.target.value)}
                    placeholder="e.g., 12345"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* On-chain Configuration */}
          {verificationType === 'on-chain' && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Network <span className="text-red-500">*</span>
                </label>
                <select
                  value={network || ''}
                  onChange={(e) => setNetwork(e.target.value as 'polygon-mainnet' | 'polygon-amoy' | null)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Select network</option>
                  <option value="polygon-mainnet">Polygon Mainnet</option>
                  <option value="polygon-amoy">Polygon Amoy</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Request ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  placeholder="Unique request identifier"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Smart Contract Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>
          )}

          {/* Test Query Button */}
          <div className="pt-4">
            <button
              onClick={handleTestQuery}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
            >
              Test Query
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Add Condition Modal */}
      <AddConditionModal
        isOpen={showAddConditionModal}
        onClose={() => {
          setShowAddConditionModal(false);
          setEditingCondition(null);
        }}
        onAdd={() => {
          // Only set query type if it's not already set to the correct mode
          // This prevents unnecessary state updates that could trigger side effects
          if (queryType !== addConditionMode) {
            setQueryType(addConditionMode);
          }
          setShowAddConditionModal(false);
          setEditingCondition(null);
        }}
        mode={addConditionMode}
        editingCondition={editingCondition}
      />

      {/* QR Code Modal */}
      {showQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Query QR Code</h3>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 flex justify-center">
              <div className="rounded-lg border-2 border-gray-200 p-4 bg-white">
                <QRCodeSVG
                  value={qrCodeData}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Query Data (JWZ)
              </label>
              <textarea
                value={qrCodeData}
                readOnly
                className="h-32 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs font-mono text-gray-700"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrCodeData);
                alert('Copied to clipboard!');
              }}
              className="w-full rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Copy Query Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

