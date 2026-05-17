# Three Calls I Nearly Made the Other Way

This document will be updated during development to record significant design decisions and the alternatives considered.

## Pending Decisions

As I begin implementation, I will document here the key judgment calls where I considered multiple approaches.

### Scanner Implementation Approach
- **Option 1**: Use the provided `<ScanInput>` component as-is
- **Option 2**: Build a custom scanner with camera integration for mobile
- **Option 3**: Hybrid approach - use ScanInput for desktop, custom for mobile camera

### State Management Strategy
- **Option 1**: Local React state with useState/useEffect
- **Option 2**: React Query or SWR for data fetching and caching
- **Option 3**: Context API for global state management

### Error Handling & User Feedback
- **Option 1**: Inline error messages near input fields
- **Option 2**: Toast notifications for scan results
- **Option 3**: Dedicated status bars or banners

### Reconciliation Report Structure
- **Option 1**: Simple diff showing mismatches
- **Option 2**: Categorized issues with severity levels
- **Option 3**: Action-oriented report with recommended next steps

### Barcode Generation Location
- **Option 1**: Dedicated development route (`/dev/barcodes`)
- **Option 2**: Printable PDF generation endpoint
- **Option 3**: Utility script for generating printable sheets

These decisions will be documented with reasoning as implementation progresses.