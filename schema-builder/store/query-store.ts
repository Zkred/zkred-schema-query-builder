import { create } from 'zustand';
import { QueryBuilderState, ProofType, CircuitId, VerificationType, ConditionItem } from '@/lib/query-types';
import { Attribute } from '@/lib/types';

interface QueryStore extends QueryBuilderState {
  queryAttributes: Attribute[];
  conditions: ConditionItem[];
  setJsonLdContextUrl: (url: string) => void;
  setSchemaType: (type: string) => void;
  setSelectedAttributePath: (path: string | null) => void;
  setProofType: (type: ProofType | null) => void;
  setCircuitId: (id: CircuitId | null) => void;
  setEnableProofOfUniqueness: (enabled: boolean) => void;
  setNullifierSessionId: (id: string) => void;
  setQueryType: (type: QueryBuilderState['queryType']) => void;
  setOperator: (op: QueryBuilderState['operator']) => void;
  setAttributeValue: (value: QueryBuilderState['attributeValue']) => void;
  setIssuerDid: (did: string) => void;
  setSkipRevocationCheck: (skip: boolean) => void;
  setVerificationType: (type: VerificationType) => void;
  setNetwork: (network: QueryBuilderState['network']) => void;
  setRequestId: (id: string) => void;
  setContractAddress: (address: string) => void;
  setQueryAttributes: (attributes: Attribute[]) => void;
  getQueryAttribute: (path: string) => Attribute | null;
  addCondition: (condition: ConditionItem) => void;
  updateCondition: (id: string, condition: Partial<ConditionItem>) => void;
  removeCondition: (id: string) => void;
  clearConditions: () => void;
  reset: () => void;
}

const defaultCredentialSubject: Attribute = {
  id: 'credentialSubject',
  name: 'credentialSubject',
  title: 'Credential subject',
  dataType: 'object',
  description: 'Stores the data of the credential',
  required: true,
  children: [
    {
      id: 'credentialSubject-id',
      name: 'id',
      title: 'Credential subject ID',
      dataType: 'uri',
      description: 'Stores the DID of the subject that owns the credential',
      required: false,
      constraints: { format: 'uri' },
      parentId: 'credentialSubject',
    },
  ],
};

const initialState: QueryBuilderState & { queryAttributes: Attribute[]; conditions: ConditionItem[] } = {
  jsonLdContextUrl: '',
  schemaType: '',
  selectedAttributePath: null,
  proofType: 'SIG',
  circuitId: 'credentialAtomicQueryV3',
  enableProofOfUniqueness: false,
  nullifierSessionId: '',
  queryType: 'condition',
  operator: null,
  attributeValue: null,
  issuerDid: '',
  skipRevocationCheck: false,
  verificationType: 'off-chain',
  network: null,
  requestId: '',
  contractAddress: '',
  queryAttributes: [defaultCredentialSubject],
  conditions: [],
};

export const useQueryStore = create<QueryStore>((set, get) => ({
  ...initialState,

  setJsonLdContextUrl: (url) => set({ jsonLdContextUrl: url }),
  setSchemaType: (type) => set({ schemaType: type }),
  setSelectedAttributePath: (path) => set({ selectedAttributePath: path }),
  setProofType: (type) => set({ proofType: type }),
  setCircuitId: (id) => set({ circuitId: id }),
  setEnableProofOfUniqueness: (enabled) => set({ enableProofOfUniqueness: enabled }),
  setNullifierSessionId: (id) => set({ nullifierSessionId: id }),
  setQueryType: (type) => set({ queryType: type }),
  setOperator: (op) => set({ operator: op }),
  setAttributeValue: (value) => set({ attributeValue: value }),
  setIssuerDid: (did) => set({ issuerDid: did }),
  setSkipRevocationCheck: (skip) => set({ skipRevocationCheck: skip }),
  setVerificationType: (type) => set({ verificationType: type }),
  setNetwork: (network) => set({ network }),
  setRequestId: (id) => set({ requestId: id }),
  setContractAddress: (address) => set({ contractAddress: address }),
  setQueryAttributes: (attributes) => set({ queryAttributes: attributes }),
  addCondition: (condition) => set((state) => ({ conditions: [...state.conditions, condition] })),
  updateCondition: (id, condition) => set((state) => ({
    conditions: state.conditions.map((c) => (c.id === id ? { ...c, ...condition } : c)),
  })),
  removeCondition: (id) => set((state) => ({
    conditions: state.conditions.filter((c) => c.id !== id),
  })),
  clearConditions: () => set({ conditions: [] }),
  getQueryAttribute: (path) => {
    const findAttribute = (attrs: Attribute[], pathParts: string[]): Attribute | null => {
      if (pathParts.length === 0) return null;
      
      const [first, ...rest] = pathParts;
      let current: Attribute | undefined;
      
      // Find the attribute matching the first path part
      for (const attr of attrs) {
        if (attr.name === first || attr.id === first) {
          current = attr;
          break;
        }
        if (attr.children) {
          const found = findAttribute(attr.children, [first]);
          if (found) {
            current = found;
            break;
          }
        }
      }
      
      if (!current) return null;
      if (rest.length === 0) return current;
      
      // Continue searching in children
      if (current.children) {
        return findAttribute(current.children, rest);
      }
      
      return null;
    };
    
    const pathParts = path.split('.').filter(p => p && p !== 'credentialSubject');
    return findAttribute(get().queryAttributes, pathParts);
  },
  reset: () => set(initialState),
}));

