/**
 * AI Configuration
 * Config for AI auto-approval and evaluation settings
 */

export interface AIConfig {
  autoApproval: {
    enabled: boolean;
    threshold: number; // 0-100, minimum score to auto-approve
    minRequirements: {
      hasDescription: boolean; // Course must have description
      hasLearningObjectives: boolean; // Course must have learning objectives
      minLessons: number; // Minimum number of lessons
      minSections: number; // Minimum number of sections
    };
  };
}

/**
 * Get AI configuration from environment variables
 * Default values are provided for development
 */
export const getAIConfig = (): AIConfig => {
  // Auto-approval enabled/disabled
  const autoApprovalEnabled = process.env.AI_AUTO_APPROVAL_ENABLED === 'true' || false;

  // Auto-approval threshold (0-100)
  const threshold = Number(process.env.AI_AUTO_APPROVAL_THRESHOLD) || 70;

  // Clamp threshold to valid range
  const clampedThreshold = Math.max(0, Math.min(100, threshold));

  // Minimum requirements check enabled/disabled
  const checkMinRequirements = process.env.AI_AUTO_APPROVAL_MIN_REQUIREMENTS !== 'false'; // Default: true

  return {
    autoApproval: {
      enabled: autoApprovalEnabled,
      threshold: clampedThreshold,
      minRequirements: {
        hasDescription: checkMinRequirements,
        hasLearningObjectives: checkMinRequirements,
        minLessons: Number(process.env.AI_AUTO_APPROVAL_MIN_LESSONS) || 3,
        minSections: Number(process.env.AI_AUTO_APPROVAL_MIN_SECTIONS) || 1,
      },
    },
  };
};

/**
 * Default AI configuration
 * Used when environment variables are not set
 */
export const defaultAIConfig: AIConfig = {
  autoApproval: {
    enabled: false, // Disabled by default - requires explicit enable
    threshold: 70, // Default threshold: 70/100
    minRequirements: {
      hasDescription: true,
      hasLearningObjectives: true,
      minLessons: 3,
      minSections: 1,
    },
  },
};

// Export singleton instance
let aiConfigInstance: AIConfig | null = null;

export const getAIConfigInstance = (): AIConfig => {
  if (!aiConfigInstance) {
    aiConfigInstance = getAIConfig();
  }
  return aiConfigInstance;
};

export default getAIConfig;
