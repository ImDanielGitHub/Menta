const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Expo SDK 56 upgrades eslint-plugin-react-hooks from v5 to v7. Its
// "recommended" preset now enables React Compiler diagnostics in addition to
// the two hook correctness rules this project already enforced. Keep those
// diagnostics opt-in until Menta deliberately adopts and validates the React
// Compiler across the app.
const reactCompilerCompatibilityRules = {
  'react-hooks/static-components': 'off',
  'react-hooks/use-memo': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/incompatible-library': 'off',
  'react-hooks/immutability': 'off',
  'react-hooks/globals': 'off',
  'react-hooks/refs': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/error-boundaries': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/set-state-in-render': 'off',
  'react-hooks/unsupported-syntax': 'off',
  'react-hooks/config': 'off',
  'react-hooks/gating': 'off',
};

module.exports = [
  ...compat.extends(
    'expo',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ),
  {
    rules: reactCompilerCompatibilityRules,
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'web-build/**',
      'build/**',
      'tools/**',
      'domain/menta.quest/lovable-overlay/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      'supabase/functions/**',
      'eslint.config.js',
      '.eslintrc.js',
    ],
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.tsx',
      'supabase/functions/**/*.ts',
      '.eslintrc.js',
    ],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // TypeScript specific rules - ENFORCE no-explicit-any
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      // React Native specific rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react/prop-types': 'off', // We use TypeScript for prop validation

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-duplicate-imports': 'error',

      // Accessibility
      'react/jsx-no-target-blank': 'error',
    },
    ignores: ['*.config.js', '*.config.ts'],
  },
];
