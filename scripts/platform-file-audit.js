#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Platform File Analysis Infrastructure
 * 
 * Analyzes all .web/.native files in Client/ to categorize them for potential consolidation.
 * Generates detailed analysis data for follow-up consolidation work.
 */

const CLIENT_ROOT = path.join(__dirname, '..', 'Client');
const OUTPUT_FILE = path.join(__dirname, '..', 'platform-audit-results.json');

// Platform-specific import patterns to detect
const PLATFORM_DEPENDENCIES = {
  web: [
    'react-dom',
    'react-router',
    'react-router-dom', 
    '@headlessui/react',
    'react-virtuoso',
    'window',
    'document',
    'HTMLElement',
    'addEventListener',
    'localStorage',
    'sessionStorage',
    'fetch',
    'URL',
    'FormData',
    'Blob',
    'File',
    'MouseEvent',
    'KeyboardEvent',
    'TouchEvent',
    'DOMRect',
    'HTMLInputElement',
    'HTMLFormElement',
    'htmlFor'
  ],
  native: [
    'react-native',
    '@react-native',
    'react-navigation',
    '@react-navigation',
    'Dimensions',
    'Platform',
    'StatusBar',
    'Alert',
    'Linking',
    'Animated',
    'PanResponder',
    'StyleSheet',
    'ScrollView',
    'FlatList',
    'SectionList',
    'TouchableOpacity',
    'TouchableHighlight',
    'View',
    'Text',
    'Image',
    'TextInput',
    'SafeAreaView',
    'KeyboardAvoidingView',
    'Modal',
    'Switch',
    'Picker',
    'Slider'
  ]
};

// Categories for file classification
const FILE_CATEGORIES = {
  UI_PRIMITIVE: 'ui-primitive', // Basic UI building blocks
  LAYOUT: 'layout', // Page layouts, shells, major structural components
  FEATURE: 'feature', // Business logic features
  ADAPTER: 'adapter', // Platform adapters/wrappers
  UTILITY: 'utility', // Helper functions and utilities
  CONFIG: 'config', // Configuration files
  NAVIGATION: 'navigation', // Navigation related
  FORM: 'form', // Form components
  MODAL: 'modal', // Modal/dialog components
  MEDIA: 'media', // Image/video/audio components
  ANIMATION: 'animation', // Animation/motion components
  OTHER: 'other'
};

function findPlatformFiles() {
  const patterns = [
    `${CLIENT_ROOT}/**/*.web.{ts,tsx,js,jsx}`,
    `${CLIENT_ROOT}/**/*.native.{ts,tsx,js,jsx}`
  ];

  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern);
    files.push(...matches);
  });

  return files.map(file => ({
    absolutePath: file,
    relativePath: path.relative(CLIENT_ROOT, file),
    platform: file.includes('.web.') ? 'web' : 'native',
    extension: path.extname(file),
    directory: path.dirname(path.relative(CLIENT_ROOT, file)),
    filename: path.basename(file)
  }));
}

function analyzeFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract imports
    const imports = extractImports(content);
    
    // Detect platform-specific dependencies
    const webDeps = PLATFORM_DEPENDENCIES.web.filter(dep => 
      imports.some(imp => imp.includes(dep)) || content.includes(dep)
    );
    
    const nativeDeps = PLATFORM_DEPENDENCIES.native.filter(dep => 
      imports.some(imp => imp.includes(dep)) || content.includes(dep)
    );
    
    // Categorize file based on path and content
    const category = categorizeFile(filePath, content, imports);
    
    // Check if it's a UI component (exports React component)
    const isComponent = hasReactComponent(content);
    
    // Estimate complexity (rough LOC count)
    const lineCount = content.split('\n').length;
    const complexity = estimateComplexity(content);
    
    return {
      imports,
      webDependencies: webDeps,
      nativeDependencies: nativeDeps,
      category,
      isComponent,
      lineCount,
      complexity,
      hasJSX: content.includes('jsx') || content.includes('<') || filePath.endsWith('.tsx'),
      hasPlatformSpecificLogic: webDeps.length > 0 || nativeDeps.length > 0
    };
  } catch (error) {
    return {
      error: `Failed to analyze: ${error.message}`,
      imports: [],
      webDependencies: [],
      nativeDependencies: [],
      category: FILE_CATEGORIES.OTHER,
      isComponent: false,
      lineCount: 0,
      complexity: 'unknown',
      hasJSX: false,
      hasPlatformSpecificLogic: false
    };
  }
}

