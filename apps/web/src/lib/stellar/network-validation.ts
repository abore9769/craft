/**
 * Stellar Network Selection Validation
 *
 * Validates network selection, ensures it's supported, and provides
 * network metadata for downstream code generation and configuration.
 * 
 * Supported networks: mainnet, testnet
 * Network metadata includes: horizonUrl, networkPassphrase, sorobanRpcUrl mappings
 */

export type StellarNetwork = 'mainnet' | 'testnet';

export const SUPPORTED_NETWORKS: readonly StellarNetwork[] = ['mainnet', 'testnet'] as const;

/**
 * Stellar network metadata - maps network identifiers to their
 * configuration endpoints and passphrases.
 */
export interface NetworkMetadata {
    network: StellarNetwork;
    horizonUrl: string;
    networkPassphrase: string;
    sorobanRpcUrl: string;
    displayName: string;
    description: string;
}

/**
 * Complete network metadata for all supported networks
 */
export const NETWORK_METADATA: Record<StellarNetwork, NetworkMetadata> = {
    mainnet: {
        network: 'mainnet',
        horizonUrl: 'https://horizon.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        sorobanRpcUrl: 'https://soroban-rpc.stellar.org',
        displayName: 'Mainnet',
        description: 'Production Stellar network for real transactions',
    },
    testnet: {
        network: 'testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
        displayName: 'Testnet',
        description: 'Test network for development and testing',
    },
};

/**
 * Validation result for network selection
 */
export type NetworkValidationResult =
    | { valid: true; network: StellarNetwork; metadata: NetworkMetadata }
    | {
          valid: false;
          network?: StellarNetwork;
          reason: string;
          code: string;
          supportedNetworks: StellarNetwork[];
      };

/**
 * Validate a network identifier against supported networks.
 * Returns validation result with network metadata if valid.
 * 
 * @param network - The network identifier to validate
 * @returns Validation result with metadata or error details
 */
export function validateNetwork(network: unknown): NetworkValidationResult {
    // Type check
    if (typeof network !== 'string') {
        return {
            valid: false,
            reason: 'Network must be a string',
            code: 'NETWORK_NOT_STRING',
            supportedNetworks: SUPPORTED_NETWORKS,
        };
    }

    // Emptiness check
    if (network.length === 0) {
        return {
            valid: false,
            reason: 'Network identifier cannot be empty',
            code: 'NETWORK_EMPTY',
            supportedNetworks: SUPPORTED_NETWORKS,
        };
    }

    // Support check
    if (!SUPPORTED_NETWORKS.includes(network as StellarNetwork)) {
        return {
            valid: false,
            network: network as StellarNetwork,
            reason: `Network "${network}" is not supported. Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`,
            code: 'NETWORK_UNSUPPORTED',
            supportedNetworks: SUPPORTED_NETWORKS,
        };
    }

    // All checks passed
    const validNetwork = network as StellarNetwork;
    const metadata = NETWORK_METADATA[validNetwork];

    return {
        valid: true,
        network: validNetwork,
        metadata,
    };
}

/**
 * Get network metadata for a valid network.
 * Assumes network has already been validated.
 * 
 * @param network - A validated network identifier
 * @returns Network metadata
 */
export function getNetworkMetadata(network: StellarNetwork): NetworkMetadata {
    return NETWORK_METADATA[network];
}

/**
 * Check if a network is supported
 * 
 * @param network - The network identifier to check
 * @returns True if network is supported
 */
export function isSupportedNetwork(network: unknown): network is StellarNetwork {
    return typeof network === 'string' && SUPPORTED_NETWORKS.includes(network as StellarNetwork);
}

/**
 * Check if two networks are compatible for configuration
 * (useful for validation of downstream configs)
 * 
 * @param selectedNetwork - The selected network
 * @param configNetwork - The network in a downstream config
 * @returns True if they match
 */
export function areNetworksCompatible(
    selectedNetwork: StellarNetwork,
    configNetwork: StellarNetwork
): boolean {
    return selectedNetwork === configNetwork;
}

/**
 * Derive all downstream network configuration from a network selection
 * This prepares metadata for code generation and configuration derivation.
 * 
 * @param network - The selected network
 * @returns Object with all derived configuration values
 */
export function deriveNetworkConfig(network: StellarNetwork): {
    network: StellarNetwork;
    horizonUrl: string;
    networkPassphrase: string;
    sorobanRpcUrl: string;
} {
    const metadata = NETWORK_METADATA[network];
    return {
        network,
        horizonUrl: metadata.horizonUrl,
        networkPassphrase: metadata.networkPassphrase,
        sorobanRpcUrl: metadata.sorobanRpcUrl,
    };
}
