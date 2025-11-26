import { WooCommerceProduct } from './types';

/**
 * Calcula o preço unitário baseado na quantidade
 * Verifica meta_data do produto para preços em níveis (tier pricing)
 * Formato esperado na meta_data:
 * {
 *   key: '_tier_pricing',
 *   value: [
 *     { min_qty: 1, max_qty: 99, price: '10.00' },
 *     { min_qty: 100, max_qty: 499, price: '8.50' },
 *     { min_qty: 500, max_qty: null, price: '7.00' }
 *   ]
 * }
 */
export const calculatePriceByQuantity = (product: WooCommerceProduct, quantity: number): number => {
  // Verificar se existe tier pricing no meta_data
  if (product.meta_data && Array.isArray(product.meta_data)) {
    const tierPricingMeta = product.meta_data.find(
      meta => meta.key === '_tier_pricing' || meta.key === 'tier_pricing'
    );

    if (tierPricingMeta && tierPricingMeta.value) {
      let tiers: Array<{min_qty?: number; min?: number; max_qty?: number | null; max?: number | null; price?: string}> = [];
      
      // Suportar tanto array quanto string JSON
      if (typeof tierPricingMeta.value === 'string') {
        try {
          tiers = JSON.parse(tierPricingMeta.value);
        } catch (e) {
          console.warn('Erro ao parsear tier pricing:', e);
        }
      } else if (Array.isArray(tierPricingMeta.value)) {
        tiers = tierPricingMeta.value;
      }

      // Encontrar o tier apropriado para a quantidade
      for (const tier of tiers) {
        const minQty = tier.min_qty || tier.min || 0;
        const maxQty = tier.max_qty || tier.max || null;
        
        if (quantity >= minQty && (maxQty === null || quantity <= maxQty)) {
          const price = parseFloat(tier.price || '0');
          if (!isNaN(price)) {
            return price;
          }
        }
      }
    }
  }

  // Se não houver tier pricing, usar o preço de venda ou regular
  const price = parseFloat(product.sale_price || product.price || product.regular_price || '0');
  return isNaN(price) ? 0 : price;
};

/**
 * Formata o preço para exibição em reais
 */
export const formatPrice = (price: number): string => {
  if (!price || isNaN(price)) return 'Preço não disponível';
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

/**
 * Retorna informações sobre os níveis de preço disponíveis para um produto
 */
export const getPriceTiers = (product: WooCommerceProduct): Array<{min: number, max: number | null, price: number}> | null => {
  if (!product.meta_data || !Array.isArray(product.meta_data)) {
    return null;
  }

  const tierPricingMeta = product.meta_data.find(
    meta => meta.key === '_tier_pricing' || meta.key === 'tier_pricing'
  );

  if (!tierPricingMeta || !tierPricingMeta.value) {
    return null;
  }

  let tiers: Array<{min_qty?: number; min?: number; max_qty?: number | null; max?: number | null; price?: string}> = [];
  
  if (typeof tierPricingMeta.value === 'string') {
    try {
      tiers = JSON.parse(tierPricingMeta.value);
    } catch (e) {
      return null;
    }
  } else if (Array.isArray(tierPricingMeta.value)) {
    tiers = tierPricingMeta.value;
  }

  return tiers.map(tier => ({
    min: tier.min_qty || tier.min || 0,
    max: tier.max_qty || tier.max || null,
    price: parseFloat(tier.price || '0')
  })).filter(tier => !isNaN(tier.price));
};
