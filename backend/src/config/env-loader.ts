import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Production-ready environment loader
 * Loads from external secure path or fallback to local .env
 */
export class EnvLoader {
  private static instance: EnvLoader;
  private envVars: Record<string, string> = {};

  private constructor() {
    this.loadEnvironmentVariables();
  }

  public static getInstance(): EnvLoader {
    if (!EnvLoader.instance) {
      EnvLoader.instance = new EnvLoader();
    }
    return EnvLoader.instance;
  }

  private loadEnvironmentVariables(): void {
    // Try external secure path first (production)
    const externalPath = process.env.ENV_FILE_PATH;
    
    if (externalPath && existsSync(externalPath)) {
      this.loadFromFile(externalPath, 'external secure location');
      return;
    }

    // Fallback to local .env (development)
    const localPath = join(process.cwd(), '.env');
    if (existsSync(localPath)) {
      this.loadFromFile(localPath, 'local .env file');
      return;
    }

    // Use process.env as final fallback
    this.envVars = { ...process.env } as Record<string, string>;
    this.logDebug('Using process.env variables');
  }

  private loadFromFile(filePath: string, source: string): void {
    try {
      const envContent = readFileSync(filePath, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            this.envVars[key.trim()] = value.trim();
          }
        }
      }

      this.logDebug(`Environment loaded from ${source}`);
    } catch (error) {
      console.error(`Failed to load environment from ${filePath}:`, error);
      throw new Error(`Environment loading failed: ${error.message}`);
    }
  }

  public get(key: string, defaultValue?: string): string {
    const value = this.envVars[key] || process.env[key] || defaultValue;
    
    if (value === undefined) {
      throw new Error(`Required environment variable ${key} is not set`);
    }

    return value;
  }

  public getOptional(key: string, defaultValue?: string): string | undefined {
    return this.envVars[key] || process.env[key] || defaultValue;
  }

  public getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const parsed = parseInt(value, 10);
    
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }

    return parsed;
  }

  public getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value.toLowerCase() === 'true';
  }

  public getArray(key: string, delimiter: string = ','): string[] {
    const value = this.getOptional(key);
    return value ? value.split(delimiter).map(item => item.trim()) : [];
  }

  public validateRequiredVars(): void {
    const requiredVars = this.getOptional('REQUIRED_ENV_VARS', '');
    
    if (!requiredVars) {
      this.logDebug('No required environment variables specified');
      return;
    }

    const required = requiredVars.split(',').map(v => v.trim());
    const missing: string[] = [];

    for (const varName of required) {
      if (!this.envVars[varName] && !process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.logDebug(`All required environment variables are present`);
  }

  private logDebug(message: string): void {
    if (process.env.TEST_ENV === 'true') {
      console.log(`[EnvLoader] ${message}`);
    }
  }

  public getAllVars(): Record<string, string> {
    return { ...this.envVars };
  }
}

// Export singleton instance
export const envLoader = EnvLoader.getInstance();