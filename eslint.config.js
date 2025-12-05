import js from '@eslint/js';
import globals from 'globals';

export default [
  // Global settings
  js.configs.recommended,
  {
    files: ['src/**/*.js'],

    languageOptions: {
      globals: {
        ...globals.node,  // For backend
        ...globals.browser,  // For frontend
      },
      ecmaVersion: 'latest',  // Modern-features
      sourceType: 'module',  // Module-oriented
    },

    rules: {
      'no-console': 'warn',  // Warn on console logs
      'no-unused-vars': 'error',  // Error on unused vars
    },
  },

  {
    ignores: [
      'node_modules/**',  // Skip third-party dependencies
      'src/device/**',  // Skip Python based scooter simulation (given that it should contain no JS)
    ],
  },
];