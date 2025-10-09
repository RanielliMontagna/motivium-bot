export enum PromotionCategory {
  GENERAL = 'GENERAL',
  TECH = 'TECH',
  GAMING = 'GAMING',
  FITNESS = 'FITNESS',
}

export interface PromotionConfig {
  category: PromotionCategory
  discordChannelIds: string[]
  telegramChannels: string[]
  keywords: string[]
  schedulePattern: string
  maxPromotionsPerExecution: number
}

export const PROMOTION_KEYWORDS = {
  [PromotionCategory.GENERAL]: [
    'promoção',
    'desconto',
    'oferta',
    'cupom',
    'grátis',
    'free',
    'promo',
    'barato',
    'liquidação',
    'sale',
    'black friday',
    'cyber monday',
    '%',
    'off',
    'imperdível',
    'oportunidade',
    'último dia',
    'por tempo limitado',
  ] as const,

  [PromotionCategory.TECH]: [
    'smartphone',
    'celular',
    'notebook',
    'laptop',
    'tablet',
    'fone',
    'headset',
    'carregador',
    'cabo',
    'mouse',
    'teclado',
    'monitor',
    'tv',
    'smartwatch',
    'tech',
    'tecnologia',
    'eletrônico',
    'gadget',
    'samsung',
    'apple',
    'xiaomi',
  ] as const,

  [PromotionCategory.GAMING]: [
    'game',
    'jogo',
    'steam',
    'epic',
    'playstation',
    'xbox',
    'nintendo',
    'switch',
    'ps5',
    'ps4',
    'controle',
    'joystick',
    'headset gamer',
    'cadeira gamer',
    'placa de vídeo',
    'gpu',
    'gaming',
    'gamer',
    'setup',
  ] as const,

  [PromotionCategory.FITNESS]: [
    'academia',
    'fitness',
    'treino',
    'whey',
    'protein',
    'suplemento',
    'creatina',
    'bcaa',
    'pre treino',
    'esteira',
    'bicicleta',
    'halteres',
    'musculação',
    'crossfit',
    'yoga',
    'pilates',
    'saúde',
  ] as const,
}

export const DEFAULT_PROMOTION_CONFIG: Omit<
  PromotionConfig,
  'category' | 'discordChannelIds' | 'telegramChannels' | 'keywords'
> = {
  schedulePattern: '*/1 * * * *', // A cada 1 minuto
  maxPromotionsPerExecution: 1,
}

// Configuração específica para GENERAL (mais frequente)
export const GENERAL_PROMOTION_CONFIG: Omit<
  PromotionConfig,
  'category' | 'discordChannelIds' | 'telegramChannels' | 'keywords'
> = {
  schedulePattern: '*/1 * * * *', // A cada 1 minuto
  maxPromotionsPerExecution: 1,
}
