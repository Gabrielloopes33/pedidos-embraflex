import type { ProductItem, Finishing } from '../types';
import { FINISHING_PRICES } from '../types';

/**
 * Calcula o custo total dos acabamentos de um produto
 */
export function calculateFinishingCosts(finishing: Finishing): number {
  let total = 0;

  // Acessórios
  if (finishing.hotStamp) {
    total += FINISHING_PRICES.hotStamp;
  }

  if (finishing.ilhos) {
    total += FINISHING_PRICES.ilhos;
  }

  if (finishing.furoPresente) {
    total += FINISHING_PRICES.furoPresente;
  }

  // Cordão
  if (finishing.cordao) {
    switch (finishing.cordao) {
      case 'padrão':
        total += FINISHING_PRICES.cordaoPadrao;
        break;
      case 'colorido':
        total += FINISHING_PRICES.cordaoColorido;
        break;
      case 'gorgurinho':
        total += FINISHING_PRICES.gorgurinho;
        break;
      case 'gorgurão':
        total += FINISHING_PRICES.gorgurao;
        break;
      case 'são francisco':
        total += FINISHING_PRICES.saoFrancisco;
        break;
    }
  }

  // Cor do cordão (apenas se for padrão, mas não tem custo adicional)
  // As cores preto, branco e bege não têm custo adicional

  return total;
}

/**
 * Calcula o valor total de um item (preço unitário + acabamentos) * quantidade
 */
export function calculateItemTotal(product: ProductItem): number {
  const finishingCost = calculateFinishingCosts(product.finishing);
  const unitWithFinishing = product.unitPrice + finishingCost;
  return unitWithFinishing * product.quantity;
}

/**
 * Calcula o total geral de todos os produtos do pedido
 */
export function calculateOrderTotal(products: ProductItem[]): number {
  return products.reduce((sum, product) => sum + calculateItemTotal(product), 0);
}
