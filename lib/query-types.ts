export type ProofType = 'SIG' | 'MTP';

export type CircuitId =
  | 'credentialAtomicQuerySigV2'
  | 'credentialAtomicQuerySigV2OnChain'
  | 'credentialAtomicQueryMTPV2'
  | 'credentialAtomicQueryMTPV2OnChain'
  | 'credentialAtomicQueryV3'
  | 'credentialAtomicQueryV3OnChain';

export type QueryType = 'condition' | 'selectiveDisclosure' | 'credentialIssued';

export type Operator =
  | 'eq' // Is equal to
  | 'neq' // Is not equal to
  | 'in' // Matches one of the values
  | 'nin' // Matches none of the values
  | 'lt' // Is less than
  | 'gt' // Is greater than
  | 'lte' // Is less than or equal to
  | 'gte' // Is greater than or equal to
  | 'between' // Falls within the range
  | 'nonbetween' // Falls outside the range
  | 'exists'; // Exists

export type VerificationType = 'off-chain' | 'on-chain';

export interface ConditionItem {
  id: string;
  type: 'condition' | 'selectiveDisclosure';
  attributePath: string;
  operator: Operator;
  value: string | number | boolean | [number, number] | (string | number | boolean)[] | null;
}

export interface QueryBuilderState {
  // Schema reference
  jsonLdContextUrl: string;
  schemaType: string;
  selectedAttributePath: string | null;
  
  // Proof configuration
  proofType: ProofType | null;
  circuitId: CircuitId | null;
  
  // Proof of Uniqueness (v3 only)
  enableProofOfUniqueness: boolean;
  nullifierSessionId: string;
  
  // Query configuration
  queryType: QueryType;
  operator: Operator | null;
  attributeValue: string | number | boolean | [number, number] | (string | number | boolean)[] | null;
  
  // Issuer
  issuerDid: string;
  skipRevocationCheck: boolean;
  
  // On-chain verification
  verificationType: VerificationType;
  network: 'polygon-mainnet' | 'polygon-amoy' | null;
  requestId: string;
  contractAddress: string;
}

export interface ZKQuery {
  allowedIssuers?: string[];
  credentialSubject?: {
    [key: string]: {
      [operator: string]: any;
    } | {}; // Empty object for selective disclosure
  };
  context: string;
  type: string;
  skipClaimRevocationCheck?: boolean;
}

export interface QueryRequest {
  id: string;
  typ: string;
  type: string;
  body: {
    reason?: string;
    query: ZKQuery;
    verifier?: string;
    callbackUrl?: string;
  };
}

export interface QueryObject {
  circuitId: string;
  id: number;
  query: ZKQuery;
  groupId?: number;
}

