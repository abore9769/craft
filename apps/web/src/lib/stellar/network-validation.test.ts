import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    validateNetwork,
    getNetworkMetadata,
    isSupportedNetwork,
    areNetworksCompatible,
    deriveNetworkConfig,
    SUPPORTED_NETWORKS,
    NETWORK_METADATA,
    type StellarNetwork,
} from './network-validation';

// ── Unit Tests ───────────────────────────────────────────────────────────────

describe('validateNetwork', () => {
    describe('valid networks', () => {
        it('validates mainnet network', () => {
            const result = validateNetwork('mainnet');

            expect(result.valid).toBe(true);
            if (result.valid) {
                expect(result.network).toBe('mainnet');
                expect(result.metadata.horizonUrl).toBe('https://horizon.stellar.org');
                expect(result.metadata.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
            }
        });

        it('validates testnet network', () => {
            const result = validateNetwork('testnet');

            expect(result.valid).toBe(true);
            if (result.valid) {
                expect(result.network).toBe('testnet');
                expect(result.metadata.horizonUrl).toBe('https://horizon-testnet.stellar.org');
                expect(result.metadata.networkPassphrase).toBe('Test SDF Network ; September 2015');
            }
        });

        it('returns complete metadata for valid network', () => {
            const result = validateNetwork('mainnet');

            expect(result.valid).toBe(true);
            if (result.valid) {
                expect(result.metadata).toHaveProperty('network');
                expect(result.metadata).toHaveProperty('horizonUrl');
                expect(result.metadata).toHaveProperty('networkPassphrase');
                expect(result.metadata).toHaveProperty('sorobanRpcUrl');
                expect(result.metadata).toHaveProperty('displayName');
                expect(result.metadata).toHaveProperty('description');
            }
        });
    });

    describe('type validation', () => {
        it('rejects null input', () => {
            const result = validateNetwork(null);

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
            expect(!result.valid && result.supportedNetworks).toEqual(SUPPORTED_NETWORKS);
        });

        it('rejects undefined input', () => {
            const result = validateNetwork(undefined);

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
        });

        it('rejects number input', () => {
            const result = validateNetwork(123);

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
        });

        it('rejects boolean input', () => {
            const result = validateNetwork(true);

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
        });

        it('rejects array input', () => {
            const result = validateNetwork(['mainnet']);

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
        });

        it('rejects object input', () => {
            const result = validateNetwork({ network: 'mainnet' });

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
        });
    });

    describe('emptiness validation', () => {
        it('rejects empty string', () => {
            const result = validateNetwork('');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_EMPTY');
        });
    });

    describe('support validation', () => {
        it('rejects unsupported network devnet', () => {
            const result = validateNetwork('devnet');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
            expect(!result.valid && result.reason).toContain('not supported');
            expect(!result.valid && result.reason).toContain('mainnet');
            expect(!result.valid && result.reason).toContain('testnet');
        });

        it('rejects unsupported network production', () => {
            const result = validateNetwork('production');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('rejects random string', () => {
            const result = validateNetwork('unknown-network');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('includes supported networks in error', () => {
            const result = validateNetwork('invalid');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.supportedNetworks).toEqual(SUPPORTED_NETWORKS);
        });
    });

    describe('case sensitivity', () => {
        it('rejects uppercase MAINNET', () => {
            const result = validateNetwork('MAINNET');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('rejects mixed case Mainnet', () => {
            const result = validateNetwork('Mainnet');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
        });

        it('rejects mixed case TestNet', () => {
            const result = validateNetwork('TestNet');

            expect(result.valid).toBe(false);
            expect(!result.valid && result.code).toBe('NETWORK_UNSUPPORTED');
        });
    });
});

// ── Network Metadata Tests ──────────────────────────────────────────────────

describe('getNetworkMetadata', () => {
    it('returns mainnet metadata', () => {
        const metadata = getNetworkMetadata('mainnet');

        expect(metadata.network).toBe('mainnet');
        expect(metadata.displayName).toBe('Mainnet');
        expect(metadata.horizonUrl).toBe('https://horizon.stellar.org');
        expect(metadata.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
    });

    it('returns testnet metadata', () => {
        const metadata = getNetworkMetadata('testnet');

        expect(metadata.network).toBe('testnet');
        expect(metadata.displayName).toBe('Testnet');
        expect(metadata.horizonUrl).toBe('https://horizon-testnet.stellar.org');
        expect(metadata.networkPassphrase).toBe('Test SDF Network ; September 2015');
    });

    it('metadata contains soroban RPC URL', () => {
        const mainnetMetadata = getNetworkMetadata('mainnet');
        const testnetMetadata = getNetworkMetadata('testnet');

        expect(mainnetMetadata.sorobanRpcUrl).toBe('https://soroban-rpc.stellar.org');
        expect(testnetMetadata.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org');
    });
});

// ── Support Check Tests ─────────────────────────────────────────────────────

describe('isSupportedNetwork', () => {
    it('returns true for mainnet', () => {
        expect(isSupportedNetwork('mainnet')).toBe(true);
    });

    it('returns true for testnet', () => {
        expect(isSupportedNetwork('testnet')).toBe(true);
    });

    it('returns false for unsupported string', () => {
        expect(isSupportedNetwork('devnet')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isSupportedNetwork(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isSupportedNetwork(undefined)).toBe(false);
    });

    it('returns false for number', () => {
        expect(isSupportedNetwork(123)).toBe(false);
    });

    it('returns false for object', () => {
        expect(isSupportedNetwork({ network: 'mainnet' })).toBe(false);
    });

    it('works as type guard', () => {
        const network: unknown = 'mainnet';
        if (isSupportedNetwork(network)) {
            // network is now typed as StellarNetwork
            expect(network).toBe('mainnet');
        }
    });
});

// ── Network Compatibility Tests ─────────────────────────────────────────────

describe('areNetworksCompatible', () => {
    it('mainnet is compatible with mainnet', () => {
        expect(areNetworksCompatible('mainnet', 'mainnet')).toBe(true);
    });

    it('testnet is compatible with testnet', () => {
        expect(areNetworksCompatible('testnet', 'testnet')).toBe(true);
    });

    it('mainnet is not compatible with testnet', () => {
        expect(areNetworksCompatible('mainnet', 'testnet')).toBe(false);
    });

    it('testnet is not compatible with mainnet', () => {
        expect(areNetworksCompatible('testnet', 'mainnet')).toBe(false);
    });
});

// ── Network Config Derivation Tests ─────────────────────────────────────────

describe('deriveNetworkConfig', () => {
    it('derives mainnet configuration', () => {
        const config = deriveNetworkConfig('mainnet');

        expect(config.network).toBe('mainnet');
        expect(config.horizonUrl).toBe('https://horizon.stellar.org');
        expect(config.networkPassphrase).toBe('Public Global Stellar Network ; September 2015');
        expect(config.sorobanRpcUrl).toBe('https://soroban-rpc.stellar.org');
    });

    it('derives testnet configuration', () => {
        const config = deriveNetworkConfig('testnet');

        expect(config.network).toBe('testnet');
        expect(config.horizonUrl).toBe('https://horizon-testnet.stellar.org');
        expect(config.networkPassphrase).toBe('Test SDF Network ; September 2015');
        expect(config.sorobanRpcUrl).toBe('https://soroban-testnet.stellar.org');
    });

    it('derived config has all required fields', () => {
        const config = deriveNetworkConfig('mainnet');

        expect(config).toHaveProperty('network');
        expect(config).toHaveProperty('horizonUrl');
        expect(config).toHaveProperty('networkPassphrase');
        expect(config).toHaveProperty('sorobanRpcUrl');
    });
});

// ── Property-Based Tests ────────────────────────────────────────────────────

describe('validateNetwork — Property Tests', () => {
    it('always accepts supported networks', () => {
        fc.assert(
            fc.property(fc.constantFrom(...SUPPORTED_NETWORKS), (network) => {
                const result = validateNetwork(network);
                expect(result.valid).toBe(true);
                if (result.valid) {
                    expect(result.network).toBe(network);
                }
            })
        );
    });

    it('always has consistent metadata for supported networks', () => {
        fc.assert(
            fc.property(fc.constantFrom(...SUPPORTED_NETWORKS), (network) => {
                const result = validateNetwork(network);
                if (result.valid) {
                    const metadata = result.metadata;
                    expect(metadata.horizonUrl).toBeTruthy();
                    expect(metadata.networkPassphrase).toBeTruthy();
                    expect(metadata.sorobanRpcUrl).toBeTruthy();
                    expect(metadata.displayName).toBeTruthy();
                    expect(metadata.description).toBeTruthy();
                }
            })
        );
    });

    it('always rejects non-string inputs', () => {
        const nonStrings = fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.string()),
            fc.object()
        );

        fc.assert(
            fc.property(nonStrings, (input) => {
                const result = validateNetwork(input);
                expect(result.valid).toBe(false);
                expect(!result.valid && result.code).toBe('NETWORK_NOT_STRING');
            })
        );
    });

    it('always rejects unsupported network strings', () => {
        const unsupported = fc.string().filter((s) => !SUPPORTED_NETWORKS.includes(s as StellarNetwork));

        fc.assert(
            fc.property(unsupported, (network) => {
                if (network.length > 0) {
                    // Skip empty string case (tested separately)
                    const result = validateNetwork(network);
                    expect(result.valid).toBe(false);
                    expect(!result.valid && result.code).toMatch(/NETWORK_UNSUPPORTED|NETWORK_EMPTY/);
                }
            })
        );
    });

    it('metadata always has network field matching result network', () => {
        fc.assert(
            fc.property(fc.constantFrom(...SUPPORTED_NETWORKS), (network) => {
                const result = validateNetwork(network);
                if (result.valid) {
                    expect(result.metadata.network).toBe(result.network);
                }
            })
        );
    });
});

// ── Metadata Consistency Tests ──────────────────────────────────────────────

describe('NETWORK_METADATA — Consistency', () => {
    it('has entry for all supported networks', () => {
        SUPPORTED_NETWORKS.forEach((network) => {
            expect(NETWORK_METADATA).toHaveProperty(network);
        });
    });

    it('each metadata entry has all required fields', () => {
        Object.values(NETWORK_METADATA).forEach((metadata) => {
            expect(metadata.network).toBeTruthy();
            expect(metadata.horizonUrl).toBeTruthy();
            expect(metadata.networkPassphrase).toBeTruthy();
            expect(metadata.sorobanRpcUrl).toBeTruthy();
            expect(metadata.displayName).toBeTruthy();
            expect(metadata.description).toBeTruthy();
        });
    });

    it('network field matches key in metadata record', () => {
        Object.entries(NETWORK_METADATA).forEach(([key, metadata]) => {
            expect(metadata.network).toBe(key);
        });
    });

    it('horizon URLs are https', () => {
        Object.values(NETWORK_METADATA).forEach((metadata) => {
            expect(metadata.horizonUrl).toMatch(/^https:\/\//);
        });
    });

    it('soroban RPC URLs are https', () => {
        Object.values(NETWORK_METADATA).forEach((metadata) => {
            expect(metadata.sorobanRpcUrl).toMatch(/^https:\/\//);
        });
    });
});

// ── Network Selection Flow Tests ────────────────────────────────────────────

describe('Network Selection Flow', () => {
    it('validates network -> gets metadata -> derives config', () => {
        const network = 'mainnet';

        // Step 1: Validate
        const validationResult = validateNetwork(network);
        expect(validationResult.valid).toBe(true);

        if (validationResult.valid) {
            // Step 2: Get same metadata as returned
            const metadata = getNetworkMetadata(validationResult.network);
            expect(metadata).toEqual(validationResult.metadata);

            // Step 3: Derive full config
            const config = deriveNetworkConfig(validationResult.network);
            expect(config.horizonUrl).toBe(metadata.horizonUrl);
            expect(config.networkPassphrase).toBe(metadata.networkPassphrase);
            expect(config.sorobanRpcUrl).toBe(metadata.sorobanRpcUrl);
        }
    });

    it('complete workflow for testnet', () => {
        const userInput = 'testnet';

        // Validate user input
        const result = validateNetwork(userInput);
        expect(result.valid).toBe(true);

        if (result.valid) {
            // Store the network choice
            const selectedNetwork = result.network;

            // Use validation metadata
            expect(result.metadata.network).toBe(selectedNetwork);

            // Derive downstream config for code generation
            const derivedConfig = deriveNetworkConfig(selectedNetwork);
            expect(derivedConfig.network).toBe('testnet');
            expect(derivedConfig.horizonUrl).toContain('testnet');
            expect(derivedConfig.networkPassphrase).toContain('Test');
        }
    });
});
