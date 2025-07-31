import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['src/generated/prisma/**/*'],
  },
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];

export default eslintConfig;
