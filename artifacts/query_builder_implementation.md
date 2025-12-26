# Query Builder Implementation

## Overview
Implemented a comprehensive Query Builder tool for creating zero-knowledge proof verification queries, similar to Privado ID's query builder.

## Features Implemented

### 1. Core Query Configuration
- **URL to JSON-LD Context**: Input field for schema context URL
- **Schema Type**: Input field for schema type selection
- **Attribute Field Selection**: Hierarchical tree view for selecting attributes from the schema
- **Proof Type**: Selection between SIG (Signature-based) and MTP (Merkle Tree Proof)
- **Circuit ID**: Dynamic selection based on proof type, supporting:
  - V2 SIG circuits (off-chain and on-chain)
  - V2 MTP circuits (off-chain and on-chain)
  - V3 circuits (experimental, supports both SIG and MTP)

### 2. Proof of Uniqueness (V3 Circuits)
- Checkbox to enable Proof of Uniqueness
- Nullifier Session ID input field (required when enabled)
- Only available for V3 circuits

### 3. Query Types
- **Condition**: Privacy-preserving verification without revealing data
- **Selective Disclosure**: Reveals specific attribute values
- **Credential Issued**: Verifies credential issuance without revealing data

### 4. Operators
Supports all standard operators:
- Is equal to (`eq`)
- Is not equal to (`neq`)
- Matches one of the values (`in`)
- Matches none of the values (`nin`)
- Is less than (`lt`)
- Is greater than (`gt`)
- Is less than or equal to (`lte`)
- Is greater than or equal to (`gte`)
- Falls within the range (`range`)
- Falls outside the range (`nrange`)
- Exists (`exists`)

### 5. Attribute Value Input
- Dynamic input based on attribute data type (string, number, integer, boolean)
- Range input for range operators (min, max)
- Comma-separated values for multi-value operators
- Type-specific validation

### 6. Issuer Configuration
- Issuer DID input field
- Support for wildcard (`*`) to accept any issuer (with warning)

### 7. Revocation Check
- Checkbox to skip revocation check (with warning)

### 8. Verification Types
- **Off-chain**: Standard verification via QR code
- **On-chain**: Smart contract verification with:
  - Network selection (Polygon Mainnet/Amoy)
  - Request ID input
  - Smart contract address input

### 9. Query Generation
- Real-time ZK Query generation
- Query Request (JWZ) generation
- Preview panel showing both formats
- Copy to clipboard functionality

### 10. QR Code Generation
- QR code generation for test queries
- Displays query data in JWZ format
- Copy query data functionality

## File Structure

```
schema-builder/
├── lib/
│   ├── query-types.ts          # TypeScript types and interfaces
│   └── query-generator.ts      # Query generation logic
├── store/
│   └── query-store.ts          # Zustand store for query state
├── components/
│   ├── QueryBuilderForm.tsx    # Main form component
│   ├── AttributeSelectorTree.tsx # Attribute selection tree
│   └── QueryPreview.tsx        # Preview panel
└── app/
    └── query-builder/
        └── page.tsx            # Query builder page route
```

## Technical Implementation

### State Management
- Uses Zustand for query state management
- Separate store from schema store for isolation
- All form fields are managed in the store

### Query Generation Logic
- `generateZKQuery()`: Generates ZK Query Language format
- `generateQueryRequest()`: Generates JWZ request format
- Handles all operator types and value formats
- Supports both off-chain and on-chain verification

### UI Components
- **QueryBuilderForm**: Comprehensive form with all fields
- **AttributeSelectorTree**: Hierarchical tree for attribute selection
- **QueryPreview**: Real-time preview of generated queries
- **Header**: Updated with navigation links

### Dependencies Added
- `qrcode.react`: QR code generation library
- `@types/qrcode.react`: TypeScript types

## Usage

1. Navigate to `/query-builder` route
2. Fill in the required fields:
   - JSON-LD Context URL
   - Schema Type
   - Select attribute from tree
   - Choose proof type and circuit
   - Configure query type and operator
   - Set attribute value
   - Enter issuer DID
3. Configure verification type (off-chain or on-chain)
4. Click "Test Query" to generate QR code
5. View preview in the right panel

## Future Enhancements

- [ ] Schema Explorer integration for selecting schemas
- [ ] JWZ token encoding/decoding
- [ ] Direct wallet integration for testing
- [ ] Save/load query configurations
- [ ] Export queries in various formats
- [ ] Query validation before generation
- [ ] Support for multiple attribute conditions
- [ ] Query templates library

## Notes

- V3 circuits are marked as experimental
- Proof of Uniqueness is only available for V3 circuits
- Skipping revocation check is not recommended for production
- Using wildcard issuer (`*`) is not recommended for production

