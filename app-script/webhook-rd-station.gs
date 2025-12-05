/**
 * Webhook para receber conversões do RD Station
 * Este código processa os dados de conversão e insere na planilha
 */

function doPost(e) {
  try {
    console.log('🎯 WEBHOOK RECEBIDO DO RD STATION');
    
    // Sempre retorna 200 OK para o RD Station
    var response = ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    
    // Verifica se é uma requisição vazia (validação do RD Station)
    if (!e || !e.postData || !e.postData.contents) {
      console.log('⚠️ Requisição de validação do webhook');
      return response;
    }
    
    console.log('Dados recebidos:', e.postData.contents);
    
    // Parse dos dados recebidos
    var dados = JSON.parse(e.postData.contents);
    
    // Verifica se tem leads no payload
    if (!dados.leads || dados.leads.length === 0) {
      console.log('⚠️ Nenhum lead no payload');
      return response;
    }
    
    var lead = dados.leads[0];
    
    // Log do recebimento
    logRecebimento(lead.email);
    
    // Processa e insere o lead na planilha
    var resultado = processarLead(lead, dados);
    
    console.log('✅ Processamento concluído:', JSON.stringify(resultado));
    
    return response;
      
  } catch (error) {
    console.log('❌ Erro ao processar webhook:', error.toString());
    console.log('Stack:', error.stack);
    
    // Retorna OK mesmo com erro para não bloquear o RD Station
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Método GET para teste (opcional)
 */
function doGet(e) {
  return ContentService.createTextOutput('Webhook ativo e funcionando!');
}

/**
 * Processa o lead recebido do RD Station
 */
function processarLead(lead, dadosCompletos) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CAV'); // Ajuste o nome da aba conforme necessário
  
  // Verifica se o lead já existe (evita duplicação)
  if (leadJaExiste(sheet, lead.email)) {
    console.log('⚠️ Lead já existe:', lead.email);
    return { duplicado: true, email: lead.email };
  }
  
  // Extrai dados do lead
  var dataConversao = new Date();
  var horaConversao = Utilities.formatDate(dataConversao, 'America/Sao_Paulo', 'HH:mm:ss');
  dataConversao = Utilities.formatDate(dataConversao, 'America/Sao_Paulo', 'dd/MM/yyyy');
  
  // Dados básicos
  var id = lead.id || '';
  var nome = lead.name || '';
  var email = lead.email || '';
  var telefone = extrairTelefone(lead);
  
  // Campos personalizados do RD
  var campos = lead.custom_fields || {};
  
  // Instagram - tenta várias possibilidades
  var instagram = campos['Instagram da empresa'] || 
                  campos['instagram'] ||
                  campos['Instagram'] ||
                  lead.instagram || '';
  
  // Faturamento - tenta várias possibilidades
  var faturamento = campos['Qual é o faturamento mensal do seu negócio?'] || 
                    campos['faturamento'] ||
                    campos['Faturamento'] ||
                    campos['qual_e_o_faturamento_mensal_do_seu_negocio'] || '';
  
  // Tempo de existência - tenta várias possibilidades  
  var tempoExistencia = campos['Tempo de existência'] ||
                        campos['tempo_existencia'] ||
                        campos['Tempo existência'] ||
                        campos['tempo de existência'] || '';
  
  // UTM parameters
  var lastConversion = lead.last_conversion || lead.conversion || {};
  var utmSource = lastConversion.source || '';
  var utmMedium = lastConversion.medium || '';
  var utmCampaign = lastConversion.campaign || '';
  var utmContent = lastConversion.content || '';
  
  // Páginas e domínio
  var conversaoOrigem = lastConversion.conversion_origin || {};
  var pagina = conversaoOrigem.url || lastConversion.url || '';
  var dominio = extrairDominio(pagina);
  
  // Link do RD Station
  var linkRD = id ? 'https://app.rdstation.com.br/leads/' + id : '';
  
  // UTM Geral (concatenação)
  var utmGeral = montarUtmGeral(utmSource, utmMedium, utmCampaign, utmContent);
  
  // JSON completo para referência (limitado a 50000 caracteres)
  var jsonCompleto = JSON.stringify(dadosCompletos);
  if (jsonCompleto.length > 50000) {
    jsonCompleto = jsonCompleto.substring(0, 50000) + '... (truncado)';
  }
  
  // UF (estado) - extraído do telefone ou endereço se disponível
  var uf = extrairUF(lead);
  
  // Sub-origem
  var subOrigem = lastConversion.source_detail || '';
  
  // Monta a linha de dados
  var novaLinha = [
    dataConversao,      // Data conver.
    horaConversao,      // Hora conver.
    id,                 // Id
    nome,               // Nome
    email,              // Email
    telefone,           // Telefone
    instagram,          // Instagram
    tempoExistencia,    // Tempo existência
    faturamento,        // Faturamento
    dominio,            // Domínio
    pagina,             // Página
    utmSource,          // utm_source
    utmMedium,          // utm_medium
    utmCampaign,        // utm_campaign
    utmContent,         // utm_content
    linkRD,             // Link RD
    utmGeral,           // UTM Geral
    jsonCompleto,       // JSON
    '',                 // NICHOS (vazio inicialmente)
    '',                 // Coluna extra 1
    '',                 // Coluna extra 2
    uf,                 // UF
    subOrigem,          // Sub-origem
    ''                  // X (última coluna)
  ];
  
  // Insere na planilha
  sheet.appendRow(novaLinha);
  
  console.log('✅ Lead inserido com sucesso:', nome, '-', email);
  
  return {
    duplicado: false,
    nome: nome,
    email: email,
    id: id
  };
}

/**
 * Verifica se o lead já existe na planilha (por email)
 */
function leadJaExiste(sheet, email) {
  if (!email) return false;
  
  var dados = sheet.getDataRange().getValues();
  var colunaEmail = 4; // Coluna E (índice 4, começando do 0)
  
  for (var i = 1; i < dados.length; i++) { // Começa em 1 para pular o cabeçalho
    if (dados[i][colunaEmail] && dados[i][colunaEmail].toString().toLowerCase() === email.toLowerCase()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extrai telefone do lead
 */
function extrairTelefone(lead) {
  if (lead.mobile_phone) return lead.mobile_phone;
  if (lead.personal_phone) return lead.personal_phone;
  if (lead.phone) return lead.phone;
  
  // Procura em campos personalizados
  var campos = lead.custom_fields || {};
  if (campos.telefone) return campos.telefone;
  if (campos.celular) return campos.celular;
  
  return '';
}

/**
 * Extrai domínio de uma URL
 */
function extrairDominio(url) {
  if (!url) return '';
  
  try {
    var match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Monta UTM Geral concatenando os parâmetros
 */
function montarUtmGeral(source, medium, campaign, content) {
  var partes = [];
  
  if (source) partes.push('source=' + source);
  if (medium) partes.push('medium=' + medium);
  if (campaign) partes.push('campaign=' + campaign);
  if (content) partes.push('content=' + content);
  
  return partes.length > 0 ? partes.join('|') : '';
}

/**
 * Extrai UF do lead (estado)
 */
function extrairUF(lead) {
  // Tenta extrair do estado do endereço
  if (lead.state) return lead.state;
  
  // Tenta extrair de campos personalizados
  var campos = lead.custom_fields || {};
  if (campos.estado) return campos.estado;
  if (campos.uf) return campos.uf;
  
  return '';
}

/**
 * Registra o recebimento no log
 */
function logRecebimento(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('Log');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('Log');
      logSheet.appendRow(['Data/Hora', 'Evento', 'Email']);
    }
    
    var agora = new Date();
    logSheet.appendRow([agora, 'Webhook recebido', email || 'N/A']);
  } catch (e) {
    console.log('Erro ao registrar log:', e);
  }
}

/**
 * Função de teste - simula recebimento de webhook
 */
function testarWebhook() {
  var dadosTeste = {
    leads: [{
      id: 'TEST123',
      name: 'João Silva Teste',
      email: 'joao.teste@email.com',
      mobile_phone: '11999887766',
      custom_fields: {
        'Instagram da empresa': '@empresateste',
        'Qual é o faturamento mensal do seu negócio?': '30 mil a 50 mil',
        'Tempo de existência': '1-2 anos'
      },
      last_conversion: {
        source: 'google',
        medium: 'cpc',
        campaign: 'teste_campaign',
        content: 'teste_content',
        conversion_origin: {
          url: 'https://www.seusite.com.br/landing-page'
        }
      }
    }]
  };
  
  var e = {
    postData: {
      contents: JSON.stringify(dadosTeste)
    }
  };
  
  var resultado = doPost(e);
  console.log('Resultado do teste:', resultado.getContent());
}

/**
 * Função para ver os nomes reais dos campos personalizados
 * Execute esta função para debugar
 */
function verUltimoWebhookRecebido() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CAV');
  
  // Pega a última linha com dados
  var ultimaLinha = sheet.getLastRow();
  
  if (ultimaLinha < 2) {
    Logger.log('Nenhum dado na planilha ainda');
    return;
  }
  
  // Pega o JSON da última linha (coluna R - índice 18)
  var json = sheet.getRange(ultimaLinha, 18).getValue();
  
  if (!json) {
    Logger.log('Sem JSON na última linha');
    return;
  }
  
  try {
    var dados = JSON.parse(json);
    Logger.log('=== ESTRUTURA DO WEBHOOK RD STATION ===');
    Logger.log(JSON.stringify(dados, null, 2));
    
    if (dados.leads && dados.leads[0]) {
      var lead = dados.leads[0];
      Logger.log('\n=== CAMPOS PERSONALIZADOS DISPONÍVEIS ===');
      Logger.log(JSON.stringify(lead.custom_fields, null, 2));
    }
  } catch (e) {
    Logger.log('Erro ao parsear JSON:', e);
  }
}
