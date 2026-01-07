import type { ProductItem, Finishing } from '../types';
import { FINISHING_PRICES } from '../types';

/**
 * Calcula o custo total dos acabamentos de um produto
 */
export function calculateFinishingCosts(finishing: Finishing): number {
  let total = 0;

  // Hot Stamp - verifica a cor
  if (finishing.hotStamp) {
    if (finishing.hotStampCor === 'dourado' || finishing.hotStampCor === 'prata') {
      total += FINISHING_PRICES.hotStampDouradoPrata;
    } else if (finishing.hotStampCor === 'colorido') {
      total += FINISHING_PRICES.hotStampColorido;
    } else {
      // Fallback: se não especificou cor, usar dourado/prata
      total += FINISHING_PRICES.hotStampDouradoPrata;
    }
  }

  // Ilhós
  if (finishing.ilhos) {
    total += FINISHING_PRICES.ilhos;
  }

  // Furo de Presente
  if (finishing.furoPresente) {
    total += FINISHING_PRICES.furoPresente;
  }

  // Cordão
  if (finishing.cordao) {
    if (finishing.cordao === 'colorido') {
      // Cordão simples colorido
      total += FINISHING_PRICES.cordaoColorido;
    } else if (finishing.cordao === 'gorgurinho' || finishing.cordao === 'gorgurão' || finishing.cordao === 'são francisco') {
      // Cordões especiais (Gorgurinho, Gorgurão, São Francisco)
      if (finishing.corCordao === 'colorido') {
        total += FINISHING_PRICES.cordaoEspecialColorido;
      } else {
        // Preto ou Branco (ou não especificado)
        total += FINISHING_PRICES.cordaoEspecialPretoBranco;
      }
    }
    // Cordão padrão não tem custo adicional
  }

  return total;
}

/**
 * Calcula o valor total de um item (preço unitário + acabamentos) * quantidade, com desconto aplicado
 */
export function calculateItemTotal(product: ProductItem): number {
  const finishingCost = calculateFinishingCosts(product.finishing);
  const unitWithFinishing = product.unitPrice + finishingCost;
  const subtotal = unitWithFinishing * product.quantity;
  
  // Aplicar desconto se houver (máximo 11%)
  const discount = product.discountPercent ? Math.min(product.discountPercent, 11) : 0;
  const discountAmount = subtotal * (discount / 100);
  
  return subtotal - discountAmount;
}

/**
 * Calcula o total geral de todos os produtos do pedido
 */
export function calculateOrderTotal(products: ProductItem[]): number {
  return products.reduce((sum, product) => sum + calculateItemTotal(product), 0);
}
