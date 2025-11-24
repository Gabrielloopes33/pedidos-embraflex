import type { ProductItem, Finishing } from '../types';
import { FINISHING_PRICES } from '../types';

/**
 * Calcula o custo total dos acabamentos de um produto
 */
export function calculateFinishingCosts(finishing: Finishing): number {
  let total = 0;

  if (finishing.cordaoColorido) {
    total += FINISHING_PRICES.cordaoColorido;
  }

  if (finishing.gorgurinho) {
    total += FINISHING_PRICES.gorgurinho;
  }

  if (finishing.gorgurao) {
    total += FINISHING_PRICES.gorgurao;
  }

  if (finishing.ilhos) {
    total += FINISHING_PRICES.ilhos;
  }

  if (finishing.hotStamp) {
    total += FINISHING_PRICES.hotStamp;
  }

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
