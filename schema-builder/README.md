# ZKred Schema & Query Builder

A web-based application for creating verifiable credential schemas and verification queries, inspired by Privado ID's schema builder and query builder.

## Features

### Schema Builder
- **Step 1: Define Schema** - Configure schema metadata (title, type, version, description, credential type)
- **Step 2: Define Attributes** - Create hierarchical attribute structure with properties
- **Real-time JSON Schema Preview** - See your schema as you build it with syntax highlighting
- **Attribute Management** - Add, remove, and configure attributes with validation
- **Export Functionality** - Download your schema as JSON

### Query Builder
- **Schema Selection** - Browse and select schemas from Privado ID or enter IPFS URLs
- **Condition Builder** - Create complex verification queries with multiple conditions
- **Selective Disclosure** - Choose which attributes to reveal in proofs
- **Credential Possession** - Verify credential existence without revealing data
- **Multiple Query Types** - Support for off-chain and on-chain verification
- **Real-time Query Preview** - See generated queries with syntax highlighting

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Usage

1. **Define Schema**: Fill in the schema metadata form on the left
   - Title, Schema Type, Version, Description
   - Choose between Merklized (default) or Non-merklized credential types
   - Click "Define attributes →" to proceed

2. **Define Attributes**: 
   - View the attribute tree on the left
   - Select an attribute to edit its properties on the right
   - Use "Add" to create new attributes
   - Use "Remove" to delete selected attributes
   - Properties auto-save as you type

3. **Preview**: The JSON Schema preview updates in real-time on the right panel

4. **Export**: Click "Download JSON" to save your schema

## Project Structure

```
schema-builder/
├── app/
│   ├── page.tsx              # Step 1: Define Schema
│   ├── attributes/
│   │   └── page.tsx          # Step 2: Define Attributes
│   └── layout.tsx
├── components/
│   ├── Header.tsx
│   ├── SchemaForm.tsx
│   ├── AttributesTree.tsx
│   ├── AttributeProperties.tsx
│   └── JsonPreview.tsx
├── lib/
│   ├── types.ts              # TypeScript type definitions
│   └── schema-generator.ts   # JSON Schema generation logic
└── store/
    └── schema-store.ts       # Zustand state management
```

## Technologies

- **Next.js 14+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (State management)
- **React Hook Form** (Form handling)
- **Zod** (Validation)
- **Lucide React** (Icons)

## Notes

- Non-merklized credentials support a maximum of 4 attributes
- Attribute names must be alphanumeric with dashes and underscores only
- Schema types must be alphanumeric only
- All fields marked with * are required
