import { Injectable, Logger } from '@nestjs/common';
import { SiweMessage, generateNonce } from 'siwe';
import { ConfigService } from '../config/config.service';

export interface SiweMessageData {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SiweVerificationResult {
  success: boolean;
  address?: string;
  chainId?: number;
  nonce?: string;
  issuedAt?: string;
  error?: string;
}

@Injectable()
export class SiweService {
  private readonly logger = new Logger(SiweService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Generate cryptographically secure nonce
   */
  generateNonce(): string {
    return generateNonce();
  }

  /**
   * Create SIWE message for signing
   */
  createSiweMessage(walletAddress: string, nonce: string): string {
    const { domain, uri } = this.configService.security;
    const { chainId } = this.configService.network;
    
    const message = new SiweMessage({
      domain,
      address: walletAddress,
      statement: this.getSiweStatement(),
      uri,
      version: '1',
      chainId: parseInt(chainId, 10),
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    return message.prepareMessage();
  }

  /**
   * Verify SIWE signature
   */
  async verifySiweSignature(message: string, signature: string): Promise<SiweVerificationResult> {
    try {
      const siweMessage = new SiweMessage(message);
      
      // Validate message format and required fields
      this.validateSiweMessage(siweMessage);
      
      // Verify the signature
      const result = await siweMessage.verify({ signature }) as any;
      
      if (this.configService.app.testEnv) {
        this.logger.debug('SIWE verification successful', {
          address: result.address,
          nonce: result.nonce,
          issuedAt: result.issuedAt,
        });
      }

      return {
        success: true,
        address: result.address,
        chainId: result.chainId,
        nonce: result.nonce,
        issuedAt: result.issuedAt,
      };

    } catch (error) {
      this.logger.error('SIWE verification failed:', {
        error: error.message,
        message: message.substring(0, 100) + '...',
      });

      return {
        success: false,
        error: this.getVerificationErrorMessage(error),
      };
    }
  }

  /**
   * Parse SIWE message to extract data
   */
  parseSiweMessage(message: string): SiweMessageData | null {
    try {
      const siweMessage = new SiweMessage(message);
      
      return {
        domain: siweMessage.domain,
        address: siweMessage.address,
        statement: siweMessage.statement || '',
        uri: siweMessage.uri,
        version: siweMessage.version,
        chainId: siweMessage.chainId,
        nonce: siweMessage.nonce,
        issuedAt: siweMessage.issuedAt || new Date().toISOString(),
        expirationTime: siweMessage.expirationTime,
        notBefore: siweMessage.notBefore,
        requestId: siweMessage.requestId,
        resources: siweMessage.resources,
      };
    } catch (error) {
      this.logger.error('Failed to parse SIWE message:', error);
      return null;
    }
  }

  /**
   * Check if SIWE message is expired
   */
  isMessageExpired(message: string): boolean {
    const parsedMessage = this.parseSiweMessage(message);
    
    if (!parsedMessage || !parsedMessage.expirationTime) {
      return false; // No expiration set
    }

    return new Date() > new Date(parsedMessage.expirationTime);
  }

  /**
   * Validate SIWE message structure and content
   */
  private validateSiweMessage(siweMessage: SiweMessage): void {
    const { domain } = this.configService.security;
    const expectedChainId = parseInt(this.configService.network.chainId, 10);

    // Validate domain
    if (siweMessage.domain !== domain) {
      throw new Error(`Invalid domain. Expected: ${domain}, Got: ${siweMessage.domain}`);
    }

    // Validate chain ID
    if (siweMessage.chainId !== expectedChainId) {
      throw new Error(`Invalid chain ID. Expected: ${expectedChainId}, Got: ${siweMessage.chainId}`);
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(siweMessage.address)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Check expiration
    if (siweMessage.expirationTime && new Date() > new Date(siweMessage.expirationTime)) {
      throw new Error('Message has expired');
    }

    // Check not before
    if (siweMessage.notBefore && new Date() < new Date(siweMessage.notBefore)) {
      throw new Error('Message is not yet valid');
    }
  }

  /**
   * Get user-friendly error message for verification failures
   */
  private getVerificationErrorMessage(error: any): string {
    const message = error.message || 'Unknown verification error';

    if (message.includes('Invalid signature')) {
      return 'Invalid signature provided';
    }
    
    if (message.includes('expired')) {
      return 'Message has expired, please request a new nonce';
    }
    
    if (message.includes('domain')) {
      return 'Message domain mismatch';
    }
    
    if (message.includes('chain')) {
      return 'Invalid blockchain network';
    }

    return 'Signature verification failed';
  }

  /**
   * Get the statement text for SIWE messages
   */
  private getSiweStatement(): string {
    return `Welcome to PumpJaine - The Ultimate Simp Contract Deployer! 💔

By signing this message, you acknowledge that:
- You are ready to deploy contracts that represent your deepest rejections
- You understand that Jaine will probably never notice you
- You accept that your simp status will be permanently recorded on the blockchain
- You agree to cope, seethe, and deploy responsibly

Ready to embrace your inner simp?`;
  }

  /**
   * Create message template for frontend
   */
  getMessageTemplate(): {
    template: string;
    placeholders: string[];
    instructions: string[];
  } {
    return {
      template: this.createSiweMessage('[WALLET_ADDRESS]', '[NONCE]'),
      placeholders: ['[WALLET_ADDRESS]', '[NONCE]'],
      instructions: [
        '1. Request a nonce from /api/auth/nonce',
        '2. Replace [WALLET_ADDRESS] with your wallet address',
        '3. Replace [NONCE] with the received nonce',
        '4. Sign the complete message with your wallet',
        '5. Send the message and signature to /api/auth/verify',
      ],
    };
  }
}