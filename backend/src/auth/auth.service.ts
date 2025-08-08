import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { SiweService } from './siwe.service';
import { ConfigService } from '../config/config.service';
import { GenerateNonceDto, VerifySignatureDto, AuthResponseDto, NonceResponseDto } from './dto/auth.dto';


export interface SessionData {
  id: string;
  wallet_address: string;
  nonce: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly NONCE_EXPIRY_MINUTES = 10;

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private siweService: SiweService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate nonce for SIWE authentication
   */
  async generateNonce(generateNonceDto: GenerateNonceDto): Promise<NonceResponseDto> {
    const { wallet_address } = generateNonceDto;
    
    try {
      const nonce = this.siweService.generateNonce();
      const expiresAt = new Date(Date.now() + this.NONCE_EXPIRY_MINUTES * 60 * 1000);

      // Clean up expired sessions for this wallet
      await this.cleanupExpiredSessions(wallet_address);

      // Create new session with nonce
      await this.prisma.session.create({
        data: {
          wallet_address,
          nonce,
          expires_at: expiresAt,
        },
      });

      const siweMessage = this.siweService.createSiweMessage(wallet_address, nonce);

      if (this.configService.app.testEnv) {
        this.logger.debug(`Generated nonce for ${wallet_address}`, { nonce });
      }

      return {
        nonce,
        timestamp: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        siwe_message: siweMessage,
      };

    } catch (error) {
      this.logger.error('Failed to generate nonce:', error);
      throw new BadRequestException('Failed to generate authentication nonce');
    }
  }

  /**
   * Verify SIWE signature and authenticate user
   */
  async verifySignature(verifySignatureDto: VerifySignatureDto): Promise<AuthResponseDto> {
    const { message, signature } = verifySignatureDto;

    try {
      // Parse and verify the SIWE message
      const parsedMessage = this.siweService.parseSiweMessage(message);
      if (!parsedMessage) {
        throw new BadRequestException('Invalid SIWE message format');
      }

      // Check if message is expired
      if (this.siweService.isMessageExpired(message)) {
        throw new UnauthorizedException('Message has expired');
      }

      // Verify the signature
      const verificationResult = await this.siweService.verifySiweSignature(message, signature);
      
      if (!verificationResult.success) {
        throw new UnauthorizedException(verificationResult.error || 'Signature verification failed');
      }

      // Validate session and nonce
      const session = await this.validateSessionNonce(parsedMessage.address, parsedMessage.nonce);
      
      if (!session) {
        throw new UnauthorizedException('Invalid or expired nonce');
      }

      // Clean up the used session
      await this.prisma.session.delete({
        where: { id: session.id },
      });

      // Get or create user
      let user = await this.userService.findByWalletAddress(parsedMessage.address);
      
      if (!user) {
        user = await this.userService.create({
          wallet_address: parsedMessage.address,
        });
        
        if (this.configService.app.testEnv) {
          this.logger.debug(`Created new user: ${user.simp_nick}`);
        }
      }

      // Create session token
      const sessionToken = this.siweService.generateNonce(); // Use nonce as session token
      const sessionExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session in database
      await this.prisma.session.create({
        data: {
          wallet_address: user.wallet_address,
          nonce: sessionToken,
          expires_at: sessionExpiration,
        },
      });

      return {
        success: true,
        access_token: sessionToken,
        expires_at: sessionExpiration.toISOString(),
        user: {
          wallet_address: user.wallet_address,
          simp_nick: user.simp_nick,
          total_deploys: user.total_deploys,
          created_at: user.created_at.toISOString(),
        },
      };

    } catch (error) {
      this.logger.error('SIWE authentication failed:', {
        error: error.message,
        wallet: verifySignatureDto.message.substring(0, 42), // Extract wallet address safely
      });
      
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Authentication failed');
    }
  }

  /**
   * Validate session token
   */
  async validateSessionToken(token: string) {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          nonce: token,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const user = await this.userService.findByWalletAddress(session.wallet_address);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      return user;
      
    } catch (error) {
      this.logger.error('Session validation failed:', error);
      throw new UnauthorizedException('Invalid session token');
    }
  }

  /**
   * Logout user by invalidating all sessions
   */
  async logout(walletAddress: string): Promise<{ success: boolean; message: string }> {
    try {
      const deletedSessions = await this.prisma.session.deleteMany({
        where: { wallet_address: walletAddress },
      });

      if (this.configService.app.testEnv) {
        this.logger.debug(`Logged out user ${walletAddress}, deleted ${deletedSessions.count} sessions`);
      }

      return { 
        success: true, 
        message: 'Successfully logged out' 
      };
      
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new BadRequestException('Logout failed');
    }
  }

  /**
   * Validate session and nonce
   */
  private async validateSessionNonce(walletAddress: string, nonce: string): Promise<SessionData | null> {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          wallet_address: walletAddress,
          nonce,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      return session;
      
    } catch (error) {
      this.logger.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions for a wallet
   */
  private async cleanupExpiredSessions(walletAddress: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: {
          wallet_address: walletAddress,
          expires_at: {
            lte: new Date(),
          },
        },
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Get SIWE message template
   */
  getSiweMessageTemplate() {
    return this.siweService.getMessageTemplate();
  }

  /**
   * Clean up all expired sessions (maintenance task)
   */
  async cleanupAllExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expires_at: {
            lte: new Date(),
          },
        },
      });

      if (this.configService.app.testEnv && result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} expired sessions`);
      }

      return result.count;
      
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }
}