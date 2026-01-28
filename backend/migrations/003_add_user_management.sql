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

-- Trigger para atualizar updated_at (apenas se a coluna existir)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Função para registrar log de auditoria
CREATE OR REPLACE FUNCTION log_user_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de criação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_audit_logs (user_id, action, performed_by, changes)
    VALUES (NEW.id, 'created', NEW.created_by, jsonb_build_object(
      'username', NEW.username,
      'email', COALESCE(NEW.email, NULL),
      'role', NEW.role,
      'full_name', COALESCE(NEW.full_name, NULL)
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
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        IF COALESCE(OLD.email, '') IS DISTINCT FROM COALESCE(NEW.email, '') THEN
          changes := changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
        END IF;
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
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        IF COALESCE(OLD.full_name, '') IS DISTINCT FROM COALESCE(NEW.full_name, '') THEN
          changes := changes || jsonb_build_object('full_name', jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name));
        END IF;
      END IF;
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        IF COALESCE(OLD.is_active, true) IS DISTINCT FROM COALESCE(NEW.is_active, true) THEN
          changes := changes || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active));
        END IF;
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
      'email', COALESCE(OLD.email, NULL),
      'role', OLD.role
    ));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria de usuários
DROP TRIGGER IF EXISTS audit_users_changes ON users;
CREATE TRIGGER audit_users_changes
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_audit();

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

-- Função para verificar se usuário pode criar outros usuários (admin only)
CREATE OR REPLACE FUNCTION can_create_users(user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id_param
    AND role = 'admin'
    AND (is_active = true OR is_active IS NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de usuários
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
    COUNT(*) FILTER (WHERE is_active = true OR is_active IS NULL)::BIGINT as active_users,
    COUNT(*) FILTER (WHERE role = 'admin')::BIGINT as admin_count,
    COUNT(*) FILTER (WHERE role = 'vendedor')::BIGINT as vendedor_count,
    COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days')::BIGINT as recent_logins
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

-- Criar comentários e índices para a tabela users (no final para garantir que as colunas existam)
COMMENT ON COLUMN users.email IS 'Email do usuário (opcional, único)';
COMMENT ON COLUMN users.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.is_active IS 'Indica se o usuário está ativo';
COMMENT ON COLUMN users.last_login IS 'Data do último login do usuário';
COMMENT ON COLUMN users.created_by IS 'ID do usuário que criou este usuário (para auditoria)';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
