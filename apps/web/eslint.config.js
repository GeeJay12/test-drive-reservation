import js from '@eslint/js';
import globals from 'globals';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const loadTypeScriptEslint = async () => {
  try {
    const [pluginModule, parserModule] = await Promise.all([
      import('@typescript-eslint/eslint-plugin'),
      import('@typescript-eslint/parser'),
    ]);

    return {
      plugin: pluginModule.default ?? pluginModule,
      parser: parserModule.default ?? parserModule,
    };
  } catch {
    return null;
  }
};

const tsEslint = await loadTypeScriptEslint();

const nextRecommendedRules = nextPlugin.configs.recommended?.rules ?? {};
const nextCoreWebVitalsRules = nextPlugin.configs['core-web-vitals']?.rules ?? {};

export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'next-env.d.ts',
      '**/*.d.ts',
    ],
  },
  {
    files: tsEslint ? ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'] : ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ...(tsEslint
        ? {
            parser: tsEslint.parser,
            parserOptions: {
              project: ['./tsconfig.json'],
              tsconfigRootDir: import.meta.dirname,
              ecmaVersion: 'latest',
              sourceType: 'module',
              ecmaFeatures: {
                jsx: true,
              },
            },
          }
        : {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
          }),
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      ...(tsEslint ? { '@typescript-eslint': tsEslint.plugin } : {}),
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextRecommendedRules,
      ...nextCoreWebVitalsRules,
      ...(tsEslint?.plugin.configs.recommended?.rules ?? {}),
      ...(tsEslint?.plugin.configs['recommended-type-checked']?.rules ?? {}),
      ...(tsEslint
        ? {
            '@typescript-eslint/consistent-type-imports': [
              'error',
              { prefer: 'type-imports', disallowTypeAnnotations: false },
            ],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': [
              'error',
              { checksVoidReturn: { attributes: false } },
            ],
            '@typescript-eslint/no-unused-vars': [
              'error',
              { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
          }
        : {}),
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },
  {
    files: tsEslint ? ['**/*.{test,spec}.{ts,tsx,js,jsx}'] : ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];
