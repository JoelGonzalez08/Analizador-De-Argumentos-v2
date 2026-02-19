
'use client';
import { useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { href: '/', label: 'Inicio', icon: Home, requireAuth: false },
    { href: '/history', label: 'Historial', icon: MessageSquare, requireAuth: true },
    { href: '/analyzer', label: 'Analizador', icon: ShieldCheck, requireAuth: true },
    { href: '/contact', label: 'Contacto', icon: Mail, requireAuth: false },
  ];

  // Durante SSR y antes de montar, solo mostrar items públicos para evitar hidratación mismatch
  const visibleItems = !mounted 
    ? menuItems.filter(item => !item.requireAuth)
    : menuItems.filter(item => !item.requireAuth || user);

  return (
    <SidebarMenu suppressHydrationWarning>
      {visibleItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            isActive={mounted ? pathname === item.href : false}
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
