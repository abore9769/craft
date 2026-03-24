import { describe, it, expect } from 'vitest';
import {
    validateCustomizationConfig,
    deriveNetworkConfigFromCustomization,
    type DerivedNetworkConfig,
} from './validate';
import type { CustomizationConfig } from '@craft/types';

// ── Test Setup ───────────────────────────────────────────────────────────────

const validBaseConfig: CustomizationConfig = {
    branding: {
        appName: 'Test App',
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        fontFamily: 'Inter',
    },
    features: {
        enableCharts: true,
        enableTransactionHistory: true,
        enableAnalytics: false,
        enableNotifications: false,
    },
    stellar: {
        network: 'testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
    },
};

// ── Network Selection Validation Tests ─────────────────────────────────────

describe('Network Selection Validation — Integration', () => {
    describe('valid network selections', () => {
        it('accepts mainnet with mainnet horizon', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'mainnet',
                    horizonUrl: 'https://horizon.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('accepts testnet with testnet horizon', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'testnet',
                    horizonUrl: 'https://horizon-testnet.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('accepts mainnet with soroban RPC URL', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'mainnet',
                    horizonUrl: 'https://horizon.stellar.org',
                    sorobanRpcUrl: 'https://soroban-rpc.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(true);
        });

        it('accepts testnet with soroban RPC URL', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'testnet',
                    horizonUrl: 'https://horizon-testnet.stellar.org',
                    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(true);
        });
    });

    describe('invalid network selections', () => {
        it('rejects unsupported network devnet', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'devnet' as any,
                    horizonUrl: 'https://horizon-devnet.example.com',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            const networkError = result.errors.find((e) => e.field === 'stellar.network');
            expect(networkError).toBeDefined();
            expect(networkError?.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('includes clear error message for unsupported network', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'staging' as any,
                    horizonUrl: 'https://example.com',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            const networkError = result.errors.find((e) => e.field === 'stellar.network');
            expect(networkError?.message).toContain('not supported');
            expect(networkError?.message).toContain('mainnet');
            expect(networkError?.message).toContain('testnet');
        });

        it('rejects uppercase network selection', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'MAINNET' as any,
                    horizonUrl: 'https://horizon.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            const networkError = result.errors.find((e) => e.field === 'stellar.network');
            expect(networkError?.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('rejects empty string network', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: '' as any,
                    horizonUrl: 'https://horizon.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            const networkError = result.errors.find((e) => e.field === 'stellar.network');
            expect(networkError?.code).toBe('NETWORK_EMPTY');
        });
    });

    describe('network-dependent validation', () => {
        it('validates horizon URL against network selection', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'mainnet',
                    horizonUrl: 'https://horizon-testnet.stellar.org', // Wrong network
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.code === 'HORIZON_NETWORK_MISMATCH')).toBe(true);
        });

        it('skips horizon validation when network is invalid', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'devnet' as any,
                    horizonUrl: 'https://horizon-testnet.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            // Should have network error
            expect(result.errors.some((e) => e.code === 'NETWORK_UNSUPPORTED')).toBe(true);
            // Should NOT have horizon mismatch error (validation stopped early)
            expect(result.errors.some((e) => e.code === 'HORIZON_NETWORK_MISMATCH')).toBe(false);
        });
    });

    describe('error message clarity', () => {
        it('network error provides supported options', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'unknown' as any,
                    horizonUrl: 'https://horizon.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            const networkError = result.errors.find((e) => e.field === 'stellar.network');
            expect(networkError?.message).toMatch(/mainnet.*testnet|testnet.*mainnet/);
        });

        it('returns network error field as stellar.network', () => {
            const config: CustomizationConfig = {
                ...validBaseConfig,
                stellar: {
                    network: 'production' as any,
                    horizonUrl: 'https://horizon.stellar.org',
                },
            };

            const result = validateCustomizationConfig(config);

            expect(result.valid).toBe(false);
            const networkError = result.errors.find((e) => e.code === 'NETWORK_UNSUPPORTED');
            expect(networkError?.field).toBe('stellar.network');
        });
    });
});

// ── Network Configuration Derivation Tests ────────────────────────────────────

describe('deriveNetworkConfigFromCustomization', () => {
    it('derives mainnet configuration from valid config', () => {
        const config: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'mainnet',
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        const validation = validateCustomizationConfig(config);
        expect(validation.valid).toBe(true);

        const derived = deriveNetworkConfigFromCustomization(config);

        expect(derived.network).toBe('mainnet');
        expect(derived.horizonUrl).toBe('https://horizon.stellar.org');
        expect(derived.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
        expect(derived.sorobanRpcUrl).toBe('https://soroban-rpc.stellar.org');
    });

    it('derives testnet configuration from valid config', () => {
        const config: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'testnet',
                horizonUrl: 'https://horizon-testnet.stellar.org',
            },
        };

        const validation = validateCustomizationConfig(config);
        expect(validation.valid).toBe(true);

        const derived = deriveNetworkConfigFromCustomization(config);

        expect(derived.network).toBe('testnet');
        expect(derived.horizonUrl).toBe('https://horizon-testnet.stellar.org');
        expect(derived.networkPassphrase).toBe('Test SDF Network ; September 2015');
        expect(derived.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org');
    });

    it('derived config has all required fields', () => {
        const config: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'mainnet',
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        const derived = deriveNetworkConfigFromCustomization(config);

        expect(derived).toHaveProperty('network');
        expect(derived).toHaveProperty('horizonUrl');
        expect(derived).toHaveProperty('networkPassphrase');
        expect(derived).toHaveProperty('sorobanRpcUrl');

        // Verify types
        expect(typeof derived.network).toBe('string');
        expect(typeof derived.horizonUrl).toBe('string');
        expect(typeof derived.networkPassphrase).toBe('string');
        expect(typeof derived.sorobanRpcUrl).toBe('string');
    });

    it('derived URLs are https', () => {
        const mainnetConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'mainnet',
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        const mainnetDerived = deriveNetworkConfigFromCustomization(mainnetConfig);

        expect(mainnetDerived.horizonUrl).toMatch(/^https:\/\//);
        expect(mainnetDerived.sorobanRpcUrl).toMatch(/^https:\/\//);

        const testnetConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'testnet',
                horizonUrl: 'https://horizon-testnet.stellar.org',
            },
        };

        const testnetDerived = deriveNetworkConfigFromCustomization(testnetConfig);

        expect(testnetDerived.horizonUrl).toMatch(/^https:\/\//);
        expect(testnetDerived.sorobanRpcUrl).toMatch(/^https:\/\//);
    });

    it('passphrases are appropriate for network', () => {
        const mainnetConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'mainnet',
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        const mainnetDerived = deriveNetworkConfigFromCustomization(mainnetConfig);
        expect(mainnetDerived.networkPassphrase).toContain('Public Global');

        const testnetConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'testnet',
                horizonUrl: 'https://horizon-testnet.stellar.org',
            },
        };

        const testnetDerived = deriveNetworkConfigFromCustomization(testnetConfig);
        expect(testnetDerived.networkPassphrase).toContain('Test');
    });
});

// ── Complete Workflow Tests ────────────────────────────────────────────────

describe('Network Selection — Complete Workflow', () => {
    it('validates -> derives for mainnet deployment', () => {
        const userConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'mainnet',
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        // Step 1: Validate user input
        const validation = validateCustomizationConfig(userConfig);
        expect(validation.valid).toBe(true);

        // Step 2: Derive network config for code generation
        const derivedConfig = deriveNetworkConfigFromCustomization(userConfig);

        // Step 3: Verify config is ready for code generation
        expect(derivedConfig.network).toBe('mainnet');
        expect(derivedConfig.horizonUrl).toBe('https://horizon.stellar.org');
        expect(derivedConfig.sorobanRpcUrl).toBe('https://soroban-rpc.stellar.org');

        // Generated config should have required fields
        const codeGenConfig = {
            network: derivedConfig.network,
            horizonUrl: derivedConfig.horizonUrl,
            sorobanRpcUrl: derivedConfig.sorobanRpcUrl,
            networkPassphrase: derivedConfig.networkPassphrase,
        };

        expect(codeGenConfig.network).toBeTruthy();
        expect(codeGenConfig.horizonUrl).toBeTruthy();
        expect(codeGenConfig.networkPassphrase).toBeTruthy();
    });

    it('validates -> derives for testnet deployment', () => {
        const userConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'testnet',
                horizonUrl: 'https://horizon-testnet.stellar.org',
            },
        };

        const validation = validateCustomizationConfig(userConfig);
        expect(validation.valid).toBe(true);

        const derived = deriveNetworkConfigFromCustomization(userConfig);
        expect(derived.network).toBe('testnet');
        expect(derived.horizonUrl).toContain('testnet');
    });

    it('rejects invalid network early in pipeline', () => {
        const userConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'devnet' as any,
                horizonUrl: 'https://example.com',
            },
        };

        const validation = validateCustomizationConfig(userConfig);

        // Should fail at validation stage
        expect(validation.valid).toBe(false);

        // Should not proceed to derivation
        const errors = validation.errors;
        expect(errors.some((e) => e.code === 'NETWORK_UNSUPPORTED')).toBe(true);
    });

    it('provides clear guidance on network selection error', () => {
        const userConfig: CustomizationConfig = {
            ...validBaseConfig,
            stellar: {
                network: 'production' as any,
                horizonUrl: 'https://horizon.stellar.org',
            },
        };

        const validation = validateCustomizationConfig(userConfig);

        expect(validation.valid).toBe(false);
        const error = validation.errors.find((e) => e.field === 'stellar.network');

        expect(error?.message).toContain('not supported');
        expect(error?.code).toBe('NETWORK_UNSUPPORTED');
    });
});
