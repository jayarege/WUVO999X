# QA Test Plan: List Styling Consistency

## Overview
Testing consistency between TopRated and Watchlist screens to ensure identical styling with only button text differences.

## Critical Edge Cases Identified

### 1. Title Truncation & Ellipsis
**Risk Level: HIGH**

#### Current Implementation Issues:
- `resultTitle` has fixed `height: 38` but no `numberOfLines` in stylesheet
- Component-level `numberOfLines={1}` may conflict with fixed height
- Different title sources: `getTitle(movie)` vs `item.title || item.name`

#### Test Cases:
```javascript
// Test Data Sets
const titleTestCases = [
  { title: "A", expected: "A" }, // Single character
  { title: "Normal Movie Title", expected: "Normal Movie Title" }, // Normal length
  { title: "This is an Extremely Long Movie Title That Should Be Truncated", expected: "This is an Extremely Long Movie Title..." }, // Long title
  { title: "", expected: "Unknown Title" }, // Empty title
  { title: null, expected: "Unknown Title" }, // Null title
  { title: undefined, expected: "Unknown Title" }, // Undefined title
  { title: "Movie with émojis 🎬 and spéçial çhars", expected: "Movie with émojis 🎬 and spé..." }, // Special chars
  { title: "TITLE IN ALL CAPS WITH NUMBERS 123", expected: "TITLE IN ALL CAPS WITH..." }, // All caps
  { title: "title in all lowercase", expected: "title in all lowercase" }, // All lowercase
  { title: "Mix3d C4se W1th Numb3rs", expected: "Mix3d C4se W1th Numb3rs" }, // Mixed case with numbers
];
```

### 2. Layout Consistency Issues
**Risk Level: HIGH**

#### Identified Inconsistencies:
1. **Title Processing Difference:**
   - TopRated: `getTitle(movie)` with fallback "Unknown Title"
   - Watchlist: `item.title || item.name` with no fallback

2. **Fixed Height Constraint:**
   - `resultTitle` has `height: 38` which may cause text clipping
   - Need to verify ellipsis appears within this constraint

### 3. Data Edge Cases
**Risk Level: MEDIUM**

#### Test Scenarios:
- Movies with no title property
- TV shows with only name property
- Mixed content with both title and name
- Very short screen widths
- Different font scaling settings

## Required Fixes

### 1. Standardize Title Processing
Both screens should use identical title processing logic:

```javascript
const getTitle = useCallback((item) => {
  return item.title || item.name || 'Unknown Title';
}, []);
```

### 2. Fix Height Constraint Issue
The fixed height may cause problems - should either:
- Remove fixed height and rely on numberOfLines
- Or ensure height accommodates single line properly

### 3. Add Comprehensive Error Handling
Handle all possible data states for consistent fallbacks.

## Automated Test Requirements

### Style Consistency Tests
1. **Layout Dimensions:** Verify identical spacing, padding, margins
2. **Typography:** Ensure identical fonts, sizes, weights
3. **Color Application:** Verify consistent theming
4. **Button Styling:** Confirm only text differs

### Regression Tests
1. **Theme Switching:** Dark/Light mode consistency
2. **Media Type Switching:** Movie/TV show consistency  
3. **Screen Orientation:** Portrait/Landscape consistency
4. **Accessibility:** Screen reader compatibility

## Test Execution Priority

1. **P0 (Critical):** Title truncation and fallback handling
2. **P1 (High):** Layout consistency across data variations
3. **P2 (Medium):** Theme and orientation testing
4. **P3 (Low):** Performance and accessibility testing

## Success Criteria
- ✅ Identical visual appearance except button text
- ✅ Consistent behavior with all edge case data
- ✅ No layout breaks or text overflow
- ✅ Proper ellipsis display for long titles
- ✅ Graceful handling of missing/malformed data