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
 * Calcula o valor total de um item (preço unitário + acabamentos) * quantidade, com desconto/acréscimo aplicado
 */
export function calculateItemTotal(product: ProductItem): number {
  const finishingCost = calculateFinishingCosts(product.finishing);
  const unitWithFinishing = product.unitPrice + finishingCost;
  const subtotal = unitWithFinishing * product.quantity;

  // Aplicar desconto/acréscimo se houver (valores negativos = desconto, positivos = acréscimo)
  const discount = product.discountPercent || 0;
  const discountAmount = subtotal * (discount / 100);

  return subtotal + discountAmount;
}

/**
 * Calcula o total geral de todos os produtos do pedido
 */
export function calculateOrderTotal(products: ProductItem[]): number {
  return products.reduce((sum, product) => sum + calculateItemTotal(product), 0);
}

/**
 * Retorna uma lista formatada com os detalhes e valores dos acabamentos selecionados
 */
export function getFinishingDetails(finishing: Finishing): { label: string; value: number }[] {
  const details: { label: string; value: number }[] = [];

  // Hot Stamp
  if (finishing.hotStamp) {
    let hotStampValue: number = FINISHING_PRICES.hotStampDouradoPrata;
    let hotStampLabel = 'Hot Stamp';

    if (finishing.hotStampCor === 'dourado') {
      hotStampLabel = 'Hot Stamp (Dourado)';
    } else if (finishing.hotStampCor === 'prata') {
      hotStampLabel = 'Hot Stamp (Prata)';
    } else if (finishing.hotStampCor === 'colorido') {
      hotStampLabel = 'Hot Stamp (Colorido)';
      hotStampValue = FINISHING_PRICES.hotStampColorido;
    }

    details.push({ label: hotStampLabel, value: hotStampValue });
  }

  // Ilhós
  if (finishing.ilhos) {
    details.push({ label: 'Ilhós', value: FINISHING_PRICES.ilhos });
  }

  // Furo de Presente
  if (finishing.furoPresente) {
    details.push({ label: 'Furo de Presente', value: FINISHING_PRICES.furoPresente });
  }

  // Cordão
  if (finishing.cordao) {
    let cordaoLabel = 'Cordão';
    let cordaoValue = 0;

    if (finishing.cordao === 'padrão') {
      cordaoLabel = `Cordão Padrão${finishing.corCordao ? ` (${finishing.corCordao})` : ''}`;
      cordaoValue = 0;
    } else if (finishing.cordao === 'colorido') {
      cordaoLabel = 'Cordão Colorido';
      cordaoValue = FINISHING_PRICES.cordaoColorido;
    } else if (finishing.cordao === 'gorgurinho' || finishing.cordao === 'gorgurão' || finishing.cordao === 'são francisco') {
      const cordaoName = finishing.cordao.charAt(0).toUpperCase() + finishing.cordao.slice(1);
      if (finishing.corCordao === 'colorido') {
        cordaoLabel = `Cordão ${cordaoName} (Colorido)`;
        cordaoValue = FINISHING_PRICES.cordaoEspecialColorido;
      } else {
        const cor = finishing.corCordao || 'padrão';
        cordaoLabel = `Cordão ${cordaoName} (${cor})`;
        cordaoValue = FINISHING_PRICES.cordaoEspecialPretoBranco;
      }
    }

    if (cordaoValue > 0) {
      details.push({ label: cordaoLabel, value: cordaoValue });
    } else {
      details.push({ label: cordaoLabel, value: 0 });
    }
  }

  return details;
}

/**
 * Retorna uma lista formatada com os detalhes e valores dos acabamentos, incluindo o valor total multiplicado pela quantidade
 */
export function getFinishingDetailsWithTotal(finishing: Finishing, quantity: number): { label: string; unitValue: number; total: number }[] {
  const details = getFinishingDetails(finishing);
  return details.map(d => ({
    label: d.label,
    unitValue: d.value,
    total: d.value * quantity
  }));
}
