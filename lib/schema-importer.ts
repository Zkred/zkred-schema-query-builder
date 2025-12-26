import { SchemaMetadata, Attribute, DataType } from './types';

interface ImportResult {
  success: boolean;
  error?: string;
  metadata?: SchemaMetadata;
  attributes?: Attribute[];
}

export function importJsonSchema(schemaData: unknown): ImportResult {
  try {
    // Validate it's an object
    if (typeof schemaData !== 'object' || schemaData === null) {
      return { success: false, error: 'Invalid schema format' };
    }

    const schema = schemaData as Record<string, unknown>;

    // Extract metadata
    const metadata: SchemaMetadata = {
      title: (schema.title as string) || 'Imported Schema',
      schemaType: (schema.type as string) || 'IMPORTED',
      version: (schema.version as string) || '1.0',
      description: (schema.description as string) || '',
      credentialType: 'merklized', // Default to merklized
    };

    // Extract credentialSubject properties
    const properties = schema.properties as Record<string, unknown> | undefined;
    const credentialSubject = properties?.credentialSubject as
      | Record<string, unknown>
      | undefined;

    if (!credentialSubject || typeof credentialSubject !== 'object') {
      return {
        success: false,
        error: 'Schema must contain a credentialSubject property',
      };
    }

    const credentialSubjectProperties = (credentialSubject.properties as Record<
      string,
      unknown
    >) || {};

    // Build attributes recursively
    const buildAttribute = (
      name: string,
      property: Record<string, unknown>,
      parentId?: string
    ): Attribute | null => {
      const propertyType = property.type as string | string[] | undefined;

      // Skip array and null types
      if (Array.isArray(propertyType)) {
        // If it's an array of types, use the first non-array type
        const nonArrayType = propertyType.find((t) => t !== 'array' && t !== 'null');
        if (!nonArrayType) return null;
      } else if (propertyType === 'array' || propertyType === 'null') {
        return null;
      }

      const dataType = (Array.isArray(propertyType)
        ? propertyType.find((t) => t !== 'array' && t !== 'null') || 'string'
        : propertyType || 'string') as DataType;

      // Skip if still array or null
      if (dataType === 'array' || dataType === 'null') {
        return null;
      }

      const attributeId = parentId ? `${parentId}-${name}` : `credentialSubject-${name}`;

      const attribute: Attribute = {
        id: attributeId,
        name,
        title: (property.title as string) || name,
        dataType,
        description: (property.description as string) || '',
        required: false,
        parentId: parentId || 'credentialSubject',
      };

      // Handle constraints
      if (dataType === 'number' || dataType === 'integer') {
        const constraints: Record<string, number> = {};
        if (property.exclusiveMinimum !== undefined) {
          constraints.exclusiveMinimum = property.exclusiveMinimum as number;
        }
        if (property.maximum !== undefined) {
          constraints.maximum = property.maximum as number;
        }
        if (property.minimum !== undefined) {
          constraints.minimum = property.minimum as number;
        }
        if (property.exclusiveMaximum !== undefined) {
          constraints.exclusiveMaximum = property.exclusiveMaximum as number;
        }
        if (property.multipleOf !== undefined) {
          constraints.multipleOf = property.multipleOf as number;
        }
        if (property.default !== undefined) {
          constraints.default = property.default as number;
        }
        if (Object.keys(constraints).length > 0) {
          attribute.constraints = constraints;
        }
      }

      // Handle format
      if (property.format) {
        if (!attribute.constraints) {
          attribute.constraints = {};
        }
        attribute.constraints.format = property.format as string;
      }

      // Handle nested object properties
      if (dataType === 'object' && property.properties) {
        const nestedProperties = property.properties as Record<string, unknown>;
        attribute.children = [];

        Object.entries(nestedProperties).forEach(([childName, childProperty]) => {
          if (
            typeof childProperty === 'object' &&
            childProperty !== null &&
            !Array.isArray(childProperty)
          ) {
            const childAttr = buildAttribute(
              childName,
              childProperty as Record<string, unknown>,
              attributeId
            );
            if (childAttr) {
              attribute.children.push(childAttr);
            }
          }
        });
      }

      return attribute;
    };

    // Build credentialSubject attribute with children
    const credentialSubjectAttribute: Attribute = {
      id: 'credentialSubject',
      name: 'credentialSubject',
      title: (credentialSubject.title as string) || 'Credential subject',
      dataType: 'object',
      description: (credentialSubject.description as string) || 'Stores the data of the credential',
      required: true,
      children: [
        // Add default id field
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

    // Process all properties
    Object.entries(credentialSubjectProperties).forEach(([name, property]) => {
      // Skip the default id field as we add it manually
      if (name === 'id') return;

      if (typeof property === 'object' && property !== null && !Array.isArray(property)) {
        const attr = buildAttribute(name, property as Record<string, unknown>);
        if (attr) {
          credentialSubjectAttribute.children!.push(attr);
        }
      }
    });

    return {
      success: true,
      metadata,
      attributes: [credentialSubjectAttribute],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse schema',
    };
  }
}

