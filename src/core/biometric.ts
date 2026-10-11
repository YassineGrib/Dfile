/**
 * Biometric unlock through Windows Hello (fingerprint, face or Hello PIN).
 * Only available in the Electron desktop app; the bridge lives in electron/preload.cjs.
 */

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      version: string;
      biometric?: {
        check: () => Promise<string>;
        verify: (message: string) => Promise<string>;
      };
    };
  }
}

export type BiometricAvailability = 'available' | 'not-configured' | 'no-device' | 'unsupported';
export type BiometricResult = 'verified' | 'canceled' | 'failed';

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const bridge = window.electronAPI?.biometric;
  if (!bridge) return 'unsupported';
  try {
    const result = await bridge.check();
    if (result === 'Available') return 'available';
    if (result === 'NotConfiguredForUser') return 'not-configured';
    if (result === 'DeviceNotPresent') return 'no-device';
    return 'unsupported';
  } catch {
    return 'unsupported';
  }
}

export async function verifyBiometric(message: string): Promise<BiometricResult> {
  const bridge = window.electronAPI?.biometric;
  if (!bridge) return 'failed';
  try {
    const result = await bridge.verify(message);
    if (result === 'Verified') return 'verified';
    if (result === 'Canceled') return 'canceled';
    return 'failed';
  } catch {
    return 'failed';
  }
}
