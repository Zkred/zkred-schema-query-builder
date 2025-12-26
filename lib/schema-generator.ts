import { SchemaMetadata, Attribute, JsonSchema } from './types';

export function generateJsonSchema(
  metadata: SchemaMetadata,
  attributes: Attribute[]
): JsonSchema {
  const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');
  
  if (!credentialSubject) {
    throw new Error('credentialSubject attribute is required');
  }

  const credentialSubjectProperties: Record<string, Record<string, unknown>> = {};
  const credentialSubjectRequired: string[] = [];

  // Recursive function to process attributes and their nested children
  const processAttribute = (
    attr: Attribute,
    targetProperties: Record<string, Record<string, unknown>>,
    targetRequired: string[]
  ) => {
    if (attr.id === 'credentialSubject') {
      // Process children of credentialSubject
      if (attr.children) {
        attr.children.forEach((child) => {
          if (child.id !== 'credentialSubject-id') {
            processAttribute(child, targetProperties, targetRequired);
          }
        });
      }
      return;
    }

    const property: Record<string, unknown> = {
      type: attr.dataType,
      title: attr.title,
      description: attr.description,
    };

    // Add format for specific types (only if not overridden by constraints)
    if (attr.dataType === 'uri' && !attr.constraints?.format) {
      property.format = 'uri';
    }

    if (attr.dataType === 'date-time' && !attr.constraints?.format) {
      property.format = 'date-time';
    }

    // Handle nested object properties
    if (attr.dataType === 'object' && attr.children && attr.children.length > 0) {
      const nestedProperties: Record<string, Record<string, unknown>> = {};
      const nestedRequired: string[] = [];
      
      // Process nested children
      attr.children.forEach((child) => {
        if (child.id !== 'credentialSubject-id') {
          processAttribute(child, nestedProperties, nestedRequired);
        }
      });
      
      property.properties = nestedProperties;
      property.required = nestedRequired;
      property.type = 'object';
    }

    // Add constraints
    if (attr.constraints) {
      if (attr.constraints.exclusiveMinimum !== undefined) {
        property.exclusiveMinimum = attr.constraints.exclusiveMinimum;
      }
      if (attr.constraints.maximum !== undefined) {
        property.maximum = attr.constraints.maximum;
      }
      if (attr.constraints.minimum !== undefined) {
        property.minimum = attr.constraints.minimum;
      }
      if (attr.constraints.exclusiveMaximum !== undefined) {
        property.exclusiveMaximum = attr.constraints.exclusiveMaximum;
      }
      if (attr.constraints.minLength !== undefined) {
        property.minLength = attr.constraints.minLength;
      }
      if (attr.constraints.maxLength !== undefined) {
        property.maxLength = attr.constraints.maxLength;
      }
      if (attr.constraints.pattern) {
        property.pattern = attr.constraints.pattern;
      }
      if (attr.constraints.format) {
        property.format = attr.constraints.format;
      }
      if (attr.constraints.multipleOf !== undefined) {
        property.multipleOf = attr.constraints.multipleOf;
      }
      if (attr.constraints.default !== undefined) {
        property.default = attr.constraints.default;
      }
      if (attr.constraints.enum && attr.constraints.enum.length > 0) {
        property.enum = attr.constraints.enum;
      }
      if (attr.constraints.const !== undefined) {
        property.const = attr.constraints.const;
      }
      if (attr.constraints.examples && attr.constraints.examples.length > 0) {
        property.examples = attr.constraints.examples;
      }
      if (attr.constraints.comment) {
        property.$comment = attr.constraints.comment;
      }
    }

    targetProperties[attr.name] = property;

    if (attr.required) {
      targetRequired.push(attr.name);
    }
  };

  // Process all attributes
  attributes.forEach((attr) => {
    processAttribute(attr, credentialSubjectProperties, credentialSubjectRequired);
  });

  // Create ordered properties object with id first, then other attributes
  // This ensures id appears first in credentialSubject.properties (matching Privado ID format)
  const orderedCredentialSubjectProperties: Record<string, Record<string, unknown>> = {
    id: {
      type: 'string',
      title: 'Credential subject ID',
      description: 'Stores the DID of the subject that owns the credential',
      format: 'uri',
    },
    ...credentialSubjectProperties,
  };

  const schema: JsonSchema = {
    $metadata: {
      uris: [],
      jsonLdContext: 'https://example.com/path/to/file/context.jsonld',
    },
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    version: metadata.version,
    type: metadata.schemaType,
    title: metadata.title,
    description: metadata.description,
    properties: {
      credentialSubject: {
        description: credentialSubject.description,
        title: credentialSubject.title,
        type: 'object',
        properties: orderedCredentialSubjectProperties,
        required: credentialSubjectRequired,
      },
      id: {
        type: 'string',
      },
      issuer: {
        type: ['string', 'object'],
        format: 'uri',
      },
      issuanceDate: {
        type: 'string',
        format: 'date-time',
      },
      expirationDate: {
        type: 'string',
        format: 'date-time',
      },
      '@context': {
        type: ['string', 'array'],
      },
    },
    required: [],
  };

  return schema;
}

export interface JsonLdContext {
  '@context': Array<{
    '@protected': boolean;
    '@version': number;
    id: string;
    type: string;
    [key: string]: unknown;
  }>;
}

export function generateJsonLdContext(
  metadata: SchemaMetadata,
  attributes: Attribute[]
): JsonLdContext {
  const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');
  
  if (!credentialSubject) {
    throw new Error('credentialSubject attribute is required');
  }

  // Generate UUID for the schema (in production, this would be a real UUID)
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const schemaId = `urn:uuid:${generateUUID()}`;
  const vocabUUID = `urn:uuid:${generateUUID()}`;

  // Map data types to XSD types
  const mapDataTypeToXsd = (dataType: string): string => {
    switch (dataType) {
      case 'number':
        return 'xsd:double';
      case 'boolean':
        return 'xsd:boolean';
      case 'date-time':
        return 'xsd:dateTime';
      case 'uri':
        return 'xsd:anyURI';
      case 'array':
        return 'xsd:array';
      case 'object':
        return 'xsd:object';
      default:
        return 'xsd:string';
    }
  };

  // Recursive function to process attributes into JSON-LD context
  const processAttribute = (
    attr: Attribute,
    parentPath: string = ''
  ): Record<string, Record<string, unknown>> | null => {
    if (attr.id === 'credentialSubject' || attr.id === 'credentialSubject-id') {
      return null;
    }

    const attributePath = parentPath ? `${parentPath}.${attr.name}` : attr.name;
    const attributeId = `iden3-vocab:${attributePath}`;
    const xsdType = mapDataTypeToXsd(attr.dataType);

    // If it's an object with children, create nested context
    if (attr.dataType === 'object' && attr.children && attr.children.length > 0) {
      const nestedContext: Record<string, Record<string, unknown>> = {};
      
      attr.children.forEach((child) => {
        if (child.id !== 'credentialSubject-id') {
          const childContext = processAttribute(child, attributePath);
          if (childContext) {
            Object.assign(nestedContext, childContext);
          }
        }
      });

      return {
        [attr.name]: {
          '@context': nestedContext,
          '@id': attributeId,
        },
      };
    }

    // Simple attribute
    return {
      [attr.name]: {
        '@id': attributeId,
        '@type': xsdType,
      },
    };
  };

  // Build the context object
  const contextObject: Record<string, Record<string, unknown>> = {};

  if (credentialSubject.children) {
    credentialSubject.children.forEach((child) => {
      if (child.id !== 'credentialSubject-id') {
        const childContext = processAttribute(child);
        if (childContext) {
          Object.assign(contextObject, childContext);
        }
      }
    });
  }

  // Build the final JSON-LD Context structure
  const jsonLdContext: JsonLdContext = {
    '@context': [
      {
        '@protected': true,
        '@version': 1.1,
        id: '@id',
        type: '@type',
        [metadata.schemaType]: {
          '@context': {
            '@propagate': true,
            '@protected': true,
            'iden3-vocab': `${vocabUUID}#`,
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            ...contextObject,
          },
          '@id': schemaId,
        },
      },
    ],
  };

  return jsonLdContext;
}

export function validateNonMerklizedAttributes(attributes: Attribute[]): {
  valid: boolean;
  error?: string;
} {
  const credentialSubject = attributes.find((attr) => attr.id === 'credentialSubject');
  if (!credentialSubject) {
    return { valid: false, error: 'credentialSubject is required' };
  }

  const countAttributes = (children?: Attribute[]): number => {
    if (!children) return 0;
    return children.filter((child) => child.id !== 'credentialSubject-id').length;
  };

  const attributeCount = countAttributes(credentialSubject.children);
  
  if (attributeCount > 4) {
    return {
      valid: false,
      error: 'Non-merklized credentials support a maximum of 4 attributes',
    };
  }

  return { valid: true };
}

