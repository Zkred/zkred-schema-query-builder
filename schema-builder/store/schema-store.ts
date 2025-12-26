import { create } from 'zustand';
import { SchemaState, SchemaMetadata, Attribute, CredentialType } from '@/lib/types';

interface SchemaStore extends SchemaState {
  setMetadata: (metadata: Partial<SchemaMetadata>) => void;
  setCurrentStep: (step: 1 | 2) => void;
  addAttribute: (attribute: Omit<Attribute, 'id'>, parentId?: string) => void;
  updateAttribute: (id: string, updates: Partial<Attribute>) => void;
  removeAttribute: (id: string) => void;
  selectAttribute: (id: string | null) => void;
  getAttribute: (id: string) => Attribute | undefined;
  getAttributesByParent: (parentId?: string) => Attribute[];
  reset: () => void;
}

const defaultMetadata: SchemaMetadata = {
  title: 'First Schema',
  schemaType: 'POH',
  version: '1.0',
  description: 'POH',
  credentialType: 'merklized',
};

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

const initialState: SchemaState = {
  currentStep: 1,
  metadata: defaultMetadata,
  attributes: [defaultCredentialSubject],
  selectedAttributeId: null,
};

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  ...initialState,

  setMetadata: (metadata) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),

  setCurrentStep: (step) => set({ currentStep: step }),

  addAttribute: (attribute, parentId) => {
    const newId = `${parentId || 'root'}-${Date.now()}`;
    const newAttribute: Attribute = {
      ...attribute,
      id: newId,
      parentId: parentId || 'credentialSubject',
    };

    set((state) => {
      const updateAttribute = (attrs: Attribute[]): Attribute[] => {
        return attrs.map((attr) => {
          if (attr.id === parentId || (!parentId && attr.id === 'credentialSubject')) {
            return {
              ...attr,
              children: [...(attr.children || []), newAttribute],
            };
          }
          if (attr.children) {
            return {
              ...attr,
              children: updateAttribute(attr.children),
            };
          }
          return attr;
        });
      };

      return {
        attributes: updateAttribute(state.attributes),
      };
    });
  },

  updateAttribute: (id, updates) => {
    set((state) => {
      const updateAttribute = (attrs: Attribute[]): Attribute[] => {
        return attrs.map((attr) => {
          if (attr.id === id) {
            const updated = { ...attr, ...updates };
            // If changing to object type and no children exist, initialize empty children array
            if (updates.dataType === 'object' && !updated.children) {
              updated.children = [];
            }
            // If changing away from object type, remove children
            if (updates.dataType && updates.dataType !== 'object' && updated.children) {
              updated.children = undefined;
            }
            return updated;
          }
          if (attr.children) {
            return {
              ...attr,
              children: updateAttribute(attr.children),
            };
          }
          return attr;
        });
      };

      return {
        attributes: updateAttribute(state.attributes),
      };
    });
  },

  removeAttribute: (id) => {
    set((state) => {
      const removeFromArray = (attrs: Attribute[]): Attribute[] => {
        return attrs
          .filter((attr) => attr.id !== id)
          .map((attr) => {
            if (attr.children) {
              return {
                ...attr,
                children: removeFromArray(attr.children),
              };
            }
            return attr;
          });
      };

      return {
        attributes: removeFromArray(state.attributes),
        selectedAttributeId: state.selectedAttributeId === id ? null : state.selectedAttributeId,
      };
    });
  },

  selectAttribute: (id) => set({ selectedAttributeId: id }),

  getAttribute: (id) => {
    const findAttribute = (attrs: Attribute[]): Attribute | undefined => {
      for (const attr of attrs) {
        if (attr.id === id) return attr;
        if (attr.children) {
          const found = findAttribute(attr.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findAttribute(get().attributes);
  },

  getAttributesByParent: (parentId) => {
    const findParent = (attrs: Attribute[]): Attribute[] | undefined => {
      for (const attr of attrs) {
        if (attr.id === parentId) return attr.children || [];
        if (attr.children) {
          const found = findParent(attr.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findParent(get().attributes) || [];
  },

  reset: () => set(initialState),
}));

