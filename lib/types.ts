export type CredentialType = 'merklized' | 'non-merklized';

export type DataType = 
  | 'string' 
  | 'number' 
  | 'integer'
  | 'boolean' 
  | 'uri' 
  | 'date-time'
  | 'object';

export interface SchemaMetadata {
  title: string;
  schemaType: string;
  version: string;
  description: string;
  credentialType: CredentialType;
}

export interface AttributeConstraints {
  exclusiveMinimum?: number;
  maximum?: number;
  minimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  default?: string | number | boolean;
  enum?: (string | number | boolean)[];
  const?: string | number | boolean;
  examples?: (string | number | boolean)[];
  comment?: string;
}

export interface Attribute {
  id: string;
  name: string;
  title: string;
  dataType: DataType;
  description: string;
  required: boolean;
  constraints?: AttributeConstraints;
  children?: Attribute[];
  parentId?: string;
}

export interface SchemaState {
  currentStep: 1 | 2;
  metadata: SchemaMetadata;
  attributes: Attribute[];
  selectedAttributeId: string | null;
}

export interface JsonSchema {
  $metadata?: {
    uris?: string[];
    jsonLdContext?: string;
  };
  $schema: string;
  version: string;
  type: string; // Schema type (e.g., "POH")
  title: string;
  description: string;
  properties: {
    credentialSubject: {
      description: string;
      title: string;
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
    id?: {
      type: string;
    };
    issuer?: {
      type: string | string[];
      format?: string;
    };
    issuanceDate?: {
      type: string;
      format: string;
    };
    expirationDate?: {
      type: string;
      format: string;
    };
    '@context'?: {
      type: string | string[];
    };
  };
  required: string[];
}