function extractImports(content) {
  const importRegex = /import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function categorizeFile(filePath, content, imports) {
  const pathLower = filePath.toLowerCase();
  
  // Navigation
  if (pathLower.includes('navigation') || pathLower.includes('router')) {
    return FILE_CATEGORIES.NAVIGATION;
  }
  
  // Layouts and shells
  if (pathLower.includes('layout') || pathLower.includes('shell') || 
      pathLower.includes('approot') || pathLower.includes('screen')) {
    return FILE_CATEGORIES.LAYOUT;
  }
  
  // UI primitives
  if (pathLower.includes('/primitives/') || pathLower.includes('/button/') || 
      pathLower.includes('/input/') || pathLower.includes('/box/')) {
    return FILE_CATEGORIES.UI_PRIMITIVE;
  }
  
  // Adapters
  if (pathLower.includes('/adapters/') || pathLower.includes('adapter')) {
    return FILE_CATEGORIES.ADAPTER;
  }
  
  // Modals
  if (pathLower.includes('modal') || pathLower.includes('dialog')) {
    return FILE_CATEGORIES.MODAL;
  }
  
  // Media
  if (pathLower.includes('image') || pathLower.includes('video') || 
      pathLower.includes('media') || pathLower.includes('carousel')) {
    return FILE_CATEGORIES.MEDIA;
  }
  
  // Animation/motion
  if (pathLower.includes('motion') || pathLower.includes('animate') || 
      pathLower.includes('transition')) {
    return FILE_CATEGORIES.ANIMATION;
  }
  
  // Forms
  if (pathLower.includes('form') || pathLower.includes('input') || 
      content.includes('useForm') || content.includes('FormProvider')) {
    return FILE_CATEGORIES.FORM;
  }
  
  // Features
  if (pathLower.includes('/features/')) {
    return FILE_CATEGORIES.FEATURE;
  }
  
  // Config/utils
  if (pathLower.includes('/config/') || pathLower.includes('/utils/')) {
    return pathLower.includes('.ts') && !pathLower.includes('.tsx') ? 
           FILE_CATEGORIES.UTILITY : FILE_CATEGORIES.CONFIG;
  }
  
  return FILE_CATEGORIES.OTHER;
}

function hasReactComponent(content) {
  // Look for component export patterns
  const componentPatterns = [
    /export\s+(?:default\s+)?(?:function|const)\s+\w+.*?(?:=\s*)?.*?(?:\(.*?\)\s*)?(?::\s*React\.FC)?.*?{/,
    /export\s+default\s+\w+/,
    /export\s*{[^}]*}/
  ];
  
  return componentPatterns.some(pattern => pattern.test(content)) && 
         (content.includes('jsx') || content.includes('<') || content.includes('React'));
}

function estimateComplexity(content) {
  const lines = content.split('\n').length;
  
  if (lines < 50) return 'low';
  if (lines < 150) return 'medium';
  if (lines < 300) return 'high';
  return 'very-high';
}

function findPotentialConsolidations(files) {
  const consolidationCandidates = [];
  const filesByBasename = new Map();
  
  // Group files by base name (without .web/.native extension)
  files.forEach(file => {
    const basename = file.filename.replace(/\.(web|native)\.(ts|tsx|js|jsx)$/, '');
    if (!filesByBasename.has(basename)) {
      filesByBasename.set(basename, []);
    }
    filesByBasename.get(basename).push(file);
  });
  
  // Find files with both web and native versions
  filesByBasename.forEach((fileVersions, basename) => {
    if (fileVersions.length > 1) {
      const webVersion = fileVersions.find(f => f.platform === 'web');
      const nativeVersion = fileVersions.find(f => f.platform === 'native');
      
      if (webVersion && nativeVersion) {
        consolidationCandidates.push({
          basename,
          webFile: webVersion,
          nativeFile: nativeVersion,
          consolidationPotential: assessConsolidationPotential(webVersion, nativeVersion)
        });
      }
    }
  });
  
  return consolidationCandidates;
}

function assessConsolidationPotential(webFile, nativeFile) {
  const webAnalysis = webFile.analysis;
  const nativeAnalysis = nativeFile.analysis;
  
  // High potential if neither has platform-specific logic
  if (!webAnalysis.hasPlatformSpecificLogic && !nativeAnalysis.hasPlatformSpecificLogic) {
    return 'high';
  }
  
  // Medium potential if only one has platform-specific logic
  if (webAnalysis.hasPlatformSpecificLogic !== nativeAnalysis.hasPlatformSpecificLogic) {
    return 'medium';
  }
  
  // Low potential if both have platform-specific logic
  return 'low';
}

function generateSummaryStats(files, consolidationCandidates) {
  const stats = {
    totalFiles: files.length,
    webFiles: files.filter(f => f.platform === 'web').length,
    nativeFiles: files.filter(f => f.platform === 'native').length,
    categoryCounts: {},
    complexityCounts: {},
    consolidationCandidates: consolidationCandidates.length,
    highPotentialConsolidations: consolidationCandidates.filter(c => c.consolidationPotential === 'high').length,
    platformSpecificFiles: files.filter(f => f.analysis?.hasPlatformSpecificLogic).length,
    componentFiles: files.filter(f => f.analysis?.isComponent).length
  };
  
  // Count by category
  files.forEach(file => {
    const category = file.analysis?.category || 'unknown';
    stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
  });
  
  // Count by complexity
  files.forEach(file => {
    const complexity = file.analysis?.complexity || 'unknown';
    stats.complexityCounts[complexity] = (stats.complexityCounts[complexity] || 0) + 1;
  });
  
  return stats;
}

function main() {
  console.log('🔍 Starting platform file analysis...');
  
  // Find all platform files
  console.log('📁 Finding platform files...');
  const files = findPlatformFiles();
  console.log(`Found ${files.length} platform-specific files`);
  
  // Analyze each file
  console.log('🔬 Analyzing file contents...');
  files.forEach((file, index) => {
    process.stdout.write(`\r  Analyzing ${index + 1}/${files.length}: ${file.filename}`);
    file.analysis = analyzeFileContent(file.absolutePath);
  });
  console.log('\n✅ Content analysis complete');
  
  // Find consolidation candidates
  console.log('🔄 Finding consolidation candidates...');
  const consolidationCandidates = findPotentialConsolidations(files);
  
  // Generate summary statistics
  console.log('📊 Generating summary statistics...');
  const summaryStats = generateSummaryStats(files, consolidationCandidates);
  
  // Prepare final output
  const auditResults = {
    metadata: {
      timestamp: new Date().toISOString(),
      clientRoot: CLIENT_ROOT,
      totalFilesAnalyzed: files.length
    },
    summaryStats,
    files,
    consolidationCandidates
  };
  
  // Write results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(auditResults, null, 2));
  
  console.log('\n✅ Platform file audit complete!');
  console.log(`📄 Results written to: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log('\n📊 Summary:');
  console.log(`  Total files analyzed: ${summaryStats.totalFiles}`);
  console.log(`  Web files: ${summaryStats.webFiles}`);
  console.log(`  Native files: ${summaryStats.nativeFiles}`);
  console.log(`  Component files: ${summaryStats.componentFiles}`);
  console.log(`  Platform-specific files: ${summaryStats.platformSpecificFiles}`);
  console.log(`  Consolidation candidates: ${summaryStats.consolidationCandidates}`);
  console.log(`  High-potential consolidations: ${summaryStats.highPotentialConsolidations}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  findPlatformFiles,
  analyzeFileContent,
  findPotentialConsolidations,
  FILE_CATEGORIES,
  PLATFORM_DEPENDENCIES
};