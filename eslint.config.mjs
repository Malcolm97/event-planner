import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "scripts/**",
      "*.config.js",
      "*.config.mjs",
      "database/**",
    ],
  },
  ...nextVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;