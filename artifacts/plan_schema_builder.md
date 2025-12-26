# Schema Builder Application Plan

## Overview
Build a web-based schema builder application that allows users to create verifiable credential schemas through a two-step process:
1. **Define Schema**: Configure schema metadata (title, type, version, description, credential type)
2. **Define Attributes**: Create hierarchical attribute structure with properties

## Features Analysis

### Step 1: Define Schema
- **Title** (required, max 256 chars, alphanumeric)
- **Schema Type** (required, max 256 chars, alphanumeric only)
- **Version** (required, e.g., "1.0")
- **Description** (required, textarea)
- **Advanced Options**:
  - **Credential Type** (radio buttons):
    - Merklized (default) - "Default option for majority of schemas"
    - Non-merklized - "Used mostly for on-chain interactions. Supports a maximum of 4 attributes"
- Navigation: "Define attributes →" button

### Step 2: Define Attributes
- **Attribute Tree View**:
  - Hierarchical structure starting with `credentialSubject *`
  - Expandable/collapsible nodes
  - File/folder icons
  - Data type indicators (uri, number, string, etc.)
  - Selected state highlighting
- **Add/Remove Buttons**:
  - Add (disabled when appropriate)
  - Remove (active when attribute selected)
- **Attribute Properties Form**:
  - Name * (alphanumeric, dash, underscore, max 256)
  - Title * (max 256)
  - Data Type * (dropdown: string, number, boolean, uri, date-time, etc.)
  - Advanced data type options (exclusiveMinimum, maximum, etc.)
  - Description * (textarea)
  - Required checkbox
  - Validate button
- **Navigation**: Back button, Download JSON, Connect wallet to publish

### Preview Panel (Both Steps)
- Dropdown: "JSON Schema" format selector
- Real-time JSON Schema preview
- Syntax highlighting
- Updates automatically as user modifies schema

### Header (Both Steps)
- Title: "Schema builder"
- Subtitle: "Effortlessly create trusted and tamper-proof verifiable credential schemas, revolutionizing trust and authentication."
- Buttons:
  - Import Schema (upload icon)
  - Supported formats (info icon)

## Technical Stack

### Frontend Framework
- **Next.js 14+** (App Router) with TypeScript
- **React** for UI components
- **Tailwind CSS** for styling
- **Zustand** or **React Context** for state management
- **react-json-view** or **monaco-editor** for JSON preview
- **react-hook-form** for form management
- **zod** for validation

### Project Structure
```
schema-builder/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Step 1: Define Schema)
│   └── attributes/
│       └── page.tsx (Step 2: Define Attributes)
├── components/
│   ├── Header.tsx
│   ├── SchemaForm.tsx
│   ├── AttributesTree.tsx
│   ├── AttributeProperties.tsx
│   ├── JsonPreview.tsx
│   └── ui/ (shadcn/ui components)
├── lib/
│   ├── schema-generator.ts (JSON Schema generation logic)
│   ├── validation.ts
│   └── types.ts
├── store/
│   └── schema-store.ts (state management)
└── public/
    └── icons/
```

## Implementation Steps

### 1. Project Setup
- Initialize Next.js project with TypeScript
- Install dependencies (Tailwind, Zustand, react-hook-form, zod, etc.)
- Set up Tailwind CSS configuration
- Create folder structure

### 2. Type Definitions
- Define TypeScript interfaces for:
  - Schema metadata
  - Attribute structure
  - JSON Schema structure
  - Form state

### 3. State Management
- Create Zustand store for:
  - Current step (1 or 2)
  - Schema metadata
  - Attributes tree
  - Selected attribute
  - JSON Schema output

### 4. JSON Schema Generator
- Implement logic to generate JSON Schema from:
  - Schema metadata
  - Attributes tree
  - Credential type (Merklized/Non-merklized)
- Handle nested structures (credentialSubject)
- Include standard VC fields (id, issuer, issuanceDate, expirationDate, @context)

### 5. Step 1: Define Schema
- Build form component with all fields
- Add validation (alphanumeric checks, character limits)
- Implement advanced options toggle
- Add navigation to Step 2

### 6. Step 2: Define Attributes
- Build hierarchical tree component
- Implement add/remove attribute functionality
- Build attribute properties form
- Add data type dropdown with advanced options
- Implement validation

### 7. Preview Component
- Integrate JSON editor/viewer
- Real-time updates from state
- Format selector dropdown
- Syntax highlighting

### 8. Header Component
- Title and subtitle
- Import Schema button (placeholder)
- Supported formats button (placeholder)

### 9. Navigation & Actions
- Back button (Step 2 → Step 1)
- Download JSON functionality
- Connect wallet button (placeholder)

### 10. Styling & Polish
- Match design from images
- Responsive layout
- Icons and visual indicators
- Loading states
- Error handling

## JSON Schema Structure

The generated schema should include:
- `$metadata` with URIs and jsonLdContext
- `version`, `type`, `$schema`, `description`, `title`
- `properties` with `credentialSubject` object
- `credentialSubject.properties` with user-defined attributes
- Standard VC fields: `id`, `issuer`, `issuanceDate`, `expirationDate`, `@context`
- `required` arrays
- Type definitions

## Validation Rules

### Schema Type
- Alphanumeric only
- Max 256 characters

### Title
- Max 256 characters

### Attribute Name
- Alphanumeric, dash (-), underscore (_)
- Max 256 characters

### Non-merklized
- Maximum 4 attributes allowed

## UI/UX Considerations

- Clean, modern design with white background
- Clear visual hierarchy
- Left panel: Form/Attributes
- Right panel: Preview
- Green accent color for primary actions
- Red for remove/destructive actions
- Character counters for text inputs
- Expandable/collapsible sections
- Selected state highlighting
- Smooth transitions between steps

## Future Enhancements

- Import schema from JSON file
- Export to various formats
- Wallet integration for publishing
- Schema validation before publish
- Template library
- Collaboration features
- Version history

