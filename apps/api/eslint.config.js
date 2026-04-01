import js from '@eslint/js';
import globals from 'globals';

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

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  tsEslint
    ? {
        files: ['**/*.{ts,mts,cts}'],
        languageOptions: {
          parser: tsEslint.parser,
          parserOptions: {
            project: ['./tsconfig.json'],
            tsconfigRootDir: import.meta.dirname,
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
          globals: {
            ...globals.node,
          },
        },
        plugins: {
          '@typescript-eslint': tsEslint.plugin,
        },
        rules: {
          ...js.configs.recommended.rules,
          ...(tsEslint.plugin.configs.recommended?.rules ?? {}),
          ...(tsEslint.plugin.configs['recommended-type-checked']?.rules ?? {}),
          '@typescript-eslint/consistent-type-imports': [
            'error',
            { prefer: 'type-imports', disallowTypeAnnotations: false },
          ],
          '@typescript-eslint/no-misused-promises': [
            'error',
            { checksVoidReturn: { arguments: false } },
          ],
          '@typescript-eslint/no-floating-promises': 'error',
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
          ],
          '@typescript-eslint/require-await': 'error',
          'no-console': ['warn', { allow: ['warn', 'error'] }],
          'no-process-exit': 'error',
          eqeqeq: ['error', 'always'],
          curly: ['error', 'all'],
        },
      }
    : {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          globals: {
            ...globals.node,
          },
        },
        rules: {
          ...js.configs.recommended.rules,
          'no-console': ['warn', { allow: ['warn', 'error'] }],
          'no-process-exit': 'error',
          eqeqeq: ['error', 'always'],
          curly: ['error', 'all'],
        },
      },
];
