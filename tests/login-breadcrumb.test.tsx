/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '@/pages/Login';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

vi.mock('@/components/auth/OAuthButtons', () => ({
  OAuthButtons: () => <div data-testid="oauth" />,
}));

vi.mock('@/components/auth/EmailPasswordForm', () => ({
  EmailPasswordForm: () => <div data-testid="email-form" />,
}));

vi.mock('@/components/auth/MagicLinkForm', () => ({
  MagicLinkForm: () => <div data-testid="magic-form" />,
}));

vi.mock('@/components/auth/AlertBox', () => ({
  AlertBox: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: () => <div>Logo</div>,
}));

vi.mock('@/assets/hero-legal-tech.jpg', () => ({}), { virtual: true });

vi.mock('@/config/auth', () => ({
  getDefaultRedirect: () => '/',
  AUTH_CONFIG: {
    FEATURES: { MAGIC_LINK_ENABLED: false },
    OAUTH_PROVIDERS: [],
  },
}));

describe('Login page breadcrumb', () => {
  it('renders breadcrumb trail', () => {
    render(<Login />);
    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AssistJur IA' })).toBeInTheDocument();
    const current = screen.getByText('Login');
    expect(current).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('has a single h1 heading named Login', () => {
    render(<Login />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Login');
  });
});
