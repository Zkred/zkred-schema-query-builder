import { QueryBuilderState, ZKQuery, QueryRequest, Operator, ConditionItem, QueryObject, CircuitId, ProofType } from './query-types';

interface ExtendedQueryState extends QueryBuilderState {
  conditions?: ConditionItem[];
}

export function generateZKQuery(state: ExtendedQueryState): ZKQuery | null {
  if (!state.jsonLdContextUrl || !state.schemaType) {
    return null;
  }

  const query: ZKQuery = {
    context: state.jsonLdContextUrl,
    type: state.schemaType,
  };

  // Add issuer DID (or wildcard)
  // Always include allowedIssuers - use wildcard if not specified or explicitly set to '*'
  if (state.issuerDid && state.issuerDid !== '*') {
    query.allowedIssuers = [state.issuerDid];
  } else {
    query.allowedIssuers = ['*'];
  }

  // Add skip revocation check
  if (state.skipRevocationCheck) {
    query.skipClaimRevocationCheck = true;
  }

  // Build credential subject query
  if (state.queryType === 'credentialIssued') {
    // For credential issued, we don't need attribute conditions
    query.credentialSubject = {};
    return query;
  }

  // Use conditions array if available, otherwise fall back to single operator/value
  const conditions = state.conditions || [];
  
  // If no conditions and no single operator/value, return null
  if (conditions.length === 0) {
    if (!state.operator || state.attributeValue === null) {
      return null;
    }
    // Fall back to single condition for backward compatibility
    const attributePath = state.selectedAttributePath;
    if (!attributePath) return null;
    
    const operator = state.operator;
    const value = state.attributeValue;
    const operatorValue = buildOperatorValue(operator, value);
    if (operatorValue === null) return null;

    query.credentialSubject = {
      [attributePath]: operatorValue,
    };
    return query;
  }

  // Build credential subject from conditions array
  query.credentialSubject = {};
  
  for (const condition of conditions) {
    // For selective disclosure, just add the attribute path without operator/value
    // The value will be revealed in the proof
    if (condition.type === 'selectiveDisclosure') {
      query.credentialSubject[condition.attributePath] = {};
      continue;
    }

    // For conditions, build the operator value
    const operatorValue = buildOperatorValue(condition.operator, condition.value);
    if (operatorValue === null) continue;

    // If attribute already exists, we need to merge operators
    if (query.credentialSubject[condition.attributePath]) {
      // For now, we'll overwrite - in a real implementation, you might want to merge
      query.credentialSubject[condition.attributePath] = operatorValue;
    } else {
      query.credentialSubject[condition.attributePath] = operatorValue;
    }
  }

  // If no valid conditions were added, return null
  if (Object.keys(query.credentialSubject).length === 0) {
    return null;
  }

  return query;
}

function buildOperatorValue(operator: Operator, value: string | number | boolean | [number, number] | (string | number | boolean)[] | null): { [key: string]: unknown } | string | number | boolean | [number, number] | (string | number | boolean)[] | null {
  switch (operator) {
    case 'eq':
      return value;
    case 'neq':
      return { $ne: value };
    case 'in':
      return { $in: Array.isArray(value) ? value : [value] };
    case 'nin':
      return { $nin: Array.isArray(value) ? value : [value] };
    case 'lt':
      return { $lt: value };
    case 'gt':
      return { $gt: value };
    case 'lte':
      return { $lte: value };
    case 'gte':
      return { $gte: value };
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return { $between: [value[0], value[1]] };
      }
      return null;
    case 'nonbetween':
      if (Array.isArray(value) && value.length === 2) {
        return { $nonbetween: [value[0], value[1]] };
      }
      return null;
    case 'exists':
      // If value is explicitly false, return $exists: false, otherwise default to true
      if (value === false || value === 'false') {
        return { $exists: false };
      }
      return { $exists: true };
    default:
      return null;
  }
}

export function generateQueryRequest(
  state: QueryBuilderState,
  verifierDid?: string
): QueryRequest | null {
  const query = generateZKQuery(state);
  if (!query) {
    return null;
  }

  // Determine request type based on verification type
  const requestType = state.verificationType === 'on-chain'
    ? 'https://iden3-communication.io/proofs/1.0/contract-based-request'
    : 'https://iden3-communication.io/authorization/1.0/request';

  const request: QueryRequest = {
    id: '1',
    typ: 'application/iden3comm-plain-json',
    type: requestType,
    body: {
      reason: 'Query verification',
      query,
    },
  };

  // Add verifier for on-chain verification
  if (state.verificationType === 'on-chain' && verifierDid) {
    request.body.verifier = verifierDid;
  }

  // Add callback URL for off-chain verification (optional)
  if (state.verificationType === 'off-chain') {
    // Can be set by user if needed
  }

  return request;
}

