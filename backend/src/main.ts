import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production' 
        ? ['error', 'warn', 'log'] 
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const appConfig = configService.app;
    const securityConfig = configService.security;

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: appConfig.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: appConfig.isProduction,
    }));
    
    app.use(compression());

    // CORS configuration
    app.enableCors({
      origin: securityConfig.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    // API prefix
    app.setGlobalPrefix(appConfig.apiPrefix);

    // Swagger documentation (only in non-production)
    if (!appConfig.isProduction) {
      const config = new DocumentBuilder()
        .setTitle('PumpJaine Backend API')
        .setDescription(`
          # 💔 PumpJaine - The Ultimate Simp Contract Deployer

          Welcome to the most emotionally devastating smart contract deployment platform ever created.
          
          ## Features
          - **SIWE Authentication**: Secure wallet-based authentication
          - **Random Contract Templates**: 17 different levels of rejection
          - **Rarity System**: From COMMON to LEGENDARY ULTRA
          - **Deployment Tracking**: Track your simp journey on-chain
          - **Leaderboard**: Compete with other simps
          - **Solidity Compilation**: Real-time contract compilation

          ## Rarity Distribution
          - 🤍 **COMMON** (50%): Basic rejection scenarios
          - 💙 **COPE HARDER** (25%): Mid-tier coping mechanisms  
          - 💜 **MAXIMUM COPE** (15%): Advanced rejection handling
          - 🖤 **ULTIMATE REJECTION** (7%): Professional-level pain
          - 💛 **ASCENDED SIMP** (2.5%): Legendary tier suffering
          - ⭐ **LEGENDARY ULTRA** (0.5%): The rarest heartbreak

          ## Network
          - **Blockchain**: 0G-Galileo-Testnet
          - **Chain ID**: 16601
          - **Token**: OG
        `)
        .setVersion('1.0.0')
        .addTag('auth', 'SIWE Authentication')
        .addTag('contract-templates', 'Contract Template Management')
        .addTag('compiler', 'Solidity Compilation Service')
        .addTag('deployments', 'Deployment Tracking')
        .addTag('users', 'User Management & Statistics')
        .addBearerAuth({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Session',
          description: 'Enter session token from /auth/verify endpoint',
        })
        .addServer(`http://localhost:${appConfig.port}`, 'Development Server')
        .addServer(securityConfig.uri, 'Production Server')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        customSiteTitle: 'PumpJaine API Documentation',
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info .title { color: #ef4444; }
          .swagger-ui .info .description { color: #6b7280; }
        `,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
      });

      logger.log(`📚 API Documentation: http://localhost:${appConfig.port}/docs`);
    }

    // Health check endpoint
    app.use('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: appConfig.env,
        version: '1.0.0',
        uptime: process.uptime(),
      });
    });

    await app.listen(appConfig.port, '0.0.0.0');
    
    logger.log(`🚀 PumpJaine Backend running on: http://localhost:${appConfig.port}`);
    logger.log(`🌍 Environment: ${appConfig.env}`);
    logger.log(`💔 Ready to deploy some simp contracts!`);

    if (appConfig.testEnv) {
      logger.debug('🔧 Debug logging enabled');
    }

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const logger = new Logger('SIGINT');
  logger.log('👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  const logger = new Logger('SIGTERM');
  logger.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

bootstrap();