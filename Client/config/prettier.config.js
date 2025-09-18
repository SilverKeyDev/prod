// Prettier configuration for Vite + React + Tailwind client
// FAANG-style baseline config optimized for consistency and ecosystem compatibility

export default {
  // Core formatting rules
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',

  // React / JSX specific
  bracketSameLine: false,

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
      },
    },
  ],

  // Tailwind CSS plugin for consistent class ordering
  plugins: ['prettier-plugin-tailwindcss'],
};
