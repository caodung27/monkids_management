import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock next/font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter',
  }),
})); 