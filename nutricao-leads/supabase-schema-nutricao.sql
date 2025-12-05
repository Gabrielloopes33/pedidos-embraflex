-- ==========================================
-- SCHEMA DO BANCO DE DADOS - NUTRIÇÃO DE LEADS
-- ==========================================
-- Criado em: 04/12/2025
-- Projeto: Sistema de Nutrição de Leads Perdidos
-- ==========================================

-- Tabela principal de leads em nutrição
CREATE TABLE IF NOT EXISTS leads_nutricao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados do Lead
  rd_lead_id VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(50),
  instagram VARCHAR(100),
  
  -- Segmentação
  nicho VARCHAR(100),
  faturamento VARCHAR(100),
  tempo_existencia VARCHAR(100),
  
  -- Tags e Status
  tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, pausado, convertido, perdido
  fase_atual VARCHAR(50) DEFAULT 'segmentacao', -- segmentacao, reativacao, lembretes, pos-live
  
  -- Engajamento
  nivel_engajamento VARCHAR(50), -- prego, taquinho, sauniu, ultimos_30d, ultimos_90d
  ultima_interacao TIMESTAMP,
  total_emails_enviados INTEGER DEFAULT 0,
  total_emails_abertos INTEGER DEFAULT 0,
  total_whatsapp_enviados INTEGER DEFAULT 0,
  total_cliques_link INTEGER DEFAULT 0,
  
  -- Motivo de não compra
  motivo_nao_compra TEXT,
  
  -- Datas de controle
  data_entrada_nutricao TIMESTAMP DEFAULT NOW(),
  data_ultimo_email TIMESTAMP,
  data_ultimo_whatsapp TIMESTAMP,
  data_live_agendada TIMESTAMP,
  compareceu_live BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  origem VARCHAR(255),
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico de ações
CREATE TABLE IF NOT EXISTS nutricao_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_nutricao(id) ON DELETE CASCADE,
  
  -- Tipo de ação
  tipo_acao VARCHAR(50) NOT NULL, -- email_enviado, whatsapp_enviado, email_aberto, link_clicado, tag_adicionada, etc.
  descricao TEXT,
  
  -- Dados da ação
  canal VARCHAR(50), -- email, whatsapp, sms
  conteudo_enviado TEXT,
  resultado VARCHAR(50), -- sucesso, erro, pendente
  erro_mensagem TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de campanhas de email
CREATE TABLE IF NOT EXISTS nutricao_campanhas_email (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados da campanha
  nome VARCHAR(255) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  template_html TEXT NOT NULL,
  template_texto TEXT,
  
  -- Segmentação
  segmento_nicho VARCHAR(100),
  segmento_faturamento VARCHAR(100),
  segmento_engajamento VARCHAR(50),
  
  -- Status
  ativa BOOLEAN DEFAULT TRUE,
  tipo VARCHAR(50), -- reativacao, lembrete, pos-live
  
  -- Métricas
  total_enviados INTEGER DEFAULT 0,
  total_abertos INTEGER DEFAULT 0,
  total_cliques INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de templates WhatsApp
CREATE TABLE IF NOT EXISTS nutricao_templates_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados do template
  nome VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Segmentação
  segmento_nicho VARCHAR(100),
  segmento_faturamento VARCHAR(100),
  tipo VARCHAR(50), -- reativacao, lembrete, pos-live
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Métricas
  total_enviados INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS nutricao_agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads_nutricao(id) ON DELETE CASCADE,
  
  -- Tipo de agendamento
  tipo VARCHAR(50) NOT NULL, -- email, whatsapp, lembrete
  
  -- Dados do agendamento
  data_agendada TIMESTAMP NOT NULL,
  campanha_id UUID,
  template_id UUID,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviado, erro, cancelado
  executado_em TIMESTAMP,
  erro_mensagem TEXT,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

CREATE INDEX idx_leads_nutricao_email ON leads_nutricao(email);
CREATE INDEX idx_leads_nutricao_rd_id ON leads_nutricao(rd_lead_id);
CREATE INDEX idx_leads_nutricao_status ON leads_nutricao(status);
CREATE INDEX idx_leads_nutricao_fase ON leads_nutricao(fase_atual);
CREATE INDEX idx_leads_nutricao_nicho ON leads_nutricao(nicho);
CREATE INDEX idx_leads_nutricao_faturamento ON leads_nutricao(faturamento);
CREATE INDEX idx_leads_nutricao_engajamento ON leads_nutricao(nivel_engajamento);

CREATE INDEX idx_historico_lead_id ON nutricao_historico(lead_id);
CREATE INDEX idx_historico_tipo ON nutricao_historico(tipo_acao);
CREATE INDEX idx_historico_data ON nutricao_historico(created_at);

CREATE INDEX idx_agendamentos_lead_id ON nutricao_agendamentos(lead_id);
CREATE INDEX idx_agendamentos_status ON nutricao_agendamentos(status);
CREATE INDEX idx_agendamentos_data ON nutricao_agendamentos(data_agendada);

-- ==========================================
-- FUNÇÕES ÚTEIS
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para leads_nutricao
CREATE TRIGGER update_leads_nutricao_updated_at BEFORE UPDATE ON leads_nutricao
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para campanhas
CREATE TRIGGER update_campanhas_email_updated_at BEFORE UPDATE ON nutricao_campanhas_email
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_whatsapp_updated_at BEFORE UPDATE ON nutricao_templates_whatsapp
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- VIEWS ÚTEIS
-- ==========================================

-- View de leads ativos por segmento
CREATE OR REPLACE VIEW v_leads_por_segmento AS
SELECT 
  nicho,
  faturamento,
  nivel_engajamento,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) as leads_ativos,
  AVG(total_emails_abertos::float / NULLIF(total_emails_enviados, 0)) * 100 as taxa_abertura_email,
  AVG(total_cliques_link::float / NULLIF(total_emails_enviados, 0)) * 100 as taxa_clique
