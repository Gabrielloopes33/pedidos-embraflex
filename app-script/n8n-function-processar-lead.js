// ==========================================
// N8N FUNCTION NODE - PROCESSAR LEAD RD STATION
// ==========================================
// Este código substitui o processarLead() do Google Apps Script
// Cole este código no Function Node do n8n
// ==========================================

const items = $input.all();
const processedItems = [];

for (const item of items) {
  try {
    const body = item.json.body;
    
    // Verifica se tem leads
    if (!body.leads || body.leads.length === 0) {
      console.log('⚠️ Nenhum lead no payload');
      continue;
    }
    
    const lead = body.leads[0];
    const lastConversion = lead.last_conversion || {};
    const conversionContent = lastConversion.content || {};
    const conversionOrigin = lastConversion.conversion_origin || {};
    const customFields = lead.custom_fields || {};
    
    // ==========================================
    // EXTRAÇÃO DE DATA E HORA (Horário de Brasília)
    // ==========================================
    const now = new Date();
    
    // Ajusta para timezone de São Paulo (UTC-3)
    const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    // Formata data como dd/MM/yyyy
    const dia = String(brTime.getDate()).padStart(2, '0');
    const mes = String(brTime.getMonth() + 1).padStart(2, '0');
    const ano = brTime.getFullYear();
    const dataConversao = `${dia}/${mes}/${ano}`;
    
    // Formata hora como HH:mm:ss
    const horas = String(brTime.getHours()).padStart(2, '0');
    const minutos = String(brTime.getMinutes()).padStart(2, '0');
    const segundos = String(brTime.getSeconds()).padStart(2, '0');
    const horaConversao = `${horas}:${minutos}:${segundos}`;
    
    // ==========================================
    // EXTRAÇÃO DE DADOS BÁSICOS
    // ==========================================
    const id = lead.id || '';
    const nome = lead.name || '';
    const email = lead.email || '';
    
    // Telefone - tenta múltiplas fontes na ordem de prioridade
    let telefone = lead.personal_phone || 
                   lead.mobile_phone || 
                   lead.phone || 
                   customFields.telefone || 
                   customFields.celular || 
                   conversionContent.Telefone || '';
    
    // Formata telefone para manter padrão "55 (11) 99999-9999"
    if (telefone) {
      // Remove o + inicial se houver
      telefone = telefone.replace(/^\+/, '');
      // Se vier sem o "55" no início, mantém como está
      // Se vier com "+55", já foi removido acima
    }
    
    // ==========================================
    // CAMPOS PERSONALIZADOS DO RD STATION
    // ==========================================
    
    // Instagram - tenta várias variações de nome de campo
    const instagram = customFields['Instagram da empresa'] || 
                     customFields['instagram'] ||
                     customFields['Instagram'] ||
                     customFields['instagram_empresa'] ||
                     lead.instagram || 
                     conversionContent['Instagram da empresa'] || 
                     '';
    
    // Faturamento - tenta várias variações
    const faturamento = customFields['Qual o faturamento mensal do seu negócio?'] ||
                       customFields['Qual é o faturamento mensal do seu negócio?'] ||
                       customFields['faturamento'] ||
                       customFields['Faturamento'] ||
                       conversionContent['Qual o faturamento mensal do seu negócio?'] ||
                       conversionContent['Qual é o faturamento mensal do seu negócio?'] || 
                       '';
    
    // Tempo de existência - valor padrão se não encontrado
    const tempoExistencia = customFields['Tempo de existência'] ||
                           customFields['tempo_existencia'] ||
                           customFields['Tempo existência'] ||
                           customFields['tempo de existência'] ||
                           customFields['tempo_de_existencia'] ||
                           'Tempo não disponível';
    
    // ==========================================
    // PÁGINA E DOMÍNIO
    // ==========================================
    const paginaCompleta = conversionContent.conversion_url || 
                          lastConversion.url || 
                          '';
    
    // Extrai apenas o identificador da página (path após o domínio)
    let pagina = '';
    if (paginaCompleta) {
      try {
        const url = new URL(paginaCompleta);
        // Remove a barra inicial e pega só o path
        pagina = url.pathname.replace(/^\//, '');
      } catch (e) {
        // Se não for URL válida, usa o valor completo
        pagina = paginaCompleta;
      }
    }
    
    // Domínio
    const dominio = conversionContent.conversion_domain || '';
    
    // ==========================================
    // PARÂMETROS UTM
    // ==========================================
    const utmSource = conversionOrigin.source || 'unknown';
    const utmMedium = conversionOrigin.medium || 'unknown';
    const utmCampaign = conversionOrigin.campaign || 'unknown';
    const utmContent = conversionOrigin.value || '';
    
    // ==========================================
    // LINK PÚBLICO DO RD STATION
    // ==========================================
    const linkRD = lead.public_url || 
                  (lead.uuid ? `http://app.rdstation.com.br/leads/public/${lead.uuid}` : '');
    
    // ==========================================
    // UTM GERAL (Traffic Source Encoded)
    // ==========================================
    const utmGeral = conversionContent.traffic_source || '';
    
    // ==========================================
    // JSON COMPLETO (limitado a 50000 caracteres)
    // ==========================================
    let jsonCompleto = JSON.stringify(body, null, 2);
    if (jsonCompleto.length > 50000) {
      jsonCompleto = jsonCompleto.substring(0, 50000) + '... (truncado)';
    }
    
    // ==========================================
    // UF (Estado)
    // ==========================================
    const uf = lead.state || 
               customFields.estado || 
               customFields.uf || 
               customFields.UF ||
               '';
    
    // ==========================================
    // SUB-ORIGEM
    // ==========================================
    const subOrigem = lastConversion.source_detail || '';
    
    // ==========================================
    // MONTA OBJETO COM DADOS NA ORDEM CORRETA
    // ==========================================
    // Esta é a ordem EXATA das colunas na planilha:
    // A: Data conver.
    // B: Hora conver.
    // C: Id
    // D: Nome
    // E: Email
    // F: Telefone
    // G: Instagram
    // H: Tempo existência
    // I: Faturamento
    // J: Domínio
    // K: Página
    // L: utm_source
    // M: utm_medium
    // N: utm_campaign
    // O: utm_content
    // P: Link RD
    // Q: UTM Geral
    // R: JSON
    // S: NICHOS
    // T: (extra1)
    // U: (extra2)
    // V: UF
    // W: Sub-origem
    // X: (vazio)
    
    const dadosLinha = {
      dataConversao,      // A - Data conver.
      horaConversao,      // B - Hora conver.
      id,                 // C - Id
      nome,               // D - Nome
      email,              // E - Email
      telefone,           // F - Telefone
      instagram,          // G - Instagram
      tempoExistencia,    // H - Tempo existência
      faturamento,        // I - Faturamento
      dominio,            // J - Domínio
      pagina,             // K - Página
      utmSource,          // L - utm_source
      utmMedium,          // M - utm_medium
      utmCampaign,        // N - utm_campaign
      utmContent,         // O - utm_content
      linkRD,             // P - Link RD
      utmGeral,           // Q - UTM Geral
      jsonCompleto,       // R - JSON
      nichos: '',         // S - NICHOS (vazio inicialmente)
      extra1: '',         // T - Coluna extra 1
      extra2: '',         // U - Coluna extra 2
      uf,                 // V - UF
      subOrigem,          // W - Sub-origem
      x: ''               // X - (vazio)
    };
    
    // Log para debug
    console.log('✅ Lead processado:', nome, '-', email);
    
    processedItems.push({
      json: dadosLinha
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar lead:', error.message);
    console.error('Stack:', error.stack);
    // Continua processamento mesmo com erro (não quebra o fluxo)
  }
}

// Retorna os itens processados
return processedItems;
