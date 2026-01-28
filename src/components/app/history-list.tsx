'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  MoreVertical, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Loader2,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  listConversations, 
  deleteConversation, 
  updateConversation, 
  createConversation,
  type Conversation 
} from '@/lib/api-client';

export function HistoryList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, [token]);

  const loadConversations = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await listConversations(token);
      setConversations(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las conversaciones',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!token) return;
    
    try {
      const newConv = await createConversation({ title: 'Nueva Conversación' }, token);
      router.push(`/analyzer?conversation=${newConv.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la conversación',
      });
    }
  };

  const handleRename = async (id: number) => {
    if (!token || !editTitle.trim()) return;
    
    try {
      await updateConversation(id, { title: editTitle.trim() }, token);
      setConversations(conversations.map(c => 
        c.id === id ? { ...c, title: editTitle.trim() } : c
      ));
      setEditingId(null);
      toast({
        title: 'Conversación renombrada',
        description: 'El título se actualizó correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo renombrar la conversación',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    
    try {
      await deleteConversation(id, token);
      setConversations(conversations.filter(c => c.id !== id));
      setDeleteId(null);
      toast({
        title: 'Conversación eliminada',
        description: 'La conversación se eliminó correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la conversación',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Si la diferencia es negativa o muy pequeña
    if (diffMs < 1000) return 'justo ahora';
    
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `Hace ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 p-4 md:p-6 space-y-6 overflow-y-auto h-[calc(100vh-60px)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Análisis</h1>
          <p className="text-muted-foreground">Aquí puedes encontrar tus conversaciones y análisis anteriores.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Análisis
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No hay conversaciones</h3>
            <p className="text-muted-foreground">Crea tu primera conversación para comenzar</p>
          </div>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Primera Conversación
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recientes ({conversations.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {conversations.map((convo) => (
              <Card key={convo.id} className="hover:border-primary transition-colors h-full flex flex-col group">
                <CardHeader className="flex-row items-start justify-between pb-2">
                  <Link href={`/analyzer?conversation=${convo.id}`} className="block p-2 bg-muted rounded-md flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 -mr-2 -mt-2" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => {
                        setEditingId(convo.id);
                        setEditTitle(convo.title);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Renombrar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteId(convo.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Borrar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                
                {editingId === convo.id ? (
                  <CardContent className="flex-1 flex flex-col gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(convo.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleRename(convo.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <Link href={`/analyzer?conversation=${convo.id}`} className="flex-1 flex flex-col">
                    <CardContent className="flex-1">
                      <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {convo.title}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(convo.updated_at)}
                      </p>
                    </CardFooter>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la conversación y todos sus análisis asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