export function getAvailableCircuits(proofType: ProofType | null): CircuitId[] {
  if (!proofType) {
    return [];
  }

  if (proofType === 'SIG') {
    return [
      'credentialAtomicQuerySigV2',
      'credentialAtomicQuerySigV2OnChain',
      'credentialAtomicQueryV3',
      'credentialAtomicQueryV3OnChain',
    ];
  } else {
    // MTP
    return [
      'credentialAtomicQueryMTPV2',
      'credentialAtomicQueryMTPV2OnChain',
      'credentialAtomicQueryV3',
      'credentialAtomicQueryV3OnChain',
    ];
  }
}

export function isV3Circuit(circuitId: CircuitId | null): boolean {
  if (!circuitId) return false;
  return circuitId.includes('V3');
}

export function isOnChainCircuit(circuitId: CircuitId | null): boolean {
  if (!circuitId) return false;
  return circuitId.includes('OnChain');
}

/**
 * Map circuit ID from form to query format
 */
function mapCircuitIdToQueryFormat(circuitId: CircuitId | null, proofType: ProofType | null, isLinkedQuery: boolean = false): string {
  // For linked queries (multiple conditions), use linkedMultiQuery
  if (isLinkedQuery) {
    return 'linkedMultiQuery10-beta.1';
  }

  // If no circuit ID selected, default to V3
  if (!circuitId) {
    return proofType === 'MTP' 
      ? 'credentialAtomicQueryMTPV3-beta.1'
      : 'credentialAtomicQueryV3-beta.1';
  }

  // Map V3 circuits to beta.1 format
  if (isV3Circuit(circuitId)) {
    if (circuitId === 'credentialAtomicQueryV3') {
      return proofType === 'MTP' 
        ? 'credentialAtomicQueryMTPV3-beta.1'
        : 'credentialAtomicQueryV3-beta.1';
    } else if (circuitId === 'credentialAtomicQueryV3OnChain') {
      return proofType === 'MTP'
        ? 'credentialAtomicQueryMTPV3OnChain-beta.1'
        : 'credentialAtomicQueryV3OnChain-beta.1';
    }
  }

  // V2 circuits return as-is (no beta suffix)
  return circuitId;
}

/**
 * Generate an array of query objects, one per condition/selective disclosure
 * This format is used for the query builder output
 */
export function generateQueryObjects(state: ExtendedQueryState): QueryObject[] {
  if (!state.jsonLdContextUrl || !state.schemaType) {
    return [];
  }

  // Handle Credential Possession (credentialIssued) - no conditions needed
  if (state.queryType === 'credentialIssued') {
    const query: ZKQuery = {
      context: state.jsonLdContextUrl,
      type: state.schemaType,
      allowedIssuers: state.issuerDid && state.issuerDid !== '*' 
        ? [state.issuerDid] 
        : ['*'],
    };

    // Add skip revocation check
    if (state.skipRevocationCheck) {
      query.skipClaimRevocationCheck = true;
    }

    // Note: credentialSubject is not included for credentialIssued queries

    const queryObject: QueryObject = {
      circuitId: mapCircuitIdToQueryFormat(state.circuitId, state.proofType, false),
      id: Date.now(),
      query,
    };

    return [queryObject];
  }

  // Use conditions array if available
  const conditions = state.conditions || [];
  
  if (conditions.length === 0) {
    return [];
  }

  // Determine if we need linked queries (multiple conditions)
  const isLinkedQuery = conditions.length > 1;
  
  // Generate a groupId for linked queries
  const groupId = isLinkedQuery ? Date.now() : undefined;
  
  // Generate one query object per condition
  const queryObjects: QueryObject[] = conditions.map((condition, index) => {
    // Generate unique ID for each query (timestamp + index for uniqueness)
    const id = Date.now() + index;

    // Use the selected circuit ID from the form, mapped to correct format
    // For linked queries, always use linkedMultiQuery
    const circuitId = mapCircuitIdToQueryFormat(state.circuitId, state.proofType, isLinkedQuery);

    // Build base query
    const query: ZKQuery = {
      context: state.jsonLdContextUrl,
      type: state.schemaType,
      allowedIssuers: state.issuerDid && state.issuerDid !== '*' 
        ? [state.issuerDid] 
        : ['*'],
    };

    // Add skip revocation check
    if (state.skipRevocationCheck) {
      query.skipClaimRevocationCheck = true;
    }

    // Build credential subject with single attribute
    query.credentialSubject = {};

    // For selective disclosure, use empty object
    if (condition.type === 'selectiveDisclosure') {
      query.credentialSubject[condition.attributePath] = {};
    } else {
      // For conditions, build the operator value
      const operatorValue = buildOperatorValue(condition.operator, condition.value);
      if (operatorValue !== null) {
        query.credentialSubject[condition.attributePath] = operatorValue;
      }
    }

    // Build query object
    const queryObject: QueryObject = {
      circuitId,
      id,
      query,
    };

    // Add groupId for linked queries (all queries except the first one)
    if (groupId && index > 0) {
      queryObject.groupId = groupId;
    }

    return queryObject;
  });

  return queryObjects;
}

