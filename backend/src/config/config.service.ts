import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface NetworkConfig {
  rpc: string;
  chainId: string;
  explorer?: string;
  faucet?: string;
}

export interface SecurityConfig {
  corsOrigins: string[];
  domain: string;
  uri: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  testEnv: boolean;
}

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get app(): AppConfig {
    const env = this.nestConfigService.get<string>('NODE_ENV', 'production');
    
    return {
      env,
      port: this.nestConfigService.get<number>('PORT', 3001),
      apiPrefix: this.nestConfigService.get<string>('API_PREFIX', 'api'),
      isProduction: env === 'production',
      isDevelopment: env === 'development',
      isTest: env === 'test',
      testEnv: this.nestConfigService.get<string>('TEST_ENV') === 'true',
    };
  }

  get database(): DatabaseConfig {
    return {
      url: this.nestConfigService.get<string>('DATABASE_URL'),
    };
  }

  get jwt(): JwtConfig {
    return {
      secret: this.nestConfigService.get<string>('JWT_SECRET'),
      expiresIn: this.nestConfigService.get<string>('JWT_EXPIRES_IN', '24h'),
    };
  }

  get network(): NetworkConfig {
    return {
      rpc: this.nestConfigService.get<string>('ZERO_G_TESTNET_RPC'),
      chainId: this.nestConfigService.get<string>('ZERO_G_CHAIN_ID', '16601'),
      explorer: this.nestConfigService.get<string>('ZERO_G_EXPLORER'),
      faucet: this.nestConfigService.get<string>('ZERO_G_FAUCET'),
    };
  }

  get security(): SecurityConfig {
    const corsOrigins = this.nestConfigService.get<string>('CORS_ORIGINS', '');
    
    return {
      corsOrigins: corsOrigins.split(',').map(origin => origin.trim()),
      domain: this.nestConfigService.get<string>('DOMAIN'),
      uri: this.nestConfigService.get<string>('URI'),
    };
  }

  get throttle(): ThrottleConfig {
    return {
      ttl: this.nestConfigService.get<number>('THROTTLE_TTL', 60000),
      limit: this.nestConfigService.get<number>('THROTTLE_LIMIT', 100),
    };
  }

  get(key: string): string | undefined {
    return this.nestConfigService.get<string>(key);
  }

  getOrThrow(key: string): string {
    const value = this.nestConfigService.get<string>(key);
    if (!value) {
      throw new Error(`Configuration key ${key} is required but not set`);
    }
    return value;
  }
}