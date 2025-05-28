# Testing Guide

## Test Coverage Overview

### Test Files Structure
```
__tests__/
├── lib/
│   └── supabase.test.ts          # Database integration tests
├── components/
│   └── CSVBulkProcessor.test.tsx  # Component behavior tests
├── api/
│   └── test-db.test.ts           # API endpoint tests
└── edge-cases/
    └── csv-processing.test.ts    # Edge case validation
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test supabase.test.ts

# Watch mode for development
npm test -- --watch
```

## Test Categories

### 1. Database Integration Tests
- Connection handling
- CRUD operations
- Error scenarios
- Performance under load

### 2. Component Tests
- User interactions
- Stage progressions
- Error handling
- Accessibility

### 3. API Route Tests
- Success/failure responses
- Error handling
- Security validation

### 4. Edge Case Tests
- Large file processing
- Malformed data
- Concurrent operations
- Resource cleanup

## Mocking Strategy

### Infrastructure Mocks Only
- External APIs (Supabase)
- Browser APIs (File, URL)
- DOM manipulation

### Real Business Logic
- QR generation logic
- CSV processing
- Data validation
- Error handling

## Test Quality Standards

- **Coverage Target**: >90%
- **No Business Logic Mocks**: Real implementations only
- **Accessibility Testing**: ARIA, keyboard navigation
- **Performance Testing**: Memory usage, processing time
- **Security Testing**: Input validation, XSS prevention