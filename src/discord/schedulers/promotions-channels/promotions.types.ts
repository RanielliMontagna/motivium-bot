export enum PromotionCategory {
  GENERAL = 'GENERAL',
  TECH = 'TECH',
  GAMING = 'GAMING',
  FITNESS = 'FITNESS',
  AUTOMOTIVE = 'AUTOMOTIVE',
  FASHION = 'FASHION',
  HOME = 'HOME',
}

export interface PromotionConfig {
  category: PromotionCategory
  discordChannelIds: string[]
  telegramChannels: string[]
  keywords: string[]
  schedulePattern: string
  maxPromotionsPerExecution: number
  maxAgeMinutes?: number
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

  [PromotionCategory.AUTOMOTIVE]: [
    'automotivo',
    'carro',
    'acessório automotivo',
    'serviço automotivo',
    'oficina',
    'pneu',
    'som automotivo',
    'alarme',
    'película',
    'combustível',
    'lavagem',
    'revisão',
    'seguro auto',
    'android auto',
    'apple carplay',
    'gps',
  ] as const,

  [PromotionCategory.FASHION]: [
    'moda',
    'roupa',
    'tênis',
    'camisa',
    'vestido',
    'bolsa',
    'sapato',
    'acessório',
    'fashion',
    'look',
    'calçado',
    'jaqueta',
    'blusa',
    'calça',
    'short',
    'bermuda',
    'saia',
    'chinelo',
    'sandália',
    'relógio',
    'óculos',
    'bijuteria',
  ] as const,

  [PromotionCategory.HOME]: [
    'casa',
    'decoração',
    'móvel',
    'sofá',
    'mesa',
    'cadeira',
    'eletrodoméstico',
    'cozinha',
    'banheiro',
    'organizador',
    'iluminação',
    'tapete',
    'cama',
    'armário',
    'geladeira',
    'airfryer',
    'fogão',
    'microondas',
    'aspirador',
    'ferro',
    'liquidificador',
    'panela',
    'utensílio',
    'decorativo',
  ] as const,
}

export const DEFAULT_PROMOTION_CONFIG: Omit<
  PromotionConfig,
  'category' | 'discordChannelIds' | 'telegramChannels' | 'keywords'
> = {
  schedulePattern: '*/5 * * * *', // A cada 5 minutos
  maxPromotionsPerExecution: 1,
  maxAgeMinutes: 10, // Padrão: 10 minutos
}

// Configuração específica para GENERAL (mais frequente)
export const GENERAL_PROMOTION_CONFIG: Omit<
  PromotionConfig,
  'category' | 'discordChannelIds' | 'telegramChannels' | 'keywords'
> = {
  schedulePattern: '*/1 * * * *', // A cada 1 minuto
  maxPromotionsPerExecution: 1,
  maxAgeMinutes: 5, // GENERAL: apenas 5 minutos para maior relevância
}

// Configurações específicas por categoria
export const CATEGORY_SPECIFIC_CONFIG: Record<
  PromotionCategory,
  Partial<Pick<PromotionConfig, 'schedulePattern' | 'maxPromotionsPerExecution' | 'maxAgeMinutes'>>
> = {
  [PromotionCategory.GENERAL]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 5,
  },
  [PromotionCategory.TECH]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 5,
  },
  [PromotionCategory.GAMING]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 5,
  },
  [PromotionCategory.FITNESS]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 5,
  },
  [PromotionCategory.AUTOMOTIVE]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 60,
  },
  [PromotionCategory.FASHION]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 5,
  },
  [PromotionCategory.HOME]: {
    schedulePattern: '*/1 * * * *',
    maxPromotionsPerExecution: 1,
    maxAgeMinutes: 60,
  },
}
