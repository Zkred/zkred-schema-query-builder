export interface PrivadoSchema {
  id: string;
  title: string;
  description?: string;
  url: string;
  contextURL: string;
  type: string;
  version: string;
  author?: {
    ethereumAddress: string;
  };
  createdAt?: string;
  hash?: string;
  bigint?: string;
  tags?: string[];
  vocabURL?: string;
}

export interface PrivadoSchemasResponse {
  items: PrivadoSchema[];
  meta: {
    max_results: number;
    page: number;
    total: number;
  };
}

export interface SchemaDetails {
  '@context': string | string[];
  type: string | string[];
  version?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Fetches available schemas from Privado API
 */
export async function fetchPrivadoSchemas(
  maxResults: number = 1000,
  page: number = 1
): Promise<PrivadoSchemasResponse> {
  try {
    const response = await fetch(
      `https://tools-api.privado.id/schemas?max_results=${maxResults}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'origin': 'https://tools.privado.id',
          'referer': 'https://tools.privado.id/',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch schemas: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the response to match our interface
    return {
      items: data.items || [],
      meta: data.meta || {
        max_results: maxResults,
        page: page,
        total: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching schemas:', error);
    throw error;
  }
}

/**
 * Fetches schema details from IPFS URL
 */
export async function fetchSchemaFromIPFS(ipfsUrl: string): Promise<SchemaDetails> {
  try {
    // Handle both direct IPFS URLs and gateway URLs
    let fetchUrl = ipfsUrl;
    
    // If it's an IPFS hash, convert to gateway URL
    if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('baf')) {
      fetchUrl = `https://ipfs.io/ipfs/${ipfsUrl}`;
    } else if (ipfsUrl.includes('ipfs://')) {
      fetchUrl = ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schema from IPFS: ${response.statusText}`);
    }

    const schema = await response.json();
    return schema;
  } catch (error) {
    console.error('Error fetching schema from IPFS:', error);
    throw error;
  }
}

/**
 * Extracts JSON-LD context URL from schema details
 */
export function extractJsonLdContext(schema: SchemaDetails): string | null {
  const context = schema['@context'];
  
  if (typeof context === 'string') {
    return context;
  }
  
  if (Array.isArray(context)) {
    // Find the first string that looks like a URL
    const urlContext = context.find((c) => typeof c === 'string' && c.startsWith('http'));
    return urlContext || null;
  }
  
  return null;
}

/**
 * Extracts schema type from schema details
 */
export function extractSchemaType(schema: SchemaDetails): string | null {
  // First, try to extract from @context array structure
  // In JSON-LD contexts, the schema type is often a key in the @context array
  const context = schema['@context'];
  
  if (Array.isArray(context)) {
    // Look through each context object in the array
    for (const ctxItem of context) {
      if (typeof ctxItem === 'object' && ctxItem !== null && !Array.isArray(ctxItem)) {
        // Find keys that are schema types (not standard JSON-LD keywords)
        const standardKeywords = ['@protected', '@version', '@id', '@type', 'id', 'type'];
        const ctxObj = ctxItem as Record<string, unknown>;
        for (const key in ctxObj) {
          const value = ctxObj[key];
          if (
            !standardKeywords.includes(key) &&
            !key.startsWith('@') &&
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            ('@context' in value || '@id' in value)
          ) {
            return key;
          }
        }
      }
    }
  }
  
  // Also check if @context is an object (not array)
  if (typeof context === 'object' && context !== null && !Array.isArray(context)) {
    const ctxObj = context as Record<string, unknown>;
    const standardKeywords = ['@protected', '@version', '@id', '@type', 'id', 'type'];
    for (const key in ctxObj) {
      const value = ctxObj[key];
      if (
        !standardKeywords.includes(key) &&
        !key.startsWith('@') &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        ('@context' in value || '@id' in value)
      ) {
        return key;
      }
    }
  }
  
  // Fallback: try to extract from schema.type
  // But skip generic types like "object", "array", etc.
  const type = schema.type;
  const genericTypes = ['object', 'array', 'string', 'number', 'boolean', 'null'];
  
  if (typeof type === 'string') {
    // Only return if it's not a generic type
    if (!genericTypes.includes(type.toLowerCase())) {
      return type;
    }
  }
  
  if (Array.isArray(type)) {
    // Find the first non-standard type (skip @type, VerifiableCredential, generic types, etc.)
    const customType = type.find(
      (t) => 
        typeof t === 'string' && 
        !t.startsWith('@') && 
        t !== 'VerifiableCredential' &&
        !genericTypes.includes(t.toLowerCase())
    );
    return customType || null;
  }
  
  return null;
}

/**
 * Validates if a string is a valid IPFS URL or hash
 */
export function isValidIPFSUrl(url: string): boolean {
  // Check for IPFS gateway URLs
  if (url.includes('ipfs.io/ipfs/') || url.includes('ipfs://')) {
    return true;
  }
  
  // Check for IPFS hash (Qm... or baf...)
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(url) || /^baf[a-z0-9]+$/.test(url)) {
    return true;
  }
  
  // Check for full IPFS URLs
  if (url.startsWith('https://') && url.includes('ipfs')) {
    return true;
  }
  
  return false;
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

