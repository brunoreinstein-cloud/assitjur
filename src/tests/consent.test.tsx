/**
 * ✅ Comprehensive Consent System Tests
 * 
 * Tests for the unified consent management system including:
 * - SSR safety
 * - Storage operations
 * - Version management
 * - Expiration handling
 * - Integration with Google Consent Mode
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConsentProvider, useConsent } from '@/hooks/useConsent';
import { ConsentDialog } from '@/components/privacy/ConsentDialog';
import { 
  getConsent, 
  setConsent, 
  clearConsent, 
  isConsentValid, 
  getConsentAge,
  CONSENT_VERSION,
  onConsentChange
} from '@/lib/consent';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock gtag
const gtagMock = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: gtagMock,
  writable: true,
});

// Mock dataLayer
const dataLayerMock: any[] = [];
Object.defineProperty(window, 'dataLayer', {
  value: dataLayerMock,
  writable: true,
});

describe('Consent System', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    dataLayerMock.length = 0;
    
    // Reset window object for SSR tests
    delete (global as any).window;
  });

  afterEach(() => {
    // Restore window object
    global.window = window;
  });

  describe('SSR Safety', () => {
    test('should return default consent during SSR', () => {
      // Mock SSR environment
      delete (global as any).window;

      const consent = getConsent();
      expect(consent).toEqual({ essential: true });
    });

    test('should not throw when setting consent during SSR', () => {
      // Mock SSR environment
      delete (global as any).window;

      expect(() => {
        setConsent({ measure: true, marketing: false });
      }).not.toThrow();
    });

    test('should return null for consent age during SSR', () => {
      // Mock SSR environment
      delete (global as any).window;

      const age = getConsentAge();
      expect(age).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    test('should store and retrieve consent preferences', () => {
      const preferences = {
        measure: true,
        marketing: false,
      };

      setConsent(preferences);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'assistjur_consent_v1',
        expect.stringContaining('"measure":true')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'assistjur_consent_v1',
        expect.stringContaining('"marketing":false')
      );

      // Mock successful retrieval
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: new Date().toISOString(),
        })
      );

      const retrieved = getConsent();
      expect(retrieved.measure).toBe(true);
      expect(retrieved.marketing).toBe(false);
      expect(retrieved.essential).toBe(true);
    });

    test('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        setConsent({ measure: true, marketing: false });
      }).not.toThrow();
    });

    test('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const consent = getConsent();
      expect(consent).toEqual({ essential: true });
    });

    test('should clear consent data', () => {
      clearConsent();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('assistjur_consent_v1');
    });
  });

  describe('Version Management', () => {
    test('should reject consent with different version', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: '0.9.0', // Different version
          ts: new Date().toISOString(),
        })
      );

      const consent = getConsent();
      expect(consent).toEqual({ essential: true });
    });

    test('should accept consent with current version', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: new Date().toISOString(),
        })
      );

      const consent = getConsent();
      expect(consent.measure).toBe(true);
      expect(consent.marketing).toBe(false);
    });
  });

  describe('Expiration Handling', () => {
    test('should reject expired consent', () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 200); // 200 days ago

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: expiredDate.toISOString(),
        })
      );

      const consent = getConsent();
      expect(consent).toEqual({ essential: true });
    });

    test('should accept non-expired consent', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: recentDate.toISOString(),
        })
      );

      const consent = getConsent();
      expect(consent.measure).toBe(true);
    });

    test('should calculate consent age correctly', () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5); // 5 days ago

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: testDate.toISOString(),
        })
      );

      const age = getConsentAge();
      expect(age).toBe(5);
    });
  });

  describe('Consent Validation', () => {
    test('should return false for invalid consent', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const isValid = isConsentValid();
      expect(isValid).toBe(false);
    });

    test('should return true for valid consent', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: new Date().toISOString(),
        })
      );

      const isValid = isConsentValid();
      expect(isValid).toBe(true);
    });
  });

  describe('Consent Change Listeners', () => {
    test('should notify listeners when consent changes', () => {
      const listener = vi.fn();
      const unsubscribe = onConsentChange(listener);

      setConsent({ measure: true, marketing: false });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
          measure: true,
          marketing: false,
        })
      );

      unsubscribe();
    });

    test('should allow unsubscribing from listeners', () => {
      const listener = vi.fn();
      const unsubscribe = onConsentChange(listener);
      unsubscribe();

      setConsent({ measure: true, marketing: false });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Google Consent Mode Integration', () => {
    test('should apply default consent to gtag', () => {
      // Import the function dynamically to avoid SSR issues
      const { applyDefaultConsent } = require('@/lib/consent');
      
      applyDefaultConsent();

      expect(gtagMock).toHaveBeenCalledWith('consent', 'default', {
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ad_storage: 'denied',
        analytics_storage: 'denied',
      });
    });

    test('should apply consent preferences to gtag', () => {
      const { applyConsentToGtag } = require('@/lib/consent');
      
      applyConsentToGtag({ analytics: true, ads: false });

      expect(gtagMock).toHaveBeenCalledWith('consent', 'update', {
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ad_storage: 'denied',
        analytics_storage: 'granted',
      });

      expect(dataLayerMock).toHaveLength(1);
      expect(dataLayerMock[0]).toMatchObject({
        event: 'consent_update',
        consent: expect.objectContaining({
          analytics_storage: 'granted',
          ad_storage: 'denied',
        }),
      });
    });
  });

  describe('ConsentDialog Component', () => {
    test('should render consent dialog when no consent exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ConsentProvider>
          <ConsentDialog />
        </ConsentProvider>
      );

      expect(screen.getByText('Controle como usamos seus dados')).toBeInTheDocument();
    });

    test('should not render dialog when consent exists', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          measure: true,
          marketing: false,
          version: CONSENT_VERSION,
          ts: new Date().toISOString(),
        })
      );

      render(
        <ConsentProvider>
          <ConsentDialog />
        </ConsentProvider>
      );

      expect(screen.queryByText('Controle como usamos seus dados')).not.toBeInTheDocument();
    });

    test('should save consent when user accepts all', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ConsentProvider>
          <ConsentDialog />
        </ConsentProvider>
      );

      const acceptAllButton = screen.getByText('Aceitar tudo');
      fireEvent.click(acceptAllButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'assistjur_consent_v1',
          expect.stringContaining('"measure":true')
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'assistjur_consent_v1',
          expect.stringContaining('"marketing":true')
        );
      });
    });

    test('should save consent when user rejects all', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ConsentProvider>
          <ConsentDialog />
        </ConsentProvider>
      );

      const rejectAllButton = screen.getByText('Rejeitar tudo');
      fireEvent.click(rejectAllButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'assistjur_consent_v1',
          expect.stringContaining('"measure":false')
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'assistjur_consent_v1',
          expect.stringContaining('"marketing":false')
        );
      });
    });
  });

  describe('useConsent Hook', () => {
    test('should return fallback values during SSR', () => {
      // Mock SSR environment
      delete (global as any).window;

      const TestComponent = () => {
        const { preferences, open, setOpen, save } = useConsent();
        return (
          <div>
            <span data-testid="preferences">{preferences ? 'has-preferences' : 'no-preferences'}</span>
            <span data-testid="open">{open ? 'open' : 'closed'}</span>
            <button onClick={() => setOpen(true)}>Open</button>
            <button onClick={() => save({ analytics: true, ads: false })}>Save</button>
          </div>
        );
      };

      render(
        <ConsentProvider>
          <TestComponent />
        </ConsentProvider>
      );

      expect(screen.getByTestId('preferences')).toHaveTextContent('no-preferences');
      expect(screen.getByTestId('open')).toHaveTextContent('closed');
    });

    test('should handle consent changes', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const TestComponent = () => {
        const { preferences, open, setOpen, save } = useConsent();
        return (
          <div>
            <span data-testid="preferences">
              {preferences ? `${preferences.analytics}-${preferences.ads}` : 'none'}
            </span>
            <span data-testid="open">{open ? 'open' : 'closed'}</span>
            <button onClick={() => save({ analytics: true, ads: false })}>Save</button>
          </div>
        );
      };

      render(
        <ConsentProvider>
          <TestComponent />
        </ConsentProvider>
      );

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('preferences')).toHaveTextContent('true-false');
      });
    });
  });
});