FROM leads_nutricao
GROUP BY nicho, faturamento, nivel_engajamento;

-- View de performance de campanhas
CREATE OR REPLACE VIEW v_performance_campanhas AS
SELECT 
  c.nome,
  c.tipo,
  c.total_enviados,
  c.total_abertos,
  c.total_cliques,
  CASE 
    WHEN c.total_enviados > 0 THEN (c.total_abertos::float / c.total_enviados * 100)::numeric(5,2)
    ELSE 0
  END as taxa_abertura,
  CASE 
    WHEN c.total_enviados > 0 THEN (c.total_cliques::float / c.total_enviados * 100)::numeric(5,2)
    ELSE 0
  END as taxa_clique,
  c.created_at
FROM nutricao_campanhas_email c
ORDER BY c.created_at DESC;

-- ==========================================
-- DADOS INICIAIS (SEEDS)
-- ==========================================

-- Template de email de reativação padrão
INSERT INTO nutricao_campanhas_email (nome, assunto, template_html, tipo, ativa) VALUES
('Reativação - Dentista - Alta Engajamento', 
 'Olá [Nome], Evandro aqui! Temos algo especial para você 🎯',
 '<html><body><h1>Olá [Nome]!</h1><p>Aqui é o Gabriel da Codirect...</p></body></html>',
 'reativacao',
 true)
ON CONFLICT DO NOTHING;

-- Template de WhatsApp padrão
INSERT INTO nutricao_templates_whatsapp (nome, mensagem, tipo, ativo) VALUES
('Lembrete Live - 24h antes',
 'Olá [Nome]! 👋\n\nEstamos a 60 minutos da live sobre [Tema]! Pegue seu café e se prepare. O link é este: [Link]',
 'lembrete',
 true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON TABLE leads_nutricao IS 'Tabela principal de leads em processo de nutrição';
COMMENT ON TABLE nutricao_historico IS 'Registro de todas as ações realizadas com cada lead';
COMMENT ON TABLE nutricao_campanhas_email IS 'Campanhas de email para nutrição';
COMMENT ON TABLE nutricao_templates_whatsapp IS 'Templates de mensagens WhatsApp';
COMMENT ON TABLE nutricao_agendamentos IS 'Agendamentos futuros de envios';

COMMENT ON COLUMN leads_nutricao.nivel_engajamento IS 'Níveis: prego (sem engajamento), taquinho (baixo), sauniu (médio), ultimos_30d, ultimos_90d';
COMMENT ON COLUMN leads_nutricao.fase_atual IS 'Fase atual do lead no funil de nutrição';
COMMENT ON COLUMN leads_nutricao.status IS 'Status do lead: ativo, pausado, convertido, perdido';
