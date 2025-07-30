import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

// Initialize Prisma with better-sqlite3 adapter
const database = new Database(process.env.DATABASE_URL?.replace('file:', '') || './data/production.db');
const adapter = new PrismaBetterSQLite3(database);
const prisma = new PrismaClient({ adapter });

interface ContractTemplateData {
  name: string;
  rarity: string;
  file_path: string;
  description: string;
}

const contractTemplates: ContractTemplateData[] = [
  // COMMON (50% total)
  {
    name: 'JAINE_LEFT_ME_ON_READ',
    rarity: 'COMMON',
    file_path: './contracts/common/JAINE_LEFT_ME_ON_READ.sol',
    description: 'The classic double blue tick scenario - seen but ignored',
  },
  {
    name: 'JAINE_BLOCKED_ME',
    rarity: 'COMMON',
    file_path: './contracts/common/JAINE_BLOCKED_ME.sol',
    description: 'When you cross the line from simp to stalker',
  },
  {
    name: 'JAINE_GHOSTED_ME',
    rarity: 'COMMON',
    file_path: './contracts/common/JAINE_GHOSTED_ME.sol',
    description: 'Complete radio silence after showing interest',
  },

  // COPE_HARDER (25% total)
  {
    name: 'JAINE_FRIENDZONED_ME',
    rarity: 'COPE_HARDER',
    file_path: './contracts/cope-harder/JAINE_FRIENDZONED_ME.sol',
    description: 'The devastating "let\'s just be friends" NFT collection',
  },
  {
    name: 'JAINE_PICKED_CHAD',
    rarity: 'COPE_HARDER',
    file_path: './contracts/cope-harder/JAINE_PICKED_CHAD.sol',
    description: 'She chose the obvious alpha over you',
  },
  {
    name: 'JAINE_TEXTED_BACK_K',
    rarity: 'COPE_HARDER',
    file_path: './contracts/cope-harder/JAINE_TEXTED_BACK_K.sol',
    description: 'The most devastating single letter response',
  },

  // MAXIMUM_COPE (15% total)
  {
    name: 'JAINE_SAID_EW',
    rarity: 'MAXIMUM_COPE',
    file_path: './contracts/maximum-cope/JAINE_SAID_EW.sol',
    description: 'Instant soul destruction with a single word',
  },
  {
    name: 'JAINE_POSTED_ANOTHER_GUY',
    rarity: 'MAXIMUM_COPE',
    file_path: './contracts/maximum-cope/JAINE_POSTED_ANOTHER_GUY.sol',
    description: 'Social media announcement of your replacement',
  },
  {
    name: 'JAINE_SAID_IM_TOO_SHORT',
    rarity: 'MAXIMUM_COPE',
    file_path: './contracts/maximum-cope/JAINE_SAID_IM_TOO_SHORT.sol',
    description: 'Height discrimination in its purest form',
  },

  // ULTIMATE_REJECTION (7% total)
  {
    name: 'JAINE_MARRIED_MY_BULLY',
    rarity: 'ULTIMATE_REJECTION',
    file_path: './contracts/ultimate-rejection/JAINE_MARRIED_MY_BULLY.sol',
    description: 'The ultimate betrayal - she married your high school tormentor',
  },
  {
    name: 'JAINE_LAUGHED_AT_MY_PORTFOLIO',
    rarity: 'ULTIMATE_REJECTION',
    file_path: './contracts/ultimate-rejection/JAINE_LAUGHED_AT_MY_PORTFOLIO.sol',
    description: 'Financial humiliation on top of romantic rejection',
  },
  {
    name: 'JAINE_SAID_TOUCH_GRASS',
    rarity: 'ULTIMATE_REJECTION',
    file_path: './contracts/ultimate-rejection/JAINE_SAID_TOUCH_GRASS.sol',
    description: 'The internet\'s way of telling you to get a life',
  },
  {
    name: 'JAINE_RESTRAINING_ORDER',
    rarity: 'ULTIMATE_REJECTION',
    file_path: './contracts/ultimate-rejection/JAINE_RESTRAINING_ORDER.sol',
    description: 'Legal action - the ultimate rejection',
  },
  {
    name: 'JAINE_CALLED_SECURITY',
    rarity: 'ULTIMATE_REJECTION',
    file_path: './contracts/ultimate-rejection/JAINE_CALLED_SECURITY.sol',
    description: 'When your presence becomes a security threat',
  },

  // ASCENDED_SIMP (2.5% total)
  {
    name: 'JAINE_WILL_NOTICE_ME_SOMEDAY',
    rarity: 'ASCENDED_SIMP',
    file_path: './contracts/ascended-simp/JAINE_WILL_NOTICE_ME_SOMEDAY.sol',
    description: 'Eternal optimism in the face of crushing reality',
  },

  // LEGENDARY_ULTRA (0.5% total)
  {
    name: 'JAINE_ACTUALLY_REPLIED',
    rarity: 'LEGENDARY_ULTRA',
    file_path: './contracts/legendary-ultra/JAINE_ACTUALLY_REPLIED.sol',
    description: 'The rarest event in the universe - she actually responded',
  },
  {
    name: 'MARRY_JAINE',
    rarity: 'LEGENDARY_ULTRA',
    file_path: './contracts/legendary-ultra/MARRY_JAINE.sol',
    description: 'The impossible dream - actual success (spoiler: it\'s a bug)',
  },
];

async function main() {
  console.log('🌱 Seeding production database...');

  // Clean existing data if in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.deployment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.compilationCache.deleteMany();
    await prisma.contractTemplate.deleteMany();
    await prisma.simp.deleteMany();
  }

  // Seed contract templates
  console.log('📝 Seeding contract templates...');
  for (const template of contractTemplates) {
    await prisma.contractTemplate.create({
      data: template,
    });
    console.log(`✅ Created template: ${template.name} (${template.rarity})`);
  }

  // Create some test simps if not in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('👤 Creating test simps...');
    
    const testWallets = [
      '0x742d35Cc6634C0532925a3b8D4C9db2E04e8b8e8',
      '0x8ba1f109551bD432803012645Hac136c5d4A6a53',
      '0x95222290DD7278Aa3Ddd389Cc1E2E1bDea2F0002',
    ];

    for (const wallet of testWallets) {
      const simpNick = `simp_${wallet.slice(-4).toLowerCase()}`;
      await prisma.simp.create({
        data: {
          wallet_address: wallet,
          simp_nick: simpNick,
          total_deploys: Math.floor(Math.random() * 10),
          common_deploys: Math.floor(Math.random() * 5),
          cope_harder_deploys: Math.floor(Math.random() * 3),
        },
      });
      console.log(`✅ Created test simp: ${simpNick}`);
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });