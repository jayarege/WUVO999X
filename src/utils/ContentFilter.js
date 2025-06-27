/**
 * ENHANCED CONTENT FILTER UTILITY - CRITICAL SECURITY PATCH
 * Maximum protection against adult content with obfuscation detection
 * Team: Alex, Maya, Carlos, Priya, Jordan - Emergency Security Response
 */

// COMPREHENSIVE ADULT KEYWORDS - Enhanced with variations
const ADULT_KEYWORDS = [
  // Explicit terms
  'xxx', 'porn', 'pornographic', 'erotic', 'adult', 'sexy', 'nude', 'naked',
  'sexual', 'seduction', 'strip', 'stripper', 'lingerie', 'intimate',
  'sensual', 'fetish', 'bdsm', 'kink', 'kinky', 'sex', 'hardcore',
  'softcore', 'playboy', 'penthouse', 'hustler', 'escort', 'prostitute',
  'brothel', 'massage parlor', 'adult entertainment', 'red light',
  'mature content', 'explicit', 'uncensored', 'nsfw', 'adults only',
  'over 18', '18+', 'restricted', 'x-rated', 'r-rated content',
  
  // Adult film industry terms
  'milf', 'gilf', 'dilf', 'cougar', 'barely legal', 'teen fantasy',
  'amateur', 'homemade', 'casting', 'audition', 'backdoor',
  'facial', 'cumshot', 'creampie', 'gangbang', 'threesome',
  'orgy', 'swinger', 'wife swap', 'cuckold', 'fetish',
  
  // Body parts and sexual acts (common in titles)
  'cock', 'dick', 'penis', 'pussy', 'vagina', 'breast', 'boob',
  'ass', 'butt', 'anal', 'oral', 'blowjob', 'handjob', 'masturbat',
  'orgasm', 'climax', 'penetrat', 'thrust', 'mount', 'ride',
  
  // Euphemisms and slang
  'steamy', 'sultry', 'naughty', 'wild', 'kinky', 'dirty',
  'passionate', 'lust', 'desire', 'tempting', 'seductive',
  'forbidden', 'taboo', 'secret affair', 'bedroom', 'midnight',
  
  // Production indicators
  'uncut', 'uncensored', 'directors cut', 'extended scenes',
  'behind the scenes', 'outtakes', 'raw footage'
];

// OBFUSCATION PATTERNS - Critical security enhancement
const OBFUSCATION_PATTERNS = [
  // Character replacement patterns
  /c[\*\-\_0o]{1,4}[ck]/gi,           // c***, c--k, c0ck, c***k, etc.
  /p[\*\-\_0o]{1,4}rn/gi,             // p*rn, p--rn, p0rn variants
  /s[\*\-\_3e]{1,4}x/gi,              // s*x, s3x, s--x variants  
  /f[\*\-\_]{1,4}ck/gi,               // f*ck, f--k variants
  /[a-z][\*\-\_]{2,}[a-z]/gi,         // Any letter + 2+ censors + letter
  /[\*\-\_]{3,}/g,                    // 3+ consecutive censorship chars
  
  // Number/letter substitutions
  /c0ck/gi, /d1ck/gi, /p0rn/gi, /s3x/gi, /4ss/gi, /b00b/gi,
  /pus5y/gi, /pu55y/gi, /fuk/gi, /fck/gi, /sht/gi,
  
  // Spacing obfuscation
  /c\s*\*\s*\*\s*k/gi,               // c * * k with spaces
  /p\s*o\s*r\s*n/gi,                 // p o r n with spaces
  /s\s*e\s*x/gi,                     // s e x with spaces
  
  // Creative obfuscation
  /c[^a-z]*ck/gi,                    // c[anything]ck
  /p[^a-z]*rn/gi,                    // p[anything]rn
  /[a-z]{1,2}[\*\-\_\.]{2,}[a-z]{1,2}/gi, // General obfuscation pattern
];

// EXPLICIT CONTENT PATTERNS - Zero tolerance
const EXPLICIT_PATTERNS = [
  // Size descriptors + body parts
  /\b(massive|huge|big|enormous|giant|large)\s+[a-z]*[\*\-\_]/gi,
  /\b(massive|huge|big|enormous)\s+(cock|dick|penis|member)/gi,
  /\b(tight|wet|hot|horny)\s+(pussy|vagina|hole)/gi,
  
  // Action + body part combinations
  /\b(suck|lick|ride|mount|penetrat)\s*[a-z]*[\*\-\_]/gi,
  /\b(blow|hand|foot)\s*job/gi,
  /\b(gang|group)\s*bang/gi,
  
  // Adult film titles patterns
  /\b(barely|just)\s+(legal|18)/gi,
  /\b(teen|young)\s+(fantasy|dream|desire)/gi,
  /\b(wife|mom|step)\s+(swap|share|exchange)/gi,
  /\b(casting|audition)\s+(couch|call)/gi,
  
  // Explicit acts
  /\b(anal|oral|double)\s+(penetration|pleasure|action)/gi,
  /\b(cream|facial|money)\s*shot/gi,
  /\b(69|DP|ATM|BBC|BWC|MILF|GILF|DILF)/gi,
  
  // Adult industry terms
  /\b(porn|adult)\s+(star|actress|actor|industry)/gi,
  /\b(sex|adult)\s+(tape|video|film|movie)/gi,
  /\b(rated\s+)?x[\s\-]*(rated|version)/gi,
  /\b(18|21)\+?\s+(only|content|material)/gi,
];

// SUSPICIOUS TITLE STRUCTURES - Pattern-based detection
const SUSPICIOUS_STRUCTURES = [
  // "My/The [word] [censored]" patterns
  /^(my|the|a|an)\s+\w+\s+[a-z]*[\*\-\_]/gi,
  /^(my|the|a|an)\s+(massive|huge|big|enormous|giant)\s+\w/gi,
  
  // Body part + action patterns
  /\w+ing\s+(my|your|his|her)\s+(cock|dick|pussy|ass)/gi,
  /\b(love|loving|want|need|crave)\s+(your|my|big|huge)\s*[a-z]*[\*\-\_]/gi,
  
  // Geographic + adult terms
  /(asian|latina|ebony|russian|german)\s+(beauty|goddess|queen|princess)\s+(wants|needs|loves)/gi,
  
  // Time + adult activity
  /(midnight|late\s*night|after\s*hours)\s+(desires?|temptations?|encounters?)/gi,
  
  // Professional + adult context
  /(secretary|nurse|teacher|babysitter|maid)\s+(seduction|affair|fantasy)/gi,
  
  // Numbers + adult terms (ages, measurements)
  /\b(18|19|20|21)[\s\-]?(year|yr)\s*(old)?\s+(teen|girl|boy)/gi,
  /\b\d{2,3}[\s\-]?\d{2,3}[\s\-]?\d{2,3}\b/g, // Measurements like 36-24-36
];

// CONSERVATIVE KEYWORDS - High sensitivity filtering
const CONSERVATIVE_KEYWORDS = [
  'hot', 'wild', 'naughty', 'tempting', 'desire', 'passion',
  'seductive', 'intimate', 'sensual', 'steamy', 'sultry', 'horny',
  'arousing', 'exciting', 'stimulating', 'provocative', 'alluring',
  'enticing', 'captivating', 'irresistible', 'magnetic', 'hypnotic',
  'forbidden', 'taboo', 'secret', 'hidden', 'private', 'personal',
  'exclusive', 'special', 'unique', 'rare', 'exotic', 'mysterious'
];

// PRODUCTION COMPANIES - Known adult content producers
const ADULT_PRODUCTION_COMPANIES = [
  'vivid', 'digital playground', 'brazzers', 'evil angel', 'wicked pictures',
  'new sensations', 'zero tolerance', 'devils film', 'elegant angel',
  'bang bros', 'reality kings', 'naughty america', 'private media',
  '21sextury', 'teamskeet', 'bangbros', 'fakehub', 'pornpros',
  'mofos', 'twistys', 'hustler', 'penthouse', 'playboy plus'
];

// HIGH RISK COUNTRIES - Additional scrutiny
const HIGH_RISK_COUNTRIES = [
  'JP', 'DE', 'FR', 'NL', 'CZ', 'HU', 'IT', 'ES', 'RU', 'UA', 'BR'
];

/**
 * ENHANCED OBFUSCATION DETECTION - Critical Security Function
 * Detects various forms of censorship and character replacement
 */
const detectObfuscation = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // Check all obfuscation patterns
  return OBFUSCATION_PATTERNS.some(pattern => pattern.test(lowerText));
};

/**
 * EXPLICIT CONTENT DETECTION - Zero Tolerance Function
 * Detects explicit sexual content and adult film patterns
 */
const detectExplicitContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // Check all explicit patterns
  return EXPLICIT_PATTERNS.some(pattern => pattern.test(lowerText));
};

/**
 * SUSPICIOUS STRUCTURE DETECTION - Pattern Recognition
 * Detects common adult content title structures
 */
const detectSuspiciousStructure = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // Check all suspicious structure patterns
  return SUSPICIOUS_STRUCTURES.some(pattern => pattern.test(lowerText));
};

/**
 * MAIN CONTENT FILTER - Enhanced Multi-Layer Security
 * @param {Array} contentArray - Array of movies/TV shows to filter
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Filtered content array with adult content removed
 */
export const filterAdultContent = (contentArray, mediaType = 'movie') => {
  if (!contentArray || !Array.isArray(contentArray)) {
    console.warn('filterAdultContent: Invalid input provided');
    return [];
  }

  return contentArray.filter(item => {
    try {
      // LAYER 1: Adult flag check (TMDB's flag is unreliable but still check)
      if (item.adult === true) {
        console.log(`🚫 FILTERED (adult flag): ${item.title || item.name}`);
        return false;
      }

      // Get all text fields for analysis
      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      const originalTitle = (item.original_title || item.original_name || '').toLowerCase();
      const tagline = (item.tagline || '').toLowerCase();

      // Combine all text for comprehensive analysis
      const allText = `${title} ${overview} ${originalTitle} ${tagline}`.toLowerCase();

      // LAYER 2: Obfuscation detection (CRITICAL - catches c***, p*rn, etc.)
      if (detectObfuscation(allText)) {
        console.log(`🚫 FILTERED (obfuscation detected): ${item.title || item.name}`);
        return false;
      }

      // LAYER 3: Explicit content detection (ZERO TOLERANCE)
      if (detectExplicitContent(allText)) {
        console.log(`🚫 FILTERED (explicit content): ${item.title || item.name}`);
        return false;
      }

      // LAYER 4: Suspicious structure detection (PATTERN RECOGNITION)
      if (detectSuspiciousStructure(title)) {
        console.log(`🚫 FILTERED (suspicious structure): ${item.title || item.name}`);
        return false;
      }

      // LAYER 5: Traditional keyword filtering (ENHANCED)
      const hasAdultKeywords = ADULT_KEYWORDS.some(keyword => 
        allText.includes(keyword.toLowerCase())
      );
      
      if (hasAdultKeywords) {
        console.log(`🚫 FILTERED (adult keywords): ${item.title || item.name}`);
        return false;
      }

      // LAYER 6: Production company check
      if (item.production_companies && Array.isArray(item.production_companies)) {
        const hasAdultProductionCompany = item.production_companies.some(company => 
          ADULT_PRODUCTION_COMPANIES.some(adultCompany => 
            (company.name || '').toLowerCase().includes(adultCompany)
          )
        );

        if (hasAdultProductionCompany) {
          console.log(`🚫 FILTERED (adult production company): ${item.title || item.name}`);
          return false;
        }
      }

      // LAYER 7: Genre-specific checks
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        const isDocumentary = item.genre_ids.includes(99);
        if (isDocumentary) {
          const documentaryAdultKeywords = [
            'sex', 'sexuality', 'prostitution', 'porn industry', 'adult industry',
            'strip club', 'brothel', 'escort', 'sex work', 'sexual revolution'
          ];
          const hasDocumentaryAdultContent = documentaryAdultKeywords.some(keyword => 
            allText.includes(keyword)
          );
          
          if (hasDocumentaryAdultContent) {
            console.log(`🚫 FILTERED (documentary adult content): ${item.title || item.name}`);
            return false;
          }
        }
      }

      // LAYER 8: Rating and vote analysis (Low quality + suspicious = filtered)
      if (item.vote_average && item.vote_average < 4 && item.vote_count && item.vote_count < 100) {
        // Low-rated content with suspicious elements
        const hasSuspiciousLowQuality = ADULT_KEYWORDS.slice(0, 20).some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
        
        if (hasSuspiciousLowQuality) {
          console.log(`🚫 FILTERED (low quality + suspicious): ${item.title || item.name}`);
          return false;
        }
      }

      // LAYER 9: Country-specific enhanced filtering
      if (item.origin_country && Array.isArray(item.origin_country)) {
        const hasHighRiskCountry = item.origin_country.some(country => 
          HIGH_RISK_COUNTRIES.includes(country)
        );
        
        if (hasHighRiskCountry) {
          // Extra cautious filtering for high-risk countries
          const riskKeywords = ['hot', 'sexy', 'wild', 'naughty', 'tempting', 'desire'];
          const hasRiskKeywords = riskKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          
          if (hasRiskKeywords) {
            console.log(`🚫 FILTERED (high-risk country + keywords): ${item.title || item.name}`);
            return false;
          }
        }
      }

      // LAYER 10: Runtime analysis (Many adult films are specific lengths)
      if (item.runtime) {
        // Adult films often have specific runtime patterns
        const isShortSuspicious = item.runtime < 60 && title.includes('compilation');
        const isLongSuspicious = item.runtime > 180 && ADULT_KEYWORDS.slice(0, 10).some(k => title.includes(k));
        
        if (isShortSuspicious || isLongSuspicious) {
          console.log(`🚫 FILTERED (suspicious runtime pattern): ${item.title || item.name}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error filtering content item:', error, item);
      // FAIL SECURE: If there's an error, filter it out
      return false;
    }
  });
};

/**
 * ENHANCED SEARCH RESULTS FILTER - Maximum Security for User Searches
 * @param {Array} searchResults - Search results to filter
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Heavily filtered search results
 */
export const filterSearchResults = (searchResults, mediaType = 'movie') => {
  // Apply basic filtering first
  const basicFiltered = filterAdultContent(searchResults, mediaType);
  
  // MAXIMUM SECURITY LAYER - Conservative filtering for search
  return basicFiltered.filter(item => {
    const title = (item.title || item.name || '').toLowerCase();
    const overview = (item.overview || '').toLowerCase();
    const allText = `${title} ${overview}`.toLowerCase();
    
    // ZERO TOLERANCE for conservative keywords in search
    const hasConservativeKeywords = CONSERVATIVE_KEYWORDS.some(keyword => 
      allText.includes(keyword.toLowerCase())
    );
    
    if (hasConservativeKeywords) {
      console.log(`🚫 FILTERED (search conservative): ${item.title || item.name}`);
      return false;
    }
    
    // Additional search-specific patterns
    const searchSpecificPatterns = [
      /\b(love|loving|want|need|desire)\s+(you|me|him|her)\b/gi,
      /\b(come|cum)\s+(here|to\s+me|inside)\b/gi,
      /\b(make|making)\s+(love|out)\b/gi,
      /\b(take|taking)\s+(me|you|him|her)\b/gi,
    ];
    
    const hasSearchSpecificPattern = searchSpecificPatterns.some(pattern => 
      pattern.test(allText)
    );
    
    if (hasSearchSpecificPattern) {
      console.log(`🚫 FILTERED (search-specific pattern): ${item.title || item.name}`);
      return false;
    }
    
    return true;
  });
};

/**
 * EMERGENCY CONTENT VALIDATION - Last line of defense
 * @param {Object} item - Content item to validate
 * @returns {boolean} True if content passes emergency validation
 */
export const emergencyContentValidation = (item) => {
  if (!item) return false;
  
  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  const allText = `${title} ${overview}`;
  
  // ZERO TOLERANCE emergency patterns
  const emergencyPatterns = [
    /[\*\-\_]{3,}/g,                    // 3+ censorship characters
    /[a-z][\*\-\_]{2,}[a-z]/gi,         // Obfuscated words
    /\b(xxx|adult|explicit|18\+|porn)/gi, // Explicit terms
    /\b(massive|huge|big)\s+[a-z]*[\*\-\_]/gi, // Size + obfuscation
    /c[\*\-\_0o]+[ck]/gi,               // C*** variants
    /p[\*\-\_0o]+rn/gi,                 // P*rn variants
    /s[\*\-\_3e]+x/gi,                  // S*x variants
  ];
  
  const failsEmergencyValidation = emergencyPatterns.some(pattern => 
    pattern.test(allText)
  );
  
  if (failsEmergencyValidation) {
    console.log(`🚨 EMERGENCY FILTER: ${item.title || item.name}`);
    return false;
  }
  
  return true;
};

/**
 * CONTENT SAFETY CHECK - Enhanced validation
 * @param {Object} item - Single movie/TV show item
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {boolean} True if content is safe
 */
export const isContentSafe = (item, mediaType = 'movie') => {
  if (!item) return false;
  
  // Must pass both primary filtering and emergency validation
  const passesMainFilter = filterAdultContent([item], mediaType).length > 0;
  const passesEmergencyValidation = emergencyContentValidation(item);
  
  return passesMainFilter && passesEmergencyValidation;
};

/**
 * GET SAFE CONTENT - Multi-layer filtered content
 * @param {Array} contentArray - Array of content to make safe
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Safe content array
 */
export const getSafeContent = (contentArray, mediaType = 'movie') => {
  const filtered = filterAdultContent(contentArray, mediaType);
  return filtered.filter(item => emergencyContentValidation(item));
};

/**
 * ADULT CONTENT DETECTION - Enhanced detection
 * @param {Object} item - Content item to check
 * @returns {boolean} True if likely adult content
 */
export const isLikelyAdultContent = (item) => {
  if (!item) return true; // Fail secure
  
  const passesFiltering = filterAdultContent([item]).length > 0;
  const passesEmergencyValidation = emergencyContentValidation(item);
  
  // If it fails either check, it's likely adult content
  return !passesFiltering || !passesEmergencyValidation;
};

/**
 * DEBUG FUNCTION - For testing filter effectiveness
 * @param {Object} item - Content item to analyze
 * @returns {Object} Detailed analysis of why content was/wasn't filtered
 */
export const debugContentFilter = (item) => {
  if (!item) return { safe: false, reason: 'No item provided' };
  
  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  const allText = `${title} ${overview}`;
  
  const analysis = {
    safe: true,
    reasons: [],
    item: item.title || item.name,
    hasAdultFlag: item.adult === true,
    hasObfuscation: detectObfuscation(allText),
    hasExplicitContent: detectExplicitContent(allText),
    hasSuspiciousStructure: detectSuspiciousStructure(title),
    hasAdultKeywords: ADULT_KEYWORDS.some(k => allText.includes(k.toLowerCase())),
    passesEmergencyValidation: emergencyContentValidation(item)
  };
  
  if (analysis.hasAdultFlag) analysis.reasons.push('Adult flag set');
  if (analysis.hasObfuscation) analysis.reasons.push('Obfuscation detected');
  if (analysis.hasExplicitContent) analysis.reasons.push('Explicit content detected');
  if (analysis.hasSuspiciousStructure) analysis.reasons.push('Suspicious title structure');
  if (analysis.hasAdultKeywords) analysis.reasons.push('Adult keywords found');
  if (!analysis.passesEmergencyValidation) analysis.reasons.push('Failed emergency validation');
  
  analysis.safe = analysis.reasons.length === 0;
  
  return analysis;
};

// Export all functions
export default {
  filterAdultContent,
  filterSearchResults,
  emergencyContentValidation,
  isContentSafe,
  getSafeContent,
  isLikelyAdultContent,
  debugContentFilter
};