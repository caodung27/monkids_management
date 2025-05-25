const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create directories
const directories = [
  'src/app',
  'src/components',
  'src/libs',
  'src/locales',
  'src/models',
  'src/styles',
  'src/templates',
  'src/types',
  'src/utils',
  'src/validations',
  'src/components/ui',
  'src/components/forms',
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Install dependencies
const dependencies = [
  '@clerk/nextjs@4.29.7',
  '@hookform/resolvers',
  '@radix-ui/react-popover',
  '@radix-ui/react-slot',
  '@tanstack/react-query',
  '@tanstack/react-query-devtools',
  'class-variance-authority',
  'clsx',
  'date-fns',
  'drizzle-orm',
  'lucide-react',
  'next-intl',
  'pino',
  'posthog-js',
  'react-day-picker',
  'react-hook-form',
  'tailwind-merge',
  'tailwindcss-animate',
  'zod'
];

const devDependencies = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  '@playwright/test',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-links',
  '@storybook/blocks',
  '@storybook/nextjs',
  '@storybook/react',
  '@storybook/testing-library',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@vitejs/plugin-react',
  'autoprefixer',
  'commitizen',
  'drizzle-kit',
  'eslint',
  'eslint-config-next',
  'eslint-config-prettier',
  'eslint-plugin-storybook',
  'husky',
  'lint-staged',
  'postcss',
  'prettier',
  'prettier-plugin-tailwindcss',
  'semantic-release',
  'storybook',
  'tailwindcss',
  'typescript',
  'vitest'
];

console.log('Installing dependencies...');
try {
  execSync(`npm install ${dependencies.join(' ')} --legacy-peer-deps`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

console.log('Installing dev dependencies...');
try {
  execSync(`npm install -D ${devDependencies.join(' ')} --legacy-peer-deps`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing dev dependencies:', error.message);
  process.exit(1);
}

console.log('Setup completed successfully!'); 