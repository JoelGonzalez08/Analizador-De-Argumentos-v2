
'use client';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
  Home, 
  Mail, 
  ShieldCheck, 
  MessageSquare, 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/', label: 'Inicio', icon: Home, requireAuth: false },
    { href: '/history', label: 'Historial', icon: MessageSquare, requireAuth: true },
    { href: '/analyzer', label: 'Analizador', icon: ShieldCheck, requireAuth: true },
    { href: '/contact', label: 'Contacto', icon: Mail, requireAuth: false },
  ];

  const visibleItems = menuItems.filter(item => !item.requireAuth || user);

  return (
    <SidebarMenu>
      {visibleItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <a href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
