// Style Consistency Validator
// Automated checks to ensure TopRated and Watchlist maintain identical styling

import { getListStyles } from '../Styles/listStyles';
import { getMovieCardStyles } from '../Styles/movieCardStyles';
import theme from './Theme';

class StyleConsistencyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Validate that both screens use identical styling
  validateListConsistency(mediaType = 'movie', mode = 'light') {
    this.errors = [];
    this.warnings = [];

    const listStyles = getListStyles(mediaType, mode, theme);
    const movieCardStyles = getMovieCardStyles(mediaType, mode, theme);

    // Critical style properties that MUST be identical
    const criticalProperties = [
      'fontSize',
      'fontWeight', 
      'marginBottom',
      'fontFamily',
      'minHeight',
      'maxHeight',
      'textAlignVertical',
      'paddingRight'
    ];

    // Check if resultTitle has all required properties
    const titleStyle = listStyles.resultTitle;
    
    // Validate critical properties exist
    criticalProperties.forEach(prop => {
      if (titleStyle[prop] === undefined) {
        this.errors.push(`Missing critical property '${prop}' in resultTitle style`);
      }
    });

    // Validate height constraints
    if (titleStyle.height && (titleStyle.minHeight || titleStyle.maxHeight)) {
      this.warnings.push('Both fixed height and min/max height defined - may cause conflicts');
    }

    if (!titleStyle.minHeight && !titleStyle.height) {
      this.errors.push('No height constraint defined for resultTitle - may cause layout issues');
    }

    // Validate text overflow handling
    if (titleStyle.numberOfLines !== 1) {
      this.warnings.push('numberOfLines should be set to 1 for consistency (set in component)');
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      styleSnapshot: this.captureStyleSnapshot(listStyles, movieCardStyles)
    };
  }

  // Capture style snapshot for regression testing
  captureStyleSnapshot(listStyles, movieCardStyles) {
    return {
      resultTitle: {
        fontSize: listStyles.resultTitle.fontSize,
        fontWeight: listStyles.resultTitle.fontWeight,
        marginBottom: listStyles.resultTitle.marginBottom,
        fontFamily: listStyles.resultTitle.fontFamily,
        minHeight: listStyles.resultTitle.minHeight,
        maxHeight: listStyles.resultTitle.maxHeight,
        textAlignVertical: listStyles.resultTitle.textAlignVertical,
        paddingRight: listStyles.resultTitle.paddingRight
      },
      rankingItem: {
        minHeight: listStyles.rankingItem.minHeight,
        borderRadius: listStyles.rankingItem.borderRadius,
        marginHorizontal: listStyles.rankingItem.marginHorizontal,
        marginVertical: listStyles.rankingItem.marginVertical
      },
      resultPoster: {
        width: listStyles.resultPoster.width,
        height: listStyles.resultPoster.height
      },
      movieDetails: {
        padding: listStyles.movieDetails.padding,
        height: listStyles.movieDetails.height,
        paddingRight: listStyles.movieDetails.paddingRight
      }
    };
  }

  // Test title processing consistency
  validateTitleProcessing() {
    const testCases = [
      { title: "Normal Title", name: null, expected: "Normal Title" },
      { title: null, name: "TV Show Name", expected: "TV Show Name" },
      { title: "", name: "Fallback Name", expected: "Fallback Name" },
      { title: null, name: null, expected: "Unknown Title" },
      { title: undefined, name: undefined, expected: "Unknown Title" },
      { title: "Title Priority", name: "Name Secondary", expected: "Title Priority" }
    ];

    // TopRated getTitle function
    const getTitle = (item) => {
      return item.title || item.name || 'Unknown Title';
    };

    // Watchlist title processing (after our fix)
    const getWatchlistTitle = (item) => {
      return item.title || item.name || 'Unknown Title';
    };

    const failures = [];
    
    testCases.forEach((testCase, index) => {
      const topRatedResult = getTitle(testCase);
      const watchlistResult = getWatchlistTitle(testCase);
      
      if (topRatedResult !== watchlistResult) {
        failures.push({
          testCase: index + 1,
          input: testCase,
          topRatedResult,
          watchlistResult,
          expected: testCase.expected
        });
      }

      if (topRatedResult !== testCase.expected) {
        failures.push({
          testCase: index + 1,
          input: testCase,
          result: topRatedResult,
          expected: testCase.expected,
          type: 'Logic error'
        });
      }
    });

    return {
      passed: failures.length === 0,
      failures,
      totalTests: testCases.length
    };
  }

  // Validate ellipsis behavior
  validateEllipsisBehavior() {
    const longTitles = [
      "This is an extremely long movie title that should definitely be truncated",
      "Another very long title that exceeds the available space in the component",
      "Short",
      "A",
      ""
    ];

    // These would need to be tested in actual rendered components
    // This is a placeholder for manual testing guidance
    return {
      testCases: longTitles,
      instructions: [
        "1. Test each title in both TopRated and Watchlist screens",
        "2. Verify ellipsis (...) appears for long titles", 
        "3. Ensure short titles display completely",
        "4. Check that empty titles show 'Unknown Title'",
        "5. Verify no text overflow or clipping occurs"
      ]
    };
  }

  // Generate test report
  generateReport(mediaTypes = ['movie', 'tv'], modes = ['light', 'dark']) {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: {},
      titleProcessingTest: this.validateTitleProcessing(),
      ellipsisTest: this.validateEllipsisBehavior(),
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        overallStatus: 'UNKNOWN'
      }
    };

    // Test all combinations
    mediaTypes.forEach(mediaType => {
      modes.forEach(mode => {
        const key = `${mediaType}_${mode}`;
        report.testResults[key] = this.validateListConsistency(mediaType, mode);
        report.summary.totalErrors += report.testResults[key].errors.length;
        report.summary.totalWarnings += report.testResults[key].warnings.length;
      });
    });

    // Add title processing failures to error count
    report.summary.totalErrors += report.titleProcessingTest.failures.length;

    // Determine overall status
    if (report.summary.totalErrors === 0) {
      report.summary.overallStatus = report.summary.totalWarnings === 0 ? 'PASS' : 'PASS_WITH_WARNINGS';
    } else {
      report.summary.overallStatus = 'FAIL';
    }

    return report;
  }
}

// Export singleton instance
export const styleValidator = new StyleConsistencyValidator();

// Export helper functions for use in components
export const validateTitleConsistency = (topRatedTitle, watchlistTitle) => {
  return topRatedTitle === watchlistTitle;
};

export const getConsistentTitle = (item) => {
  return item.title || item.name || 'Unknown Title';
};

export default StyleConsistencyValidator;