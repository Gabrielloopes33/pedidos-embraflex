-- Migration: Add user management enhancements
-- Created: 2026-01-27
-- Description: Melhorias na tabela de usuários para gestão admin-only

-- Verificar se a tabela users já existe e adicionar colunas se necessário
-- Adicionar colunas individualmente para garantir que sejam criadas antes dos índices

-- Adicionar coluna email se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(255);
  END IF;
END $$;

-- Adicionar coluna full_name se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
  END IF;
END $$;

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Adicionar coluna last_login se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar coluna created_by se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE users ADD COLUMN created_by TEXT;
  END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Criar tabela de logs de auditoria para gestão de usuários
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by TEXT,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar tabela de sessões ativas (opcional, para gestão de sessões)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance - user_audit_logs
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_performed_by ON user_audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);

-- Índices para performance - user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário pode criar outros usuários (admin only) - usa apenas colunas existentes
CREATE OR REPLACE FUNCTION can_create_users(user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id_param
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de usuários - usa apenas colunas existentes
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  admin_count BIGINT,
  vendedor_count BIGINT,
  recent_logins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_users,
    COUNT(*)::BIGINT as active_users, -- será atualizado depois
    COUNT(*) FILTER (WHERE role = 'admin')::BIGINT as admin_count,
    COUNT(*) FILTER (WHERE role = 'vendedor')::BIGINT as vendedor_count,
    0::BIGINT as recent_logins -- será atualizado depois
  FROM users;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE user_audit_logs IS 'Logs de auditoria para todas as operações em usuários';
COMMENT ON TABLE user_sessions IS 'Sessões ativas de usuários para gestão de autenticação';

COMMENT ON COLUMN user_audit_logs.action IS 'Tipo de ação: created, updated, deleted, password_changed, role_changed';
COMMENT ON COLUMN user_audit_logs.changes IS 'Detalhes das alterações em formato JSON';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Remove sessões expiradas do banco';
COMMENT ON FUNCTION can_create_users IS 'Verifica se um usuário tem permissão para criar outros usuários (admin only)';
COMMENT ON FUNCTION get_user_stats IS 'Retorna estatísticas gerais dos usuários';

-- Criar função de auditoria vazia primeiro (será recriada no final)
CREATE OR REPLACE FUNCTION log_user_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Função será recriada no final com todas as colunas disponíveis
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger vazia primeiro
CREATE TRIGGER audit_users_changes
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_audit();

-- Criar comentários e índices para a tabela users (apenas colunas existentes)
COMMENT ON COLUMN users.username IS 'Nome de usuário único';
COMMENT ON COLUMN users.role IS 'Função do usuário: admin ou vendedor';

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Agora recriar a função de auditoria completa com todas as colunas disponíveis
CREATE OR REPLACE FUNCTION log_user_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de criação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
    VALUES (NEW.id, 'created', NEW.created_by, jsonb_build_object(
      'username', NEW.username,
      'role', NEW.role
    ));
    RETURN NEW;

  -- Log de atualização
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detectar mudanças
    DECLARE
      changes JSONB := '{}'::jsonb;
    BEGIN
      IF OLD.username IS DISTINCT FROM NEW.username THEN
        changes := changes || jsonb_build_object('username', jsonb_build_object('old', OLD.username, 'new', NEW.username));
      END IF;
      
      IF OLD.role IS DISTINCT FROM NEW.role THEN
        changes := changes || jsonb_build_object('role', jsonb_build_object('old', OLD.role, 'new', NEW.role));
        INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
        VALUES (NEW.id, 'role_changed', NEW.created_by, changes);
      END IF;
      
      IF OLD.password IS DISTINCT FROM NEW.password THEN
        INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
        VALUES (NEW.id, 'password_changed', NEW.created_by, jsonb_build_object('user_id', NEW.id));
      END IF;

      -- Log geral de atualização se houver mudanças
      IF jsonb_object_length(changes) > 0 THEN
        INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
        VALUES (NEW.id, 'updated', NEW.created_by, changes);
      END IF;
    END;
    RETURN NEW;

  -- Log de deleção
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
    VALUES (OLD.id, 'deleted', OLD.created_by, jsonb_build_object(
      'username', OLD.username,
      'role', OLD.role
    ));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Agora que todas as colunas existem, adicionar comentários e índices restantes
-- Comentários básicos apenas
COMMENT ON COLUMN users.created_by IS 'ID do usuário que criou este usuário (para auditoria)';
