// BottomNav - Navegação inferior mobile-first
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, ShoppingCart, Users, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/auth';

interface NavItem {
  title: string;
  icon: typeof FileText;
  path: string;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  {
    title: 'Nova Cotação',
    icon: FileText,
    path: '/cotacoes/nova',
  },
  {
    title: 'Pedidos',
    icon: ShoppingCart,
    path: '/orders',
  },
  {
    title: 'Clientes',
    icon: Users,
    path: '/customers',
  },
  {
    title: 'Vendedores',
    icon: UserCog,
    path: '/users',
    adminOnly: true,
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();

  // Filtrar itens baseado no perfil do usuário
  const navItems = baseNavItems.filter(item => !item.adminOnly || userIsAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-all touch-manipulation',
                'active:scale-95 active:bg-primary/10',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px]">{item.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
