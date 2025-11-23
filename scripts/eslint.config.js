import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.config({ extends: ['next/core-web-vitals'] }),
  {
    ignores: ['node_modules', '.next'],
  },
];
