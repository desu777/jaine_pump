# 💔 PumpJaine Backend

The Ultimate Simp Contract Deployer - Production-ready backend API built with NestJS.

## Overview

PumpJaine is a blockchain-based platform that allows users to deploy emotionally devastating smart contracts representing different levels of romantic rejection. Built for the 0G-Galileo-Testnet, it features a comprehensive rarity system, SIWE authentication, and real-time Solidity compilation.

## Architecture

- **Framework**: NestJS 10.x with TypeScript
- **Database**: SQLite with Prisma ORM + better-sqlite3 adapter  
- **Authentication**: Sign-In with Ethereum (SIWE)
- **Blockchain**: 0G-Galileo-Testnet (Chain ID: 16601)
- **Compiler**: Solidity 0.8.30 with Cancun EVM support

## Features

### 🔐 Authentication
- SIWE (Sign-In with Ethereum) integration
- JWT-based session management
- Secure nonce generation and validation

### 📜 Contract Templates
- 17 different rejection scenarios across 6 rarity tiers
- Weighted random selection system
- Real-time Solidity compilation with caching

### 📊 User Management
- Simp nickname generation
- Deployment statistics tracking
- Leaderboard system with ranking
- Level progression system

### 🚀 Deployment Tracking
- Complete deployment history
- Gas usage monitoring
- Cross-referenced with templates and users

### ⚡ Performance
- Production-optimized with better-sqlite3
- Compilation result caching
- Rate limiting and security headers

## Quick Start

### Prerequisites
- Node.js 18.19.1+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./data/production.db"

# JWT Security  
JWT_SECRET="your-super-secret-key-here"

# 0G Network
ZERO_G_TESTNET_RPC="https://evmrpc-testnet.0g.ai"
ZERO_G_CHAIN_ID="16601"

# Application
NODE_ENV="production"
PORT="3001"
DOMAIN="pumpjaine.com"
URI="https://pumpjaine.com"
CORS_ORIGINS="https://pumpjaine.com"
```

### Development

```bash
# Start development server
npm run start:dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Documentation

When running in development mode, visit `/docs` for interactive Swagger documentation.

### Key Endpoints

- `POST /api/auth/nonce` - Generate authentication nonce
- `POST /api/auth/verify` - Verify SIWE signature  
- `POST /api/compiler/compile` - Compile contract template
- `GET /api/contract-templates/random` - Get random template
- `POST /api/deployments/record` - Record deployment
- `GET /api/users/leaderboard` - Get simp leaderboard

## Contract Templates

### Rarity System

| Rarity | Weight | Description |
|--------|--------|-------------|
| 🤍 COMMON | 50% | Basic rejection scenarios |
| 💙 COPE HARDER | 25% | Mid-tier coping mechanisms |
| 💜 MAXIMUM COPE | 15% | Advanced rejection handling | 
| 🖤 ULTIMATE REJECTION | 7% | Professional-level pain |
| 💛 ASCENDED SIMP | 2.5% | Legendary tier suffering |
| ⭐ LEGENDARY ULTRA | 0.5% | The rarest heartbreak |

### Available Templates

- JAINE_LEFT_ME_ON_READ.sol
- JAINE_BLOCKED_ME.sol  
- JAINE_FRIENDZONED_ME.sol
- JAINE_SAID_EW.sol
- JAINE_RESTRAINING_ORDER.sol
- JAINE_ACTUALLY_REPLIED.sol
- ...and more!

## Database Schema

### Core Tables
- `simps` - User accounts and statistics
- `sessions` - Authentication sessions
- `contract_templates` - Available contract templates
- `deployments` - Deployment tracking
- `compilation_cache` - Compiled contract cache

## Security

- Helmet.js security headers
- CORS protection
- Rate limiting with different tiers
- Input validation and sanitization
- Environment variable validation
- Secure session management

## Performance Optimizations

- Better-sqlite3 for maximum SQLite performance
- Compilation result caching
- Database query optimization
- Compression middleware
- Connection pooling
- WAL mode for concurrent access

## Monitoring

### Health Checks
- `GET /health` - Basic health status
- `GET /api/status` - Detailed service status
- `GET /api/version` - Version information

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Maximum 500-550 lines per file
- Comprehensive error handling
- Production-ready patterns

### Testing
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Coverage
npm run test:cov
```

## Deployment

### Environment Variables
All sensitive configuration uses environment variables. See `.env.example` for required variables.

### Database Migrations
```bash
# Production migrations
npm run prisma:migrate:prod
```

### Process Management
Recommended to use PM2 or similar for production deployment:

```bash
pm2 start dist/main.js --name pumpjaine-backend
```

## Contributing

1. Follow the existing code patterns
2. Maintain the 500-line file limit
3. Add comprehensive error handling
4. Update documentation
5. Add tests for new features

## License

MIT License - Built for the simp community 💔

---

*"Sometimes the best smart contracts are the ones that remind us of our greatest failures in love."*