import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../supabase-client';

const router = express.Router();

// Estendendo a interface Request para incluir o usuário
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

const normalizeUsername = (value: string) => value.trim().toLowerCase();

/**
 * Middleware para verificar se é admin
 */
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: Function) => {
  console.log('🔐 [RequireAdmin] User:', req.user?.username, '| Role:', req.user?.role);
  if (!req.user || req.user.role !== 'admin') {
    console.log('❌ [RequireAdmin] Acesso negado para:', req.user?.username || 'usuário não identificado');
    return res.status(403).json({
      message: 'Acesso negado. Apenas administradores podem acessar esta rota.',
      code: 'NOT_ADMIN',
      userRole: req.user?.role || 'undefined'
    });
  }
  next();
};

/**
 * GET /api/users
 * Lista todos os usuários (admin only)
 * Query: ?role=admin|vendedor, ?isActive=true|false
 */
router.get('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, isActive } = req.query;

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Remover senha da resposta
    const users = data?.map((user: any) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Erro ao buscar usuários',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/stats
 * Obtém estatísticas dos usuários (admin only)
 */
router.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      throw error;
    }

    res.json(data?.[0] || {});
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      message: 'Erro ao buscar estatísticas de usuários',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id
 * Busca um usuário por ID (admin only)
 */
router.get('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      throw error;
    }

    // Remover senha da resposta
    const { password, ...userWithoutPassword } = data;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Erro ao buscar usuário',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/users
 * Cria um novo usuário (admin only)
 * Body: { username, password, email?, role, full_name? }
 */
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password, email, role, full_name } = req.body;
    const normalizedUsername = typeof username === 'string' ? normalizeUsername(username) : '';

    // Validações
    if (!normalizedUsername || !password || !role) {
      return res.status(400).json({
        message: 'Username, password e role são obrigatórios.',
      });
    }

    if (!['admin', 'vendedor'].includes(role)) {
      return res.status(400).json({
        message: 'Role deve ser "admin" ou "vendedor".',
      });
    }

    // Verificar se username já existe
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .limit(10);

    const hasUsernameConflict = (existingUsername || []).some(
      (user: any) => normalizeUsername(String(user.username || '')) === normalizedUsername
    );

    if (hasUsernameConflict) {
      return res.status(400).json({
        message: 'Username já está em uso.',
      });
    }

    // Verificar se email já existe (se fornecido)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return res.status(400).json({
          message: 'Email já está em uso.',
        });
      }
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Gerar ID único
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Creating user:', username, 'with role:', role);

    // Criar usuário
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: normalizedUsername,
        password: passwordHash,
        email: email || null,
        role,
        full_name: full_name || null,
        is_active: true,
        created_by: req.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    if (!data) {
      console.error('No data returned from insert');
      throw new Error('Falha ao criar usuário - nenhum dado retornado');
    }

    console.log('User created successfully:', data.id);

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = data;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      message: 'Erro ao criar usuário',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualiza um usuário (admin only)
 * Body: { username?, email?, role?, full_name?, is_active?, password? }
 */
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, role, full_name, is_active, password } = req.body;
    const normalizedUpdateUsername = typeof username === 'string' ? normalizeUsername(username) : undefined;

    // Verificar se usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Validações
    if (role && !['admin', 'vendedor'].includes(role)) {
      return res.status(400).json({
        message: 'Role deve ser "admin" ou "vendedor".',
      });
    }

    if (username !== undefined && !normalizedUpdateUsername) {
      return res.status(400).json({
        message: 'Username não pode estar vazio.',
      });
    }

    // Verificar se username já existe (se estiver sendo alterado)
    if (normalizedUpdateUsername && normalizedUpdateUsername !== normalizeUsername(String(existingUser.username || ''))) {
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', normalizedUpdateUsername)
        .limit(10);

      const hasUsernameConflict = (existingUsername || []).some(
        (user: any) => user.id !== id && normalizeUsername(String(user.username || '')) === normalizedUpdateUsername
      );

      if (hasUsernameConflict) {
        return res.status(400).json({
          message: 'Username já está em uso.',
        });
      }
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (email && email !== existingUser.email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return res.status(400).json({
          message: 'Email já está em uso.',
        });
      }
    }

    // Preparar dados de atualização
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (normalizedUpdateUsername) updates.username = normalizedUpdateUsername;
    if (email !== undefined) updates.email = email || null;
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name || null;
    if (is_active !== undefined) updates.is_active = is_active;

    // Hash da senha se fornecida
    if (password) {
      const saltRounds = 10;
      updates.password = await bcrypt.hash(password, saltRounds);
    }

    console.log('Updating user:', id, 'with data:', { ...updates, password: password ? '[REDACTED]' : undefined });

    // Atualizar usuário
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    if (!data) {
      console.error('No data returned from update');
      throw new Error('Falha ao atualizar usuário - nenhum dado retornado');
    }

    console.log('User updated successfully:', data.id);

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = data;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Erro ao atualizar usuário',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Deleta um usuário (admin only)
 * Nota: Não permite deletar o próprio usuário
 */
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário
    if (id === req.user?.id) {
      return res.status(400).json({
        message: 'Não é possível deletar o próprio usuário.',
      });
    }

    // Verificar se usuário existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Deletar usuário
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: 'Erro ao deletar usuário',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/:id/audit-logs
 * Busca logs de auditoria de um usuário (admin only)
 */
router.get('/:id/audit-logs', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('user_audit_logs')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      message: 'Erro ao buscar logs de auditoria',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/users/:id/change-password
 * Altera senha de um usuário (admin only)
 * Body: { newPassword }
 */
router.post('/:id/change-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  console.log('🔑 [Change Password] Iniciando alteração de senha...');
  console.log('🔑 [Change Password] User ID:', req.params.id);
  console.log('🔑 [Change Password] Request body:', { ...req.body, newPassword: req.body.newPassword ? '[REDACTED]' : undefined });
  
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      console.log('❌ [Change Password] Nova senha não fornecida');
      return res.status(400).json({
        message: 'Nova senha é obrigatória.',
      });
    }

    console.log('🔍 [Change Password] Verificando se usuário existe...');
    
    // Verificar se usuário existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('❌ [Change Password] Erro ao verificar usuário:', checkError);
      return res.status(500).json({ 
        message: 'Erro ao verificar usuário.',
        error: checkError.message,
        details: checkError
      });
    }

    if (!existingUser) {
      console.log('❌ [Change Password] Usuário não encontrado:', id);
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    console.log('✅ [Change Password] Usuário encontrado:', existingUser.username);

    // Hash da nova senha
    console.log('🔐 [Change Password] Gerando hash da senha...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ [Change Password] Hash gerado com sucesso');

    // Executar update
    console.log('💾 [Change Password] Atualizando senha no banco...');
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Change Password] Erro no update:', error);
      return res.status(500).json({
        message: 'Erro ao atualizar senha no banco de dados.',
        error: error.message,
        details: error,
        hint: 'Verifique se RLS está desabilitado e se a coluna "password" existe na tabela users.'
      });
    }

    if (!data) {
      console.error('❌ [Change Password] Nenhum dado retornado do update');
      return res.status(500).json({
        message: 'Nenhum dado retornado após atualização.',
        hint: 'Possível problema com RLS ou permissões.'
      });
    }

    console.log('✅ [Change Password] Senha atualizada com sucesso para:', data.username);
    res.json({ 
      message: 'Senha alterada com sucesso.',
      user: { id: data.id, username: data.username }
    });
  } catch (error) {
    console.error('❌ [Change Password] Erro geral:', error);
    res.status(500).json({
      message: 'Erro ao alterar senha',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;
