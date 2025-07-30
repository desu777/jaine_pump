import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface RarityConfig {
  name: string;
  weight: number;
  color: string;
  description: string;
}

export interface RaritySelection {
  rarity: string;
  roll: number;
  weight_threshold: number;
  is_lucky: boolean;
}

@Injectable()
export class RarityService {
  private readonly logger = new Logger(RarityService.name);

  private readonly rarityConfigs: Record<string, RarityConfig> = {
    COMMON: {
      name: 'COMMON',
      weight: 50.0,
      color: '#9CA3AF',
      description: 'Basic rejection scenarios for entry-level simps',
    },
    COPE_HARDER: {
      name: 'COPE HARDER',
      weight: 25.0,
      color: '#3B82F6',
      description: 'Mid-tier rejection contracts for intermediate coping',
    },
    MAXIMUM_COPE: {
      name: 'MAXIMUM COPE',
      weight: 15.0,
      color: '#8B5CF6',
      description: 'Advanced rejection scenarios for seasoned simps',
    },
    ULTIMATE_REJECTION: {
      name: 'ULTIMATE REJECTION',
      weight: 7.0,
      color: '#1F2937',
      description: 'Professional-level rejection contracts',
    },
    ASCENDED_SIMP: {
      name: 'ASCENDED SIMP',
      weight: 2.5,
      color: '#F59E0B',
      description: 'Legendary tier rejection experiences',
    },
    LEGENDARY_ULTRA: {
      name: 'LEGENDARY ULTRA',
      weight: 0.5,
      color: '#EF4444',
      description: 'The rarest and most devastating rejection contracts',
    },
  };

  constructor(private configService: ConfigService) {}

  /**
   * Select random rarity based on weights
   */
  selectRandomRarity(userAddress?: string): RaritySelection {
    // Use user address as seed for pseudo-randomness (optional feature)
    const random = userAddress 
      ? this.generateSeededRandom(userAddress)
      : Math.random();

    const roll = random * 100;
    let cumulativeWeight = 0;

    for (const [rarityKey, config] of Object.entries(this.rarityConfigs)) {
      cumulativeWeight += config.weight;
      
      if (roll <= cumulativeWeight) {
        const isLucky = config.weight < 10; // Consider anything under 10% as lucky
        
        if (this.configService.app.testEnv) {
          this.logger.debug(`Rarity roll: ${roll.toFixed(2)}% -> ${config.name}`, {
            userAddress: userAddress?.substring(0, 10) + '...',
            isLucky,
          });
        }

        return {
          rarity: rarityKey,
          roll: Math.round(roll * 100) / 100,
          weight_threshold: cumulativeWeight,
          is_lucky: isLucky,
        };
      }
    }

    // Fallback to COMMON (should never reach here)
    return {
      rarity: 'COMMON',
      roll: Math.round(roll * 100) / 100,
      weight_threshold: 50,
      is_lucky: false,
    };
  }

  /**
   * Get all rarity configurations
   */
  getRarityConfigs(): Record<string, RarityConfig> {
    return { ...this.rarityConfigs };
  }

  /**
   * Get specific rarity configuration
   */
  getRarityConfig(rarity: string): RarityConfig | null {
    return this.rarityConfigs[rarity] || null;
  }

  /**
   * Get rarity by weight threshold
   */
  getRarityByWeight(weight: number): string {
    let cumulativeWeight = 0;
    
    for (const [rarityKey, config] of Object.entries(this.rarityConfigs)) {
      cumulativeWeight += config.weight;
      if (weight <= cumulativeWeight) {
        return rarityKey;
      }
    }
    
    return 'COMMON';
  }

  /**
   * Check if rarity is valid
   */
  isValidRarity(rarity: string): boolean {
    return rarity in this.rarityConfigs;
  }

  /**
   * Get rarity display name
   */
  getRarityDisplayName(rarity: string): string {
    return this.rarityConfigs[rarity]?.name || rarity;
  }

  /**
   * Get rarity color
   */
  getRarityColor(rarity: string): string {
    return this.rarityConfigs[rarity]?.color || '#9CA3AF';
  }

  /**
   * Calculate rarity rarity score (lower = rarer)
   */
  getRarityScore(rarity: string): number {
    const config = this.rarityConfigs[rarity];
    if (!config) return 100;
    
    // Invert weight to get rarity score (rare = low score)
    return Math.round((100 - config.weight) * 100) / 100;
  }

  /**
   * Get all rarities sorted by rarity (common to legendary)
   */
  getRaritiesSorted(): string[] {
    return Object.entries(this.rarityConfigs)
      .sort(([, a], [, b]) => b.weight - a.weight) // Sort by weight descending
      .map(([key]) => key);
  }

  /**
   * Get probability distribution
   */
  getProbabilityDistribution(): Array<{
    rarity: string;
    name: string;
    weight: number;
    percentage: string;
    cumulative: number;
    color: string;
  }> {
    let cumulative = 0;
    
    return Object.entries(this.rarityConfigs).map(([key, config]) => {
      cumulative += config.weight;
      
      return {
        rarity: key,
        name: config.name,
        weight: config.weight,
        percentage: `${config.weight}%`,
        cumulative: Math.round(cumulative * 100) / 100,
        color: config.color,
      };
    });
  }

  /**
   * Generate seeded random number from user address
   */
  private generateSeededRandom(userAddress: string): number {
    // Simple seeded random based on address and current time
    const seed = userAddress.toLowerCase() + Date.now().toString();
    let hash = 0;
    
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 0-1 range
    return Math.abs(hash) / 2147483647;
  }

  /**
   * Simulate rarity rolls for testing
   */
  simulateRolls(count: number = 1000): Record<string, number> {
    const results: Record<string, number> = {};
    
    // Initialize counters
    Object.keys(this.rarityConfigs).forEach(rarity => {
      results[rarity] = 0;
    });
    
    // Simulate rolls
    for (let i = 0; i < count; i++) {
      const selection = this.selectRandomRarity();
      results[selection.rarity]++;
    }
    
    return results;
  }

  /**
   * Get expected vs actual distribution
   */
  analyzeDistribution(actualCounts: Record<string, number>): Array<{
    rarity: string;
    expected_percentage: number;
    actual_percentage: number;
    difference: number;
    total_count: number;
  }> {
    const totalCount = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(this.rarityConfigs).map(([rarity, config]) => {
      const actualCount = actualCounts[rarity] || 0;
      const actualPercentage = totalCount > 0 ? (actualCount / totalCount) * 100 : 0;
      const difference = actualPercentage - config.weight;
      
      return {
        rarity,
        expected_percentage: config.weight,
        actual_percentage: Math.round(actualPercentage * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        total_count: actualCount,
      };
    });
  }
}