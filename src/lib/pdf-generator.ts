import jsPDF from 'jspdf';

interface ProductItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  codigo: string;
  material: string;
  discriminacaoProduto: string;
  largura: string;
  altura: string;
  lateral: string;
  cores: string;
  laminadoBrilho: boolean;
  laminadoFosco: boolean;
  vernizIE: boolean;
  autoMatizada: boolean;
  furosPresente: 'sim' | 'nao' | '';
  refile: string;
  cordaoBranco: boolean;
  cordaoPreto: boolean;
  cordaoBege: boolean;
  cordao: string;
  gorgurinho35cm: boolean;
  gorgurao35cm: boolean;
  sFrancisco35cm: boolean;
  ilhos: boolean;
  hotStampSacola: boolean;
  hotStampEtiqueta: boolean;
  outros: string;
  observacoes: string;
  unitPrice: number;
}

export interface OrderData {
  nomeFantasia: string;
  razaoSocial: string;
  cpfCnpj: string;
  representante: string;
  produtos: ProductItem[];
  total: number;
}

export const generateOrderPDF = (orderData: OrderData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Função para adicionar nova página se necessário
  const checkNewPage = (requiredSpace: number = 15) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Função para formatar texto longo
  const addMultilineText = (text: string, x: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPosition);
    yPosition += lines.length * 5;
  };

  // Header da empresa
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 166); // Cor azul do tema
  doc.text('EMBRAFLEX', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  
  doc.setFontSize(14);
  doc.text('SISTEMA DE PEDIDOS DIGITAL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  // Título do pedido
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('PROPOSTA COMERCIAL - PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Data de geração
  const now = new Date();
  doc.setFontSize(10);
  doc.text(`Data: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 15;

  // Informações do cliente
  doc.setFontSize(14);
  doc.setTextColor(40, 116, 166);
  doc.text('DADOS DO CLIENTE', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nome Fantasia: ${orderData.nomeFantasia}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Razão Social: ${orderData.razaoSocial}`, 20, yPosition);
  yPosition += 6;
  
  if (orderData.cpfCnpj) {
    doc.text(`CPF/CNPJ: ${orderData.cpfCnpj}`, 20, yPosition);
    yPosition += 6;
  }
  
  if (orderData.representante) {
    doc.text(`Representante: ${orderData.representante}`, 20, yPosition);
    yPosition += 6;
  }
  
  yPosition += 5;

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  // Produtos
  doc.setFontSize(14);
  doc.setTextColor(40, 116, 166);
  doc.text('PRODUTOS DO PEDIDO', 20, yPosition);
  yPosition += 10;

  orderData.produtos.forEach((produto, index) => {
    checkNewPage(50); // Verifica se precisa de nova página

    // Cabeçalho do produto
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${produto.productName || 'Produto não especificado'}`, 20, yPosition);
    yPosition += 8;

    // Informações básicas
    doc.setFontSize(10);
    if (produto.codigo) {
      doc.text(`Código: ${produto.codigo}`, 25, yPosition);
      yPosition += 5;
    }
    
    doc.text(`Quantidade: ${produto.quantity}`, 25, yPosition);
    doc.text(`Valor Unit.: R$ ${produto.unitPrice.toFixed(2).replace('.', ',')}`, 100, yPosition);
    doc.text(`Subtotal: R$ ${(produto.quantity * produto.unitPrice).toFixed(2).replace('.', ',')}`, 160, yPosition);
    yPosition += 7;

    // Material e discriminação
    if (produto.material) {
      doc.text(`Material: ${produto.material}`, 25, yPosition);
      yPosition += 5;
    }
    
    if (produto.discriminacaoProduto) {
      addMultilineText(`Discriminação: ${produto.discriminacaoProduto}`, 25, 150);
      yPosition += 2;
    }

    // Dimensões
    if (produto.largura || produto.altura || produto.lateral || produto.cores) {
      const dimensoes = [];
      if (produto.largura) dimensoes.push(`Largura: ${produto.largura}`);
      if (produto.altura) dimensoes.push(`Altura: ${produto.altura}`);
      if (produto.lateral) dimensoes.push(`Lateral: ${produto.lateral}`);
      if (produto.cores) dimensoes.push(`Cores: ${produto.cores}`);
      
      doc.text(`Dimensões: ${dimensoes.join(' | ')}`, 25, yPosition);
      yPosition += 5;
    }

    // Acabamentos
    const acabamentos = [];
    if (produto.laminadoBrilho) acabamentos.push('Laminado Brilho');
    if (produto.laminadoFosco) acabamentos.push('Laminado Fosco');
    if (produto.vernizIE) acabamentos.push('Verniz I.E.');
    if (produto.autoMatizada) acabamentos.push('Auto-Matizada');
    
    if (acabamentos.length > 0) {
      doc.text(`Acabamentos: ${acabamentos.join(', ')}`, 25, yPosition);
      yPosition += 5;
    }

    // Furos
    if (produto.furosPresente) {
      doc.text(`Furos p/ Presente: ${produto.furosPresente === 'sim' ? 'Sim' : 'Não'}`, 25, yPosition);
      yPosition += 5;
    }

    // Refile
    if (produto.refile) {
      doc.text(`Refile: ${produto.refile}`, 25, yPosition);
      yPosition += 5;
    }

    // Acabamentos especiais
    const acabamentosEspeciais = [];
    if (produto.cordaoBranco) acabamentosEspeciais.push('Cordão Branco');
    if (produto.cordaoPreto) acabamentosEspeciais.push('Cordão Preto');
    if (produto.cordaoBege) acabamentosEspeciais.push('Cordão Bege');
    if (produto.cordao) acabamentosEspeciais.push(`Cordão: ${produto.cordao}`);
    if (produto.gorgurinho35cm) acabamentosEspeciais.push('Gorgurinho 35cm');
    if (produto.gorgurao35cm) acabamentosEspeciais.push('Gorgurão 35cm');
    if (produto.sFrancisco35cm) acabamentosEspeciais.push('S. Francisco 35cm');
    if (produto.ilhos) acabamentosEspeciais.push('Ilhós');
    if (produto.hotStampSacola) acabamentosEspeciais.push('Hot Stamp (Sacola)');
    if (produto.hotStampEtiqueta) acabamentosEspeciais.push('Hot Stamp (Etiqueta)');
    if (produto.outros) acabamentosEspeciais.push(`Outros: ${produto.outros}`);

    if (acabamentosEspeciais.length > 0) {
      addMultilineText(`Acabamentos Especiais: ${acabamentosEspeciais.join(', ')}`, 25, 150);
      yPosition += 2;
    }

    // Observações
    if (produto.observacoes) {
      addMultilineText(`Observações: ${produto.observacoes}`, 25, 150);
      yPosition += 2;
    }

    // Linha separadora entre produtos
    yPosition += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(25, yPosition, pageWidth - 25, yPosition);
    yPosition += 10;
  });

  // Total geral
  checkNewPage(25);
  yPosition += 5;
  doc.setDrawColor(40, 116, 166);
  doc.setLineWidth(1);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  doc.setFontSize(16);
  doc.setTextColor(40, 116, 166);
  doc.text(`TOTAL GERAL: R$ ${orderData.total.toFixed(2).replace('.', ',')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Rodapé
  checkNewPage(30);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Esta proposta é válida por 30 dias a partir da data de emissão.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Para aprovação, responda este e-mail ou entre em contato conosco.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Linha final
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  return doc;
};

export const downloadOrderPDF = (orderData: OrderData, filename?: string) => {
  const doc = generateOrderPDF(orderData);
  const defaultFilename = `Pedido_${orderData.nomeFantasia.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
  doc.save(filename || defaultFilename);
};