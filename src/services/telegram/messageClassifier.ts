import type { SmartKeywordConfig } from '../../discord/schedulers/promotions-channels/promotions.types.js'
import type { ClassificationResult, IMessageClassifier } from './telegramService.types.js'

/**
 * Smart message classifier using advanced keyword analysis
 * Follows Single Responsibility Principle - only handles message classification
 */
export class SmartMessageClassifier implements IMessageClassifier {
  private static readonly CONFIDENCE_THRESHOLD = 20
  private static readonly WEIGHTS = {
    COMBINATION: 100,
    PRIMARY: 50,
    SECONDARY: 20,
    CONTEXT: 30,
    AMBIGUOUS_PENALTY: -15,
  } as const

  /**
   * Classifies a message using smart keyword configuration
   * @param message - The message text to classify
   * @param config - Smart keyword configuration for the category
   * @returns Classification result with match status, confidence, and reasoning
   */
  classify(message: string, config: SmartKeywordConfig): ClassificationResult {
    const normalizedMessage = this.normalizeMessage(message)

    // Early exclusion check (fail-fast pattern)
    const exclusionResult = this.checkExclusions(normalizedMessage, config.exclusions)
    if (!exclusionResult.isValid) {
      return this.createResult(false, 0, exclusionResult.reason)
    }

    const scoring = this.calculateScore(normalizedMessage, config)
    const confidence = this.calculateConfidence(scoring.score, scoring.maxScore)
    const match = confidence > SmartMessageClassifier.CONFIDENCE_THRESHOLD

    return this.createResult(match, confidence, scoring.reasons.join('; '))
  }

  /**
   * Normalizes message text for consistent processing
   */
  private normalizeMessage(message: string): string {
    return message.toLowerCase().trim()
  }

  /**
   * Checks if message contains exclusion keywords
   */
  private checkExclusions(
    message: string,
    exclusions: string[],
  ): { isValid: boolean; reason: string } {
    for (const exclusion of exclusions) {
      if (message.includes(exclusion.toLowerCase())) {
        return {
          isValid: false,
          reason: `Excluded by keyword: "${exclusion}"`,
        }
      }
    }
    return { isValid: true, reason: '' }
  }

  /**
   * Calculates comprehensive scoring for the message
   */
  private calculateScore(
    message: string,
    config: SmartKeywordConfig,
  ): { score: number; maxScore: number; reasons: string[] } {
    let score = 0
    let maxScore = 0
    const reasons: string[] = []

    // Check combinations (highest priority)
    const combinationResult = this.scoreCombinations(message, config.combinations)
    score += combinationResult.score
    maxScore += combinationResult.maxScore
    reasons.push(...combinationResult.reasons)

    // Check primary keywords
    const primaryResult = this.scoreKeywords(
      message,
      config.primary,
      SmartMessageClassifier.WEIGHTS.PRIMARY,
      'primary',
    )
    score += primaryResult.score
    maxScore += primaryResult.maxScore
    reasons.push(...primaryResult.reasons)

    // Check secondary keywords
    const secondaryResult = this.scoreKeywords(
      message,
      config.secondary,
      SmartMessageClassifier.WEIGHTS.SECONDARY,
      'secondary',
    )
    score += secondaryResult.score
    maxScore += secondaryResult.maxScore
    reasons.push(...secondaryResult.reasons)

    // Check context-required keywords
    const contextResult = this.scoreContextRequiredKeywords(message, config.contextRequired, [
      ...config.primary,
      ...config.secondary,
    ])
    score += contextResult.score
    maxScore += contextResult.maxScore
    reasons.push(...contextResult.reasons)

    return { score, maxScore, reasons: reasons.filter(Boolean) }
  }

  /**
   * Scores keyword combinations
   */
  private scoreCombinations(
    message: string,
    combinations: string[][],
  ): { score: number; maxScore: number; reasons: string[] } {
    let score = 0
    let maxScore = 0
    const reasons: string[] = []

    for (const combination of combinations) {
      maxScore += SmartMessageClassifier.WEIGHTS.COMBINATION

      const hasAllWords = combination.every((word) => message.includes(word.toLowerCase()))

      if (hasAllWords) {
        score += SmartMessageClassifier.WEIGHTS.COMBINATION
        reasons.push(`Combination found: ${combination.join(' + ')}`)
      }
    }

    return { score, maxScore, reasons }
  }

  /**
   * Scores individual keywords
   */
  private scoreKeywords(
    message: string,
    keywords: string[],
    weight: number,
    type: string,
  ): { score: number; maxScore: number; reasons: string[] } {
    let score = 0
    let maxScore = 0
    const reasons: string[] = []

    for (const keyword of keywords) {
      maxScore += weight

      if (message.includes(keyword.toLowerCase())) {
        score += weight
        reasons.push(`${type} keyword: ${keyword}`)
      }
    }

    return { score, maxScore, reasons }
  }

  /**
   * Scores context-required keywords (handles ambiguous words)
   */
  private scoreContextRequiredKeywords(
    message: string,
    contextRequired: string[],
    contextKeywords: string[],
  ): { score: number; maxScore: number; reasons: string[] } {
    let score = 0
    let maxScore = 0
    const reasons: string[] = []

    for (const contextWord of contextRequired) {
      maxScore += SmartMessageClassifier.WEIGHTS.CONTEXT

      if (message.includes(contextWord.toLowerCase())) {
        const hasValidContext = contextKeywords.some(
          (word) => word !== contextWord && message.includes(word.toLowerCase()),
        )

        if (hasValidContext) {
          score += SmartMessageClassifier.WEIGHTS.CONTEXT
          reasons.push(`Valid context for: ${contextWord}`)
        } else {
          score += SmartMessageClassifier.WEIGHTS.AMBIGUOUS_PENALTY
          reasons.push(`Ambiguous word without context: ${contextWord}`)
        }
      }
    }

    return { score, maxScore, reasons }
  }

  /**
   * Calculates final confidence percentage
   */
  private calculateConfidence(score: number, maxScore: number): number {
    if (maxScore === 0) return 0
    return Math.max(0, (score / maxScore) * 100)
  }

  /**
   * Creates a standardized classification result
   */
  private createResult(match: boolean, confidence: number, reason: string): ClassificationResult {
    return {
      match,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      reason: reason || 'No keywords found',
    }
  }
}
