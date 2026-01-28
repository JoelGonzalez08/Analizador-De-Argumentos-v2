'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Sparkles,
  Lock,
  CheckCircle,
  Clock,
  Lightbulb,
  Pencil,
  Save,
  FolderOpen,
  History,
  X,
  FileText,
} from 'lucide-react';
import { TiptapEditor } from './tiptap-editor';
import type { Editor } from '@tiptap/react';
import { 
  getConversation, 
  updateConversation, 
  createConversation,
  getConversationAnalyses,
  type Conversation 
} from '@/lib/api-client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ArgumentComponent {
  type: 'premise' | 'conclusion';
  text: string;
  tokens: string[];
  start_pos: number;
  end_pos: number;
}

interface ArgumentSuggestion {
  component_type: 'premise' | 'conclusion';
  original_text: string;
  suggestion: string;
  explanation: string;
  applied: boolean;
}

interface AnalysisResult {
  premises: ArgumentComponent[];
  conclusions: ArgumentComponent[];
  suggestions: ArgumentSuggestion[];
  total_premises: number;
  total_conclusions: number;
  analyzed_at: string;
}

export function ArgumentAnalyzer() {
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('conversation');
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationAnalyses, setConversationAnalyses] = useState<any[]>([]);
  
  const [text, setText] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const { toast } = useToast();
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const plainText = text.replace(/<[^>]+>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [text]);

  useEffect(() => {
    if (conversationId && token) {
      loadConversation(parseInt(conversationId));
    }
  }, [conversationId, token]);

  useEffect(() => {
    // Reload analyses when history sheet is opened
    if (isHistoryOpen && conversation && token) {
      getConversationAnalyses(conversation.id, token)
        .then(setConversationAnalyses)
        .catch(() => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudieron cargar los análisis',
          });
        });
    }
  }, [isHistoryOpen, conversation, token]);

  const loadConversation = async (id: number) => {
    if (!token) return;
    
    setIsLoadingConversation(true);
    try {
      const data = await getConversation(id, token);
      setConversation(data);
      setEditTitle(data.title);
      
      // Load analyses for the conversation
      const analyses = await getConversationAnalyses(id, token);
      setConversationAnalyses(analyses);
      
      // Cargar el último mensaje de la conversación si existe
      if (data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage.role === 'user') {
          // Set text in editor
          const content = `<p>${lastMessage.content}</p>`;
          setText(content);
          
          // Wait for editor to be ready and set content
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.commands.setContent(content);
            }
          }, 100);
        }
        
        // Cargar el último análisis si existe
        if (analyses.length > 0) {
          const lastAnalysis = analyses[0]; // El endpoint devuelve ordenado por fecha desc
          
          // Construir el resultado del análisis
          const result: AnalysisResult = {
            premises: lastAnalysis.components?.filter((c: any) => {
              const type = c.component_type?.toUpperCase?.() || c.component_type;
              return type === 'PREMISE';
            }).map((c: any) => ({
              type: 'premise' as const,
              text: c.text,
              tokens: c.tokens || [],
              start_pos: c.start_pos,
              end_pos: c.end_pos
            })) || [],
            conclusions: lastAnalysis.components?.filter((c: any) => {
              const type = c.component_type?.toUpperCase?.() || c.component_type;
              return type === 'CONCLUSION';
            }).map((c: any) => ({
              type: 'conclusion' as const,
              text: c.text,
              tokens: c.tokens || [],
              start_pos: c.start_pos,
              end_pos: c.end_pos
            })) || [],
            suggestions: (lastAnalysis.suggestions || lastAnalysis.llm_communications)?.map((s: any) => {
              const type = s.component_type?.toLowerCase();
              return {
                component_type: (type === 'premise' || type === 'conclusion' ? type : 'premise') as 'premise' | 'conclusion',
                original_text: s.original_text || '',
                suggestion: s.suggestion_text || '',
                explanation: s.explanation || '',
                applied: s.applied || false
              };
            }) || [],
            total_premises: lastAnalysis.total_premises,
            total_conclusions: lastAnalysis.total_conclusions,
            analyzed_at: lastAnalysis.analyzed_at
          };
          
          setAnalysisResult(result);
          // Usar analyzed_at si existe, sino usar created_at
          const dateString = lastAnalysis.analyzed_at || lastAnalysis.created_at;
          const analyzedDate = new Date(dateString);
          setLastAnalyzed(analyzedDate);
          
          // Aplicar resaltado después de cargar el análisis
          setTimeout(() => {
            if (editorRef.current) {
              applyHighlights(editorRef.current, result);
            }
          }, 300);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la conversación',
      });
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!token || !conversation || !editTitle.trim()) return;
    
    try {
      await updateConversation(conversation.id, { title: editTitle.trim() }, token);
      setConversation({ ...conversation, title: editTitle.trim() });
      setIsEditingTitle(false);
      toast({
        title: 'Título actualizado',
        description: 'El título de la conversación se guardó correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el título',
      });
    }
  };

  const handleSaveConversation = async () => {
    if (!token) return;
    
    setIsSaving(true);
    try {
      if (conversation) {
        // Ya hay conversación, solo mostrar confirmación
        toast({
          title: 'Conversación activa',
          description: 'Los análisis se guardan automáticamente en esta conversación',
        });
      } else {
        // Crear nueva conversación solo si no existe
        const newConv = await createConversation({ title: 'Nueva Conversación' }, token);
        setConversation(newConv);
        setEditTitle(newConv.title);
        router.push(`/analyzer?conversation=${newConv.id}`);
        toast({
          title: 'Conversación creada',
          description: 'Los análisis se guardarán en esta conversación',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la conversación',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTimeSinceAnalysis = () => {
    if (!lastAnalyzed) return '';
    
    const now = new Date();
    const analyzed = lastAnalyzed;
    
    // Validar que la fecha sea válida
    if (isNaN(analyzed.getTime())) return '';
    
    const diffMs = now.getTime() - analyzed.getTime();
    
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
    
    return analyzed.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: analyzed.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleAnalyze = async () => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Autenticación requerida',
        description: 'Debes iniciar sesión para analizar textos',
      });
      router.push('/login');
      return;
    }

    // Si no hay conversación, crear una primero
    let currentConversation = conversation;
    if (!currentConversation) {
      try {
        const newConv = await createConversation({ title: 'Nueva Conversación' }, token);
        setConversation(newConv);
        setEditTitle(newConv.title);
        currentConversation = newConv;
        router.push(`/analyzer?conversation=${newConv.id}`, { shallow: true });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo crear la conversación',
        });
        return;
      }
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const plainText = text.replace(/<[^>]+>/g, ' ').trim();
      
      const response = await fetch(`${API_BASE_URL}/api/arguments/complete-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text: plainText,
          conversation_id: currentConversation.id
        }),
      });

      if (response.status === 401) {
        toast({
          variant: 'destructive',
          title: 'Sesión expirada',
          description: 'Por favor inicia sesión nuevamente',
        });
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al analizar el texto');
      }

      const data = await response.json();
      setAnalysisResult(data);
      setLastAnalyzed(new Date());
      
      // Aplicar resaltado después de análisis
      if (editorRef.current) {
        applyHighlights(editorRef.current, data);
      }
      
      toast({
        title: '✅ Análisis completado',
        description: `${data.total_premises} premisas y ${data.total_conclusions} conclusiones identificadas`,
      });
      
      // Reload conversation to get updated messages and analyses
      if (currentConversation) {
        const updatedConversation = await getConversation(currentConversation.id, token);
        setConversation(updatedConversation);
        
        const updatedAnalyses = await getConversationAnalyses(currentConversation.id, token);
        setConversationAnalyses(updatedAnalyses);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Análisis',
        description: error.message || 'No se pudo analizar el texto',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const applyHighlights = (editor: Editor, data: AnalysisResult) => {
    // Primero remover todas las marcas de highlight existentes
    editor.commands.unsetMark('highlight');
    
    // Función auxiliar para encontrar y marcar texto
    const markText = (text: string, color: string) => {
      const content = editor.getText();
      let startIndex = 0;
      
      while ((startIndex = content.indexOf(text, startIndex)) !== -1) {
        const from = startIndex + 1; // +1 porque ProseMirror usa posiciones base 1
        const to = from + text.length;
        
        try {
          editor.chain()
            .setTextSelection({ from, to })
            .setHighlight({ color })
            .run();
          
          // Solo marcar la primera ocurrencia y salir
          break;
        } catch (e) {
          // Si falla, intentar siguiente ocurrencia
          startIndex++;
          continue;
        }
      }
    };
    
    // Aplicar marcas a premisas (azul - #3b82f6)
    data.premises.forEach(premise => {
      markText(premise.text, '#3b82f6');
    });
    
    // Aplicar marcas a conclusiones (naranja - #f97316)
    data.conclusions.forEach(conclusion => {
      markText(conclusion.text, '#f97316');
    });
    
    // Deseleccionar para ver los highlights
    editor.commands.setTextSelection(0);
    editor.commands.blur();
  };
  
  const highlightComponent = (index: number) => {
    if (!editorRef.current || !analysisResult) return;
    
    const suggestion = analysisResult.suggestions[index];
    const components = suggestion.component_type === 'premise' 
      ? analysisResult.premises 
      : analysisResult.conclusions;
    
    const component = components.find(c => c.text === suggestion.original_text);
    if (!component) return;
    
    const plainText = editorRef.current.getText();
    const start = plainText.indexOf(component.text);
    
    if (start !== -1) {
      const end = start + component.text.length;
      editorRef.current.chain()
        .focus()
        .setTextSelection({ from: start + 1, to: end + 1 })
        .run();
      
      // Scroll al componente
      const element = document.querySelector('.ProseMirror');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  const handleClear = () => {
    setText('');
    setAnalysisResult(null);
    setLastAnalyzed(null);
    setSelectedSuggestionIndex(null);
    if (editorRef.current) {
      editorRef.current.chain().clearContent().unsetAllMarks().run();
    }
  };

  const isLoadingAuth = isLoading;
  const isDisabled = isLoading || isAnalyzing || !token;

  if (!isLoadingAuth && !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md shadow-2xl border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Autenticación Requerida</CardTitle>
            <CardDescription>
              Debes iniciar sesión para usar el analizador de argumentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              El analizador de argumentos requiere una cuenta para guardar tu historial y brindarte una experiencia personalizada.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={() => router.push('/login')} className="w-full">
              Iniciar Sesión
            </Button>
            <Button onClick={() => router.push('/register')} variant="outline" className="w-full">
              Crear Cuenta
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 space-y-4 overflow-y-auto h-[calc(100vh-60px)]">
       <div className="text-center space-y-2">
           <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
             Silogia Studio
           </h1>
           <p className="text-muted-foreground">Analiza tu argumento y recibe sugerencias personalizadas para mejorarlo.</p>
       </div>

       {/* Conversation Title Bar */}
       <Card className="shadow-lg border-2">
         <CardContent className="p-4">
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2 flex-1">
               <FolderOpen className="h-5 w-5 text-muted-foreground" />
               {isEditingTitle ? (
                 <div className="flex gap-2 flex-1">
                   <Input
                     value={editTitle}
                     onChange={(e) => setEditTitle(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveTitle();
                       if (e.key === 'Escape') setIsEditingTitle(false);
                     }}
                     className="flex-1"
                     autoFocus
                   />
                   <Button size="sm" onClick={handleSaveTitle}>
                     <CheckCircle className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                 <>
                   <span className="font-semibold">
                     {conversation ? conversation.title : 'Sin guardar'}
                   </span>
                   {conversation && (
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="h-8 w-8"
                       onClick={() => setIsEditingTitle(true)}
                     >
                       <Pencil className="h-4 w-4" />
                     </Button>
                   )}
                 </>
               )}
             </div>
             <div className="flex gap-2">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => setIsHistoryOpen(true)}
                 disabled={!conversation}
               >
                 <History className="mr-2 h-4 w-4" />
                 Ver Versiones
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={handleSaveConversation}
                 disabled={isSaving || !token}
               >
                 <Save className="mr-2 h-4 w-4" />
                 {isSaving ? 'Guardando...' : conversation ? 'Guardado ✓' : 'Crear Conversación'}
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
       
       <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
           {/* Left Panel: Editor */}
           <Card className="shadow-lg flex flex-col border-2 h-full">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-primary" />
                 Editor de Texto
               </CardTitle>
               <CardDescription>
                 Escribe o pega tu texto argumentativo aquí.
               </CardDescription>
             </CardHeader>
             <CardContent className='flex-1 flex flex-col min-h-[400px]'>
               <TiptapEditor
                 content={text}
                 onContentChange={setText}
                 disabled={isDisabled}
                 onEditorReady={(editor) => { editorRef.current = editor; }}
               />
             </CardContent>
             <CardFooter className="flex justify-between items-center border-t pt-4">
               <div className="text-sm text-muted-foreground">
                 <strong>Palabras:</strong> {wordCount}
               </div>
               <div className='flex gap-2'>
                 <Button variant="outline" onClick={handleClear} disabled={isDisabled || wordCount === 0}>
                   Limpiar
                 </Button>
                 <Button onClick={handleAnalyze} disabled={isDisabled || wordCount === 0}>
                   <Sparkles className="mr-2 h-4 w-4" />
                   {isAnalyzing ? 'Analizando...' : 'Analizar'}
                 </Button>
               </div>
             </CardFooter>
           </Card>

           {/* Right Panel: Components & Suggestions */}
           <div className="flex flex-col gap-6 h-full">
             {/* Top: Argument Components */}
             <Card className="shadow-lg flex flex-col border-2 max-h-[45vh]">
               <CardHeader>
                 <CardTitle className='flex items-center gap-2'>
                   <FileText className='h-5 w-5 text-primary' />
                   Componentes Argumentativos
                 </CardTitle>
                 <CardDescription>
                   Premisas y conclusiones identificadas en tu texto.
                 </CardDescription>
               </CardHeader>
               <CardContent className="flex-1 overflow-y-auto">
                 {isAnalyzing ? (
                   <div className="space-y-3">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="space-y-2 p-3 border rounded-lg">
                         <Skeleton className="h-4 w-20" />
                         <Skeleton className="h-12 w-full" />
                       </div>
                     ))}
                   </div>
                 ) : analysisResult && (analysisResult.premises.length > 0 || analysisResult.conclusions.length > 0) ? (
                   <div className="space-y-3">
                     {/* Premisas */}
                     {analysisResult.premises.length > 0 && (
                       <div className="space-y-2">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                           <Badge 
                             variant="default"
                             style={{ backgroundColor: '#3b82f6', color: 'white' }}
                           >
                             PREMISAS ({analysisResult.premises.length})
                           </Badge>
                         </h3>
                         <div className="space-y-2">
                           {analysisResult.premises.map((premise, index) => (
                             <div
                               key={index}
                               className="p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                               onClick={() => highlightComponent(index)}
                             >
                               <p className="text-sm">{premise.text}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     {/* Conclusiones */}
                     {analysisResult.conclusions.length > 0 && (
                       <div className="space-y-2">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                           <Badge 
                             variant="secondary"
                             style={{ backgroundColor: '#f97316', color: 'white' }}
                           >
                             CONCLUSIONES ({analysisResult.conclusions.length})
                           </Badge>
                         </h3>
                         <div className="space-y-2">
                           {analysisResult.conclusions.map((conclusion, index) => (
                             <div
                               key={index}
                               className="p-3 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-400 dark:hover:border-orange-600 transition-colors cursor-pointer"
                               onClick={() => highlightComponent(analysisResult.premises.length + index)}
                             >
                               <p className="text-sm">{conclusion.text}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="text-muted-foreground flex items-center justify-center gap-2 p-8 border-dashed border-2 rounded-lg h-full">
                     <AlertCircle className="h-5 w-5" />
                     <span>Los componentes aparecerán aquí después del análisis.</span>
                   </div>
                 )}
               </CardContent>
               {analysisResult && (
                 <CardFooter className="border-t pt-3 text-sm text-muted-foreground">
                   <span>
                     Total: {analysisResult.total_premises + analysisResult.total_conclusions} componentes
                   </span>
                 </CardFooter>
               )}
             </Card>

             {/* Bottom: Suggestions */}
             <Card className="shadow-lg flex flex-col border-2 max-h-[45vh]">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className='flex items-center gap-2'>
                     <Lightbulb className='h-5 w-5 text-primary' />
                     Sugerencias
                   </CardTitle>
                   <CardDescription>
                     Mejora tu argumento con las siguientes recomendaciones.
                   </CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto">
               {isAnalyzing ? (
                 <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="space-y-2 p-4 border rounded-lg">
                       <Skeleton className="h-4 w-24" />
                       <Skeleton className="h-20 w-full" />
                       <Skeleton className="h-8 w-32" />
                     </div>
                   ))}
                 </div>
               ) : analysisResult && analysisResult.suggestions.length > 0 ? (
                 <div className="space-y-4">
                   {analysisResult.suggestions.map((suggestion, index) => (
                     <div 
                       key={index}
                       className={`p-4 border-2 rounded-lg hover:border-primary/50 transition-all cursor-pointer space-y-3 ${
                         selectedSuggestionIndex === index 
                           ? 'border-primary bg-primary/5 shadow-lg' 
                           : ''
                       }`}
                       onClick={() => {
                         setSelectedSuggestionIndex(index);
                         highlightComponent(index);
                       }}
                       onMouseEnter={() => highlightComponent(index)}
                     >
                       <div className="flex items-start gap-2">
                         <Badge 
                           variant={suggestion.component_type === 'premise' ? 'default' : 'secondary'}
                           className="mt-1"
                           style={{
                             backgroundColor: suggestion.component_type === 'premise' ? '#3b82f6' : '#f97316',
                             color: 'white'
                           }}
                         >
                           {suggestion.component_type === 'premise' ? 'PREMISA' : 'CONCLUSIÓN'}
                         </Badge>
                         <div className="flex-1">
                           <p className="text-sm text-muted-foreground">
                             {suggestion.explanation}
                           </p>
                         </div>
                       </div>
                       <Button 
                         size="sm" 
                         variant="outline"
                         className="w-full"
                         disabled={suggestion.applied}
                         onClick={(e) => e.stopPropagation()}
                       >
                         {suggestion.applied ? (
                           <>
                             <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                             Aplicado
                           </>
                         ) : (
                           'Aplicar Sugerencia'
                         )}
                       </Button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-muted-foreground flex items-center justify-center gap-2 p-8 border-dashed border-2 rounded-lg h-full">
                   <AlertCircle className="h-5 w-5" />
                   <span>Las sugerencias aparecerán aquí después del análisis.</span>
                 </div>
               )}
             </CardContent>
             {analysisResult && (
               <CardFooter className="border-t pt-3 flex items-center justify-between text-sm text-muted-foreground">
                 <span>
                   {analysisResult.total_premises} premisas • {analysisResult.total_conclusions} conclusiones detectadas
                 </span>
                 {lastAnalyzed && (
                   <span className="flex items-center gap-1">
                     <Clock className="h-3 w-3" />
                     {getTimeSinceAnalysis()}
                   </span>
                 )}
               </CardFooter>
             )}
           </Card>
         </div>
       </div>

       {/* History Sheet */}
       <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
         <SheetContent className="w-full sm:max-w-xl">
           <SheetHeader>
             <SheetTitle className="flex items-center gap-2">
               <History className="h-5 w-5" />
               Historial de Versiones
             </SheetTitle>
             <SheetDescription>
               Revisa las versiones anteriores de tus análisis
             </SheetDescription>
           </SheetHeader>
           
           <ScrollArea className="h-[calc(100vh-120px)] mt-6">
             {conversation?.messages && conversation.messages.length > 0 ? (
               <div className="space-y-4 pr-4">
                 {[...conversation.messages]
                   .reverse()
                   .map((message, index) => {
                     // Find the analysis for this message
                     const analysis = conversationAnalyses.find(
                       (a) => a.message_id === message.id
                     );
                     
                     return (
                       <Card key={message.id} className="border-2 hover:border-primary/50 transition-colors">
                         <CardHeader className="pb-3">
                           <div className="flex items-center justify-between">
                             <CardTitle className="text-sm font-medium flex items-center gap-2">
                               <Badge variant="outline" className="font-normal">
                                 Versión {index + 1}
                               </Badge>
                               <span className="text-xs text-muted-foreground">
                                 {new Date(message.created_at).toLocaleDateString('es-ES', {
                                   day: 'numeric',
                                   month: 'short',
                                   year: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 })}
                               </span>
                             </CardTitle>
                           </div>
                         </CardHeader>
                         <CardContent className="space-y-3">
                           <div>
                             <p className="text-xs font-semibold text-muted-foreground mb-2">Texto analizado:</p>
                             <p className="text-sm bg-muted p-3 rounded-md line-clamp-4 leading-relaxed">
                               {message.content}
                             </p>
                           </div>
                           
                           {analysis && (
                             <div className="pt-2 border-t space-y-2">
                               <p className="text-xs font-semibold text-muted-foreground">Resultados del análisis:</p>
                               <div className="flex gap-2 flex-wrap">
                                 <Badge 
                                   variant="secondary" 
                                   className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                 >
                                   <span className="font-semibold">{analysis.total_premises}</span>
                                   <span className="ml-1">
                                     {analysis.total_premises === 1 ? 'Premisa' : 'Premisas'}
                                   </span>
                                 </Badge>
                                 <Badge 
                                   variant="secondary"
                                   className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                                 >
                                   <span className="font-semibold">{analysis.total_conclusions}</span>
                                   <span className="ml-1">
                                     {analysis.total_conclusions === 1 ? 'Conclusión' : 'Conclusiones'}
                                   </span>
                                 </Badge>
                               </div>
                             </div>
                           )}
                         </CardContent>
                         <CardFooter className="pt-3">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="w-full"
                             onClick={() => {
                               const content = `<p>${message.content}</p>`;
                               setText(content);
                               
                               // Update editor content
                               if (editorRef.current) {
                                 editorRef.current.commands.setContent(content);
                               }
                               
                               // Restore analysis if it exists
                               if (analysis) {
                                 const result: AnalysisResult = {
                                   premises: analysis.components?.filter((c: any) => c.component_type === 'PREMISE').map((c: any) => ({
                                     type: 'premise' as const,
                                     text: c.text,
                                     tokens: c.tokens || [],
                                     start_pos: c.start_pos,
                                     end_pos: c.end_pos
                                   })) || [],
                                   conclusions: analysis.components?.filter((c: any) => c.component_type === 'CONCLUSION').map((c: any) => ({
                                     type: 'conclusion' as const,
                                     text: c.text,
                                     tokens: c.tokens || [],
                                     start_pos: c.start_pos,
                                     end_pos: c.end_pos
                                   })) || [],
                                   suggestions: (analysis.suggestions || analysis.llm_communications)?.map((s: any) => {
                                     const type = s.component_type?.toLowerCase();
                                     return {
                                       component_type: (type === 'premise' || type === 'conclusion' ? type : 'premise') as 'premise' | 'conclusion',
                                       original_text: s.original_text || '',
                                       suggestion: s.suggestion_text || '',
                                       explanation: s.explanation || '',
                                       applied: s.applied || false
                                     };
                                   }) || [],
                                   total_premises: analysis.total_premises,
                                   total_conclusions: analysis.total_conclusions,
                                   analyzed_at: analysis.analyzed_at
                                 };
                                 
                                 setAnalysisResult(result);
                                 const dateString = analysis.analyzed_at || analysis.created_at;
                                 const analyzedDate = new Date(dateString);
                                 setLastAnalyzed(analyzedDate);
                                 
                                 // Apply highlights after content is set
                                 setTimeout(() => {
                                   if (editorRef.current) {
                                     applyHighlights(editorRef.current, result);
                                   }
                                 }, 100);
                               } else {
                                 // Clear analysis if no analysis exists for this version
                                 setAnalysisResult(null);
                                 setLastAnalyzed(null);
                               }
                               
                               setIsHistoryOpen(false);
                               toast({
                                 title: 'Versión cargada',
                                 description: `Versión ${index + 1} restaurada`,
                               });
                             }}
                           >
                             Restaurar esta versión
                           </Button>
                         </CardFooter>
                       </Card>
                     );
                   })}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                 <History className="h-16 w-16 text-muted-foreground" />
                 <div>
                   <h3 className="font-semibold text-lg">No hay versiones guardadas</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Realiza un análisis para crear tu primera versión
                   </p>
                 </div>
               </div>
             )}
           </ScrollArea>
         </SheetContent>
       </Sheet>
    </div>
  );
}
