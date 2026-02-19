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
import { Progress } from '@/components/ui/progress';
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
  BarChart,
  TrendingUp,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  component_index?: number; // Índice del componente relacionado
}

interface ParagraphAnalysis {
  paragraph_index: number;
  text: string;
  word_count: number;
  premises_count: number;
  conclusions_count: number;
  density: number;
  strength: 'débil' | 'moderada' | 'fuerte' | 'muy fuerte';
  strength_score: number;
  recommendation?: string;
}

interface AnalysisResult {
  premises: ArgumentComponent[];
  conclusions: ArgumentComponent[];
  suggestions: ArgumentSuggestion[];
  total_premises: number;
  total_conclusions: number;
  analyzed_at: string;
    paragraph_analysis?: ParagraphAnalysis[];
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
  const [lastAnalyzedText, setLastAnalyzedText] = useState<string>('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(false);
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

  // Efecto para aplicar/quitar highlights cuando cambia el toggle
  useEffect(() => {
    if (!editorRef.current || !analysisResult) {
      return;
    }
    
    if (showHighlights) {
      // Verificar que el texto del editor coincide con el texto analizado
      const currentContent = editorRef.current.getHTML();
      const currentPlainText = currentContent
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\n+/g, '\n\n')
        .trim();
      
      // Función para normalizar texto para comparación
      const normalizeForComparison = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      if (lastAnalyzedText && normalizeForComparison(currentPlainText) !== normalizeForComparison(lastAnalyzedText)) {
        toast({
          variant: 'destructive',
          title: 'Texto modificado',
          description: 'El texto en el editor ha cambiado desde el último análisis. Algunos componentes pueden no resaltarse correctamente. Analiza nuevamente para obtener resultados precisos.',
          duration: 6000,
        });
      }
      
      // Hacer el editor no editable
      editorRef.current.setEditable(false);
      // Aplicar highlights
      applyHighlights(editorRef.current, analysisResult);
    } else {
      // Hacer el editor editable
      editorRef.current.setEditable(true);
      // Quitar todos los highlights - recargar contenido limpio
      const currentContent = editorRef.current.getHTML();
      const cleanContent = currentContent.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '$1');
      editorRef.current.commands.setContent(cleanContent);
    }
  }, [showHighlights, analysisResult]);

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
      
      // Cargar el último análisis si existe PRIMERO para obtener el texto original
      if (analyses.length > 0) {
          const lastAnalysis = analyses[0]; // El endpoint devuelve ordenado por fecha desc
          
          // Parsear el spec para obtener toda la información
          let specData: any = null;
          let originalText = '';
          let specSuggestions: any[] = [];
          let specParagraphAnalysis: any[] = [];
          
          if (lastAnalysis.spec) {
            try {
              specData = typeof lastAnalysis.spec === 'string' 
                ? JSON.parse(lastAnalysis.spec) 
                : lastAnalysis.spec;
              
              // Obtener texto original del spec
              if (specData.original_text) {
                originalText = specData.original_text;
              } else if (specData.text) {
                originalText = specData.text;
              }
              
              // Obtener sugerencias del spec
              if (specData.suggestions && Array.isArray(specData.suggestions)) {
                specSuggestions = specData.suggestions;
              }
              
              // Obtener evaluación por párrafo del spec
              if (specData.paragraph_analysis && Array.isArray(specData.paragraph_analysis)) {
                specParagraphAnalysis = specData.paragraph_analysis;
              }
            } catch (e) {
              // Error parseando spec
            }
          }
          
          // Si no hay texto original en spec, usar el mensaje del usuario
          if (!originalText && data.messages && data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage.role === 'user') {
              originalText = lastMessage.content;
            }
          }
          
          // Cargar el texto en el editor
          if (originalText) {
            // Dividir por párrafos (doble salto de línea o más)
            const paragraphs = originalText.split(/\n\n+/);
            const content = paragraphs
              .map(para => {
                // Cada párrafo puede tener saltos de línea simples que deben preservarse
                const lines = para.split('\n').filter(line => line.trim());
                if (lines.length === 0) return '';
                if (lines.length === 1) return `<p>${lines[0]}</p>`;
                // Si hay múltiples líneas en el mismo párrafo, unirlas con <br>
                return `<p>${lines.join('<br>')}</p>`;
              })
              .filter(p => p)
              .join('');
            setText(content);
            
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.commands.setContent(content);
                editorRef.current.setEditable(true);
              }
            }, 100);
          }
          
          // Construir el resultado del análisis
          const premises = lastAnalysis.components?.filter((c: any) => {
            const type = c.component_type?.toUpperCase?.() || c.component_type;
            return type === 'PREMISE';
          }).map((c: any) => ({
            type: 'premise' as const,
            text: c.text,
            tokens: c.tokens || [],
            start_pos: c.start_pos,
            end_pos: c.end_pos
          })) || [];
          
          const conclusions = lastAnalysis.components?.filter((c: any) => {
            const type = c.component_type?.toUpperCase?.() || c.component_type;
            return type === 'CONCLUSION';
          }).map((c: any) => ({
            type: 'conclusion' as const,
            text: c.text,
            tokens: c.tokens || [],
            start_pos: c.start_pos,
            end_pos: c.end_pos
          })) || [];
          
          // Usar sugerencias del spec si están disponibles, sino del análisis directo
          const rawSuggestions = specSuggestions.length > 0 ? specSuggestions : (lastAnalysis.suggestions || []);
          
          const suggestions = rawSuggestions.map((s: any) => {
            const type = s.component_type?.toLowerCase();
            let componentIndex = -1;
            
            // Buscar índice del componente que coincida con el texto original
            if (type === 'premise') {
              componentIndex = premises.findIndex(
                (p: any) => p.text.trim() === s.original_text?.trim()
              );
            } else if (type === 'conclusion') {
              const conclusionIndex = conclusions.findIndex(
                (c: any) => c.text.trim() === s.original_text?.trim()
              );
              if (conclusionIndex >= 0) {
                componentIndex = premises.length + conclusionIndex;
              }
            }
            
            return {
              component_type: (type === 'premise' || type === 'conclusion' ? type : 'premise') as 'premise' | 'conclusion',
              original_text: s.original_text || '',
              suggestion: s.suggestion || s.suggestion_text || '',
              explanation: s.explanation || '',
              applied: s.applied || false,
              component_index: componentIndex >= 0 ? componentIndex : undefined
            };
          });
          
          // Procesar paragraph_analysis si existe
          const paragraphAnalysis = specParagraphAnalysis.length > 0 
            ? specParagraphAnalysis.map((p: any, idx: number) => ({
                paragraph_index: idx,
                text: p.text || '',
                strength: p.strength || 'débil',
                premises_count: p.premises_count || 0,
                conclusions_count: p.conclusions_count || 0,
                word_count: p.word_count || 0,
                density: p.density || 0,
                strength_score: p.strength_score || 0,
                recommendation: p.recommendation || undefined
              }))
            : undefined;
          
          const result: AnalysisResult = {
            premises,
            conclusions,
            suggestions,
            total_premises: lastAnalysis.total_premises || premises.length,
            total_conclusions: lastAnalysis.total_conclusions || conclusions.length,
            analyzed_at: lastAnalysis.analyzed_at,
            paragraph_analysis: paragraphAnalysis
          };
          
          setAnalysisResult(result);
          // Usar analyzed_at si existe, sino usar created_at
          const dateString = lastAnalysis.analyzed_at || lastAnalysis.created_at;
          const analyzedDate = new Date(dateString);
          setLastAnalyzed(analyzedDate);
          // Guardar el texto analizado para validación
          setLastAnalyzedText(originalText);
          
          // NO aplicar resaltado automáticamente - dejar que el usuario lo active manualmente
          // Esto permite que el editor sea editable al cargar
          setShowHighlights(false);
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
        router.push(`/analyzer?conversation=${newConv.id}`);
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
      // Convertir HTML a texto plano preservando párrafos con doble salto de línea
      const plainText = text
        .replace(/<\/p>/gi, '\n\n')  // Convertir cierre de párrafo a doble salto de línea
        .replace(/<br\s*\/?>/gi, '\n')  // Convertir <br> a salto de línea simple
        .replace(/<[^>]+>/g, '')  // Eliminar el resto de etiquetas HTML
        .replace(/\n\n+/g, '\n\n')  // Normalizar múltiples saltos de línea a doble
        .trim();
      
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
      
      // Vincular sugerencias con componentes por texto original
      if (data.suggestions && data.suggestions.length > 0) {
        data.suggestions = data.suggestions.map((sug: ArgumentSuggestion) => {
          // Buscar índice del componente que coincida con el texto original
          let componentIndex = -1;
          
          if (sug.component_type === 'premise') {
            componentIndex = data.premises.findIndex(
              (p: ArgumentComponent) => p.text.trim() === sug.original_text.trim()
            );
          } else {
            componentIndex = data.premises.length + data.conclusions.findIndex(
              (c: ArgumentComponent) => c.text.trim() === sug.original_text.trim()
            );
          }
          
          return { ...sug, component_index: componentIndex >= 0 ? componentIndex : undefined };
        });
      }
      
      setAnalysisResult(data);
      setLastAnalyzed(new Date());
      setLastAnalyzedText(plainText);
      
      // Aplicar resaltado solo si el toggle está activado
      if (showHighlights && editorRef.current) {
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
    try {
      // Obtener el texto plano del editor
      const plainText = editor.getText();
      
      // Función más agresiva para normalizar: quitar todo excepto letras y números
      const normalizeForSearch = (str: string) => {
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          // PRIMERO: normalizar contracciones expandidas ANTES de quitar espacios
          .replace(/\bde\s+el\b/g, 'del')  // "de el" → "del"
          .replace(/\ba\s+el\b/g, 'al')    // "a el" → "al"
          .replace(/\bde\s+la\b/g, 'dela')  // "de la" → "dela"
          .replace(/\ba\s+la\b/g, 'ala')    // "a la" → "ala"
          // Normalizar espacios alrededor de puntuación (ej: " , " → ",")
          .replace(/\s*([.,;:!?¿¡\-()"""''])\s*/g, '$1')
          // LUEGO: quitar espacios
          .replace(/\s+/g, '')
          // FINALMENTE: quitar puntuación
          .replace(/[.,;:!?¿¡\-()"""'']/g, '')
          .trim();
      };
      
      // Función para encontrar la posición del texto
      const findTextPosition = (searchText: string, componentType: string, index: number): { from: number, to: number } | null => {
        const searchNormalized = normalizeForSearch(searchText);
        const editorNormalized = normalizeForSearch(plainText);
        
        // Buscar la posición normalizada
        const normalizedIndex = editorNormalized.indexOf(searchNormalized);
        
        if (normalizedIndex === -1) {
          return null;
        }
        
        // Mapear la posición normalizada al texto original
        let charCount = 0;
        let startIndex = 0;
        
        // Encontrar el inicio
        for (let i = 0; i < plainText.length; i++) {
          const normalized = normalizeForSearch(plainText.substring(0, i + 1));
          if (normalized.length > normalizedIndex) {
            startIndex = i - (normalized.length - normalizedIndex - 1);
            break;
          }
        }
        
        // Encontrar el final contando caracteres normalizados
        let endIndex = startIndex;
        let currentNormalizedLength = 0;
        
        while (currentNormalizedLength < searchNormalized.length && endIndex < plainText.length) {
          endIndex++;
          const segment = plainText.substring(startIndex, endIndex);
          currentNormalizedLength = normalizeForSearch(segment).length;
        }
        
        const from = startIndex + 1; // Tiptap usa 1-indexed
        const to = endIndex + 1;
        
        return { from, to };
      };
      
      // Primero recolectar todas las posiciones a marcar
      const marksToApply: Array<{ from: number, to: number, color: string, type: string, index: number }> = [];
      
      // Recolectar posiciones de premisas con colores alternados
      data.premises.forEach((premise, index) => {
        const position = findTextPosition(premise.text, 'premisa', index);
        if (position) {
          // Alternar entre tonos de azul para diferenciar premisas consecutivas
          const color = index % 2 === 0 ? '#60a5fa' : '#3b82f6'; // azul más claro y azul normal
          marksToApply.push({ ...position, color, type: 'premise', index });
        }
      });
      
      // Recolectar posiciones de conclusiones con colores alternados
      data.conclusions.forEach((conclusion, index) => {
        const position = findTextPosition(conclusion.text, 'conclusión', index);
        if (position) {
          // Alternar entre tonos de naranja para diferenciar conclusiones consecutivas
          const color = index % 2 === 0 ? '#fb923c' : '#f97316'; // naranja más claro y naranja normal
          marksToApply.push({ ...position, color, type: 'conclusion', index });
        }
      });
      
      // Ordenar por posición para aplicar de forma segura
      marksToApply.sort((a, b) => a.from - b.from);
      
      // Aplicar todos los highlights con un pequeño espaciado entre componentes consecutivos
      marksToApply.forEach((mark, idx) => {
        try {
          let adjustedFrom = mark.from;
          let adjustedTo = mark.to;
          
          // Si hay un componente anterior muy cerca (menos de 3 caracteres de distancia)
          // ajustar el inicio para dejar un pequeño espacio visual
          if (idx > 0) {
            const prevMark = marksToApply[idx - 1];
            if (mark.from - prevMark.to < 3) {
              adjustedFrom = Math.max(mark.from, prevMark.to + 1);
            }
          }
          
          editor.chain()
            .setTextSelection({ from: adjustedFrom, to: adjustedTo })
            .setHighlight({ color: mark.color })
            .run();
        } catch (err) {
          // Error al aplicar highlight
        }
      });
      
      // Deseleccionar
      editor.commands.setTextSelection(0);
      editor.commands.blur();
      
      const totalExpected = data.premises.length + data.conclusions.length;
      const totalFound = marksToApply.length;
      
      // Mostrar advertencia si faltan componentes
      if (totalFound < totalExpected) {
        const missing = totalExpected - totalFound;
        toast({
          variant: 'default',
          title: `${totalFound}/${totalExpected} componentes resaltados`,
          description: `No se pudieron resaltar ${missing} componente(s). Esto suele ocurrir cuando el texto del editor difiere del texto analizado. Considera analizar nuevamente.`,
          duration: 5000,
        });
      }
    } catch (error) {
      // Error al aplicar resaltados
    }
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
    setLastAnalyzedText('');
    setSelectedSuggestionIndex(null);
    setShowHighlights(false);
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
         <CardContent className="p-3 md:p-4">
           <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between">
             {/* Title Section */}
             <div className="flex items-center gap-2 flex-1 min-w-0">
               <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
               {isEditingTitle ? (
                 <div className="flex gap-2 flex-1 min-w-0">
                   <Input
                     value={editTitle}
                     onChange={(e) => setEditTitle(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveTitle();
                       if (e.key === 'Escape') setIsEditingTitle(false);
                     }}
                     className="flex-1 min-w-0"
                     autoFocus
                   />
                   <Button size="sm" onClick={handleSaveTitle} className="flex-shrink-0">
                     <CheckCircle className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                 <>
                   <span className="font-semibold truncate">
                     {conversation ? conversation.title : 'Sin guardar'}
                   </span>
                   {conversation && (
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="h-8 w-8 flex-shrink-0"
                       onClick={() => setIsEditingTitle(true)}
                     >
                       <Pencil className="h-4 w-4" />
                     </Button>
                   )}
                 </>
               )}
             </div>
             
             {/* Actions Section */}
             <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
               {analysisResult && (
                 <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/50">
                   <input
                     type="checkbox"
                     id="highlight-toggle"
                     checked={showHighlights}
                     onChange={(e) => setShowHighlights(e.target.checked)}
                     className="h-4 w-4 cursor-pointer accent-primary flex-shrink-0"
                   />
                   <label 
                     htmlFor="highlight-toggle" 
                     className="text-sm font-medium cursor-pointer select-none flex items-center gap-2"
                   >
                     <div className="flex items-center gap-1 flex-shrink-0">
                       <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                       <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                     </div>
                     <span className="hidden sm:inline">Resaltar componentes</span>
                     <span className="sm:hidden">Resaltar</span>
                   </label>
                 </div>
               )}
               
               <div className="flex gap-2">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => setIsHistoryOpen(true)}
                   disabled={!conversation}
                   className="flex-1 sm:flex-initial"
                 >
                   <History className="h-4 w-4 sm:mr-2" />
                   <span className="hidden sm:inline">Ver Versiones</span>
                   <span className="sm:hidden">Versiones</span>
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={handleSaveConversation}
                   disabled={isSaving || !token}
                   className="flex-1 sm:flex-initial"
                 >
                   <Save className="h-4 w-4 sm:mr-2" />
                   <span className="hidden sm:inline">
                     {isSaving ? 'Guardando...' : conversation ? 'Guardado ✓' : 'Crear Conversación'}
                   </span>
                   <span className="sm:hidden">
                     {isSaving ? 'Guardando...' : conversation ? '✓' : 'Crear'}
                   </span>
                 </Button>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
       
       <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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
             <CardContent className='flex-1 flex flex-col min-h-0'>
               <TiptapEditor
                 content={text}
                 onContentChange={setText}
                 disabled={isDisabled || showHighlights}
                 onEditorReady={(editor) => { editorRef.current = editor; }}
               />
             </CardContent>
             <CardFooter className="flex justify-between items-center border-t pt-4">
               <div className="text-sm text-muted-foreground">
                 <strong>Palabras:</strong> {wordCount}
               </div>
               <div className='flex gap-2'>
                 <Button variant="outline" onClick={handleClear} disabled={isDisabled || showHighlights || wordCount === 0}>
                   Limpiar
                 </Button>
                 <Button onClick={handleAnalyze} disabled={isDisabled || showHighlights || wordCount === 0}>
                   <Sparkles className="mr-2 h-4 w-4" />
                   {isAnalyzing ? 'Analizando...' : 'Analizar'}
                 </Button>
               </div>
             </CardFooter>
           </Card>

           {/* Right Panel: Components & Suggestions */}
           <div className="flex flex-col gap-6 h-full">
             {/* Top: Argument Components */}
             <Card className="shadow-lg flex flex-col border-2 flex-1 min-h-0">
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
                 ) : analysisResult ? (
                   (analysisResult.premises.length > 0 || analysisResult.conclusions.length > 0) ? (
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
                           {analysisResult.premises.map((premise, index) => {
                             const componentId = `premise-${index}`;
                             const relatedSuggestion = analysisResult.suggestions.find(s => s.component_index === index);
                             const hasSuggestion = !!relatedSuggestion;
                             const isHovered = hoveredComponentId === componentId;
                             const popoverId = `popover-${componentId}`;
                             // Color alternado para cada premisa
                             const bgColor = index % 2 === 0 ? 'bg-blue-100/70 dark:bg-blue-900/40' : 'bg-blue-50/50 dark:bg-blue-950/20';
                             const borderColor = index % 2 === 0 ? 'border-blue-300 dark:border-blue-700' : 'border-blue-200 dark:border-blue-800';
                             const hoverBorderColor = index % 2 === 0 ? 'hover:border-blue-500 dark:hover:border-blue-500' : 'hover:border-blue-400 dark:hover:border-blue-600';
                             const indexBadgeBg = index % 2 === 0 ? 'bg-blue-500' : 'bg-blue-600';
                             
                             return (
                               <Popover 
                                 key={index}
                                 open={openPopoverId === popoverId}
                                 onOpenChange={(open) => {
                                   setOpenPopoverId(open ? popoverId : null);
                                   // Hacer scroll a la sugerencia relacionada si existe
                                   if (open && hasSuggestion) {
                                     setTimeout(() => {
                                       const premiseSuggestions = analysisResult.suggestions.filter(s => s.component_type === 'premise');
                                       const suggestionIdx = premiseSuggestions.findIndex(s => s.component_index === index);
                                       if (suggestionIdx >= 0) {
                                         const suggestionElement = document.getElementById(`suggestion-premise-${suggestionIdx}`);
                                         if (suggestionElement) {
                                           const scrollContainer = suggestionElement.closest('.overflow-y-auto');
                                           if (scrollContainer) {
                                             const containerRect = scrollContainer.getBoundingClientRect();
                                             const elementRect = suggestionElement.getBoundingClientRect();
                                             const scrollTop = scrollContainer.scrollTop;
                                             const offsetTop = elementRect.top - containerRect.top + scrollTop;
                                             const centerOffset = (containerRect.height - elementRect.height) / 2;
                                             scrollContainer.scrollTo({
                                               top: offsetTop - centerOffset,
                                               behavior: 'smooth'
                                             });
                                           }
                                         }
                                       }
                                     }, 100);
                                   }
                                 }}
                               >
                                 <PopoverTrigger asChild>
                                   <div
                                     id={componentId}
                                     className={`p-3 border-2 rounded-lg transition-all cursor-pointer relative ${
                                       isHovered 
                                         ? `border-blue-500 ${bgColor} shadow-lg scale-[1.02]` 
                                         : `${borderColor} ${bgColor} ${hoverBorderColor}`
                                     }`}
                                     onMouseEnter={() => setHoveredComponentId(componentId)}
                                     onMouseLeave={() => setHoveredComponentId(null)}
                                   >
                                     <div className="flex items-start gap-3">
                                       <Badge 
                                         variant="outline" 
                                         className={`shrink-0 h-6 w-6 flex items-center justify-center p-0 ${indexBadgeBg} text-white font-bold border-0`}
                                       >
                                         P{index + 1}
                                       </Badge>
                                       <p className="text-sm flex-1">{premise.text}</p>
                                       {hasSuggestion && (
                                         <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 animate-pulse" />
                                       )}
                                     </div>
                                   </div>
                                 </PopoverTrigger>
                                 {hasSuggestion && relatedSuggestion && (
                                   <PopoverContent className="w-96" side="left" align="start">
                                     <div className="space-y-3">
                                       <div className="flex items-center gap-2">
                                         <Badge 
                                           variant="outline"
                                           className="h-6 w-6 flex items-center justify-center p-0 border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 font-bold"
                                         >
                                           P{index + 1}
                                         </Badge>
                                         <h4 className="font-semibold text-sm">Sugerencia para esta premisa</h4>
                                       </div>
                                       <p className="text-sm leading-relaxed">{relatedSuggestion.explanation}</p>
                                     </div>
                                   </PopoverContent>
                                 )}
                               </Popover>
                             );
                           })}
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
                           {analysisResult.conclusions.map((conclusion, index) => {
                             const globalIndex = analysisResult.premises.length + index;
                             const componentId = `conclusion-${index}`;
                             const relatedSuggestion = analysisResult.suggestions.find(s => s.component_index === globalIndex);
                             const hasSuggestion = !!relatedSuggestion;
                             const isHovered = hoveredComponentId === componentId;
                             const popoverId = `popover-${componentId}`;
                             
                             // Alternar colores para conclusiones (naranja claro/oscuro)
                             const bgColor = index % 2 === 0 
                               ? 'bg-orange-400/20 dark:bg-orange-400/10' 
                               : 'bg-orange-500/20 dark:bg-orange-500/10';
                             const borderColor = index % 2 === 0 
                               ? 'border-orange-400/50 dark:border-orange-400/30' 
                               : 'border-orange-500/50 dark:border-orange-500/30';
                             const hoverBorderColor = index % 2 === 0 
                               ? 'hover:border-orange-400 dark:hover:border-orange-400' 
                               : 'hover:border-orange-500 dark:hover:border-orange-500';
                             const indexBadgeBg = index % 2 === 0 
                               ? 'bg-orange-400 dark:bg-orange-400' 
                               : 'bg-orange-500 dark:bg-orange-500';
                             
                             return (
                               <Popover 
                                 key={index}
                                 open={openPopoverId === popoverId}
                                 onOpenChange={(open) => {
                                   setOpenPopoverId(open ? popoverId : null);
                                   // Hacer scroll a la sugerencia relacionada si existe
                                   if (open && hasSuggestion) {
                                     setTimeout(() => {
                                       const conclusionSuggestions = analysisResult.suggestions.filter(s => s.component_type === 'conclusion');
                                       const suggestionIdx = conclusionSuggestions.findIndex(s => s.component_index === globalIndex);
                                       if (suggestionIdx >= 0) {
                                         const suggestionElement = document.getElementById(`suggestion-conclusion-${suggestionIdx}`);
                                         if (suggestionElement) {
                                           const scrollContainer = suggestionElement.closest('.overflow-y-auto');
                                           if (scrollContainer) {
                                             const containerRect = scrollContainer.getBoundingClientRect();
                                             const elementRect = suggestionElement.getBoundingClientRect();
                                             const scrollTop = scrollContainer.scrollTop;
                                             const offsetTop = elementRect.top - containerRect.top + scrollTop;
                                             const centerOffset = (containerRect.height - elementRect.height) / 2;
                                             scrollContainer.scrollTo({
                                               top: offsetTop - centerOffset,
                                               behavior: 'smooth'
                                             });
                                           }
                                         }
                                       }
                                     }, 100);
                                   }
                                 }}
                               >
                                 <PopoverTrigger asChild>
                                   <div
                                     id={componentId}
                                     className={`p-3 border-2 rounded-lg transition-all cursor-pointer relative ${bgColor} ${borderColor} ${hoverBorderColor} ${
                                       isHovered 
                                         ? 'shadow-lg scale-[1.02]' 
                                         : ''
                                     }`}
                                     onMouseEnter={() => setHoveredComponentId(componentId)}
                                     onMouseLeave={() => setHoveredComponentId(null)}
                                   >
                                     <div className="flex items-start gap-3">
                                       <Badge 
                                         variant="outline" 
                                         className={`shrink-0 h-6 w-6 flex items-center justify-center p-0 border-0 text-white font-bold ${indexBadgeBg}`}
                                       >
                                         C{index + 1}
                                       </Badge>
                                       <p className="text-sm flex-1">{conclusion.text}</p>
                                       {hasSuggestion && (
                                         <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 animate-pulse" />
                                       )}
                                     </div>
                                   </div>
                                 </PopoverTrigger>
                                 {hasSuggestion && relatedSuggestion && (
                                   <PopoverContent className="w-96" side="left" align="start">
                                     <div className="space-y-3">
                                       <div className="flex items-center gap-2">
                                         <Badge 
                                           variant="outline"
                                           className="h-6 w-6 flex items-center justify-center p-0 border-orange-400 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 font-bold"
                                         >
                                           C{index + 1}
                                         </Badge>
                                         <h4 className="font-semibold text-sm">Sugerencia para esta conclusión</h4>
                                       </div>
                                       <p className="text-sm leading-relaxed">{relatedSuggestion.explanation}</p>
                                     </div>
                                   </PopoverContent>
                                 )}
                               </Popover>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 p-8 border-dashed border-2 rounded-lg h-full">
                     <AlertCircle className="h-8 w-8 text-yellow-500" />
                     <div className="text-center space-y-1">
                       <p className="font-semibold">No se detectaron componentes argumentativos</p>
                       <p className="text-sm">El texto analizado no contiene premisas ni conclusiones identificables.</p>
                     </div>
                   </div>
                 )
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
                     {analysisResult.total_premises} premisas • {analysisResult.total_conclusions} conclusiones detectadas
                   </span>
                 </CardFooter>
               )}
             </Card>

             {/* Bottom: Suggestions */}
             <Card className="shadow-lg flex flex-col border-2 flex-1 min-h-0">
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
               ) : analysisResult ? (
                 analysisResult.suggestions.length > 0 ? (
                 <div className="space-y-3">
                   {/* Sugerencias para Premisas */}
                   {(() => {
                     const premiseSuggestions = analysisResult.suggestions.filter(s => s.component_type === 'premise');
                     if (premiseSuggestions.length === 0) return null;
                     
                     return (
                       <div className="space-y-2">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                           <Badge 
                             variant="default"
                             style={{ backgroundColor: '#3b82f6', color: 'white' }}
                           >
                             SUGERENCIAS - PREMISAS ({premiseSuggestions.length})
                           </Badge>
                         </h3>
                         <div className="space-y-2">
                           {premiseSuggestions.map((suggestion, idx) => {
                             const componentId = `premise-${suggestion.component_index}`;
                             const isHovered = hoveredComponentId === componentId;
                             const componentLabel = suggestion.component_index !== undefined
                               ? `P${suggestion.component_index + 1}`
                               : null;
                             const popoverId = `popover-suggestion-premise-${idx}`;
                             const isSelected = openPopoverId === popoverId;
                             
                             const relatedComponent = suggestion.component_index !== undefined
                               ? analysisResult.premises[suggestion.component_index]
                               : null;
                             
                             return (
                               <Popover 
                                 key={idx}
                                 open={isSelected}
                                 onOpenChange={(open) => {
                                   setOpenPopoverId(open ? popoverId : null);
                                   // Hacer scroll al componente relacionado
                                   if (open && suggestion.component_index !== undefined) {
                                     setTimeout(() => {
                                       const componentElement = document.getElementById(`premise-${suggestion.component_index}`);
                                       if (componentElement) {
                                         const scrollContainer = componentElement.closest('.overflow-y-auto');
                                         if (scrollContainer) {
                                           const containerRect = scrollContainer.getBoundingClientRect();
                                           const elementRect = componentElement.getBoundingClientRect();
                                           const scrollTop = scrollContainer.scrollTop;
                                           const offsetTop = elementRect.top - containerRect.top + scrollTop;
                                           const centerOffset = (containerRect.height - elementRect.height) / 2;
                                           scrollContainer.scrollTo({
                                             top: offsetTop - centerOffset,
                                             behavior: 'smooth'
                                           });
                                         }
                                       }
                                     }, 100);
                                   }
                                 }}
                               >
                                 <PopoverTrigger asChild>
                                   <div
                                     id={`suggestion-premise-${idx}`}
                                     className={`p-3 border-2 rounded-lg transition-all cursor-pointer relative ${
                                       isSelected
                                         ? 'border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 shadow-lg scale-[1.02]'
                                         : isHovered 
                                         ? 'border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 shadow-lg scale-[1.02]' 
                                         : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600'
                                     }`}
                                     onMouseEnter={() => {
                                       if (suggestion.component_index !== undefined) {
                                         setHoveredComponentId(componentId);
                                       }
                                     }}
                                     onMouseLeave={() => setHoveredComponentId(null)}
                                   >
                                     <div className="flex items-start gap-3">
                                       {componentLabel && (
                                         <Badge 
                                           variant="outline"
                                           className="shrink-0 h-6 w-6 flex items-center justify-center p-0 border-blue-400 text-blue-700 dark:text-blue-300 font-bold"
                                         >
                                           {componentLabel}
                                         </Badge>
                                       )}
                                       <p className="text-sm flex-1 leading-relaxed">{suggestion.explanation}</p>
                                     </div>
                                   </div>
                                 </PopoverTrigger>
                                 {relatedComponent && (
                                   <PopoverContent className="w-96" side="right" align="start">
                                     <div className="space-y-3">
                                       <div className="flex items-center gap-2">
                                         {componentLabel && (
                                           <Badge 
                                             variant="outline"
                                             className="h-6 w-6 flex items-center justify-center p-0 border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 font-bold"
                                           >
                                             {componentLabel}
                                           </Badge>
                                         )}
                                         <h4 className="font-semibold text-sm">Premisa relacionada</h4>
                                       </div>
                                       <p className="text-sm bg-muted/50 p-3 rounded border leading-relaxed">
                                         "{relatedComponent.text}"
                                       </p>
                                     </div>
                                   </PopoverContent>
                                 )}
                               </Popover>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })()}
                   
                   {/* Sugerencias para Conclusiones */}
                   {(() => {
                     const conclusionSuggestions = analysisResult.suggestions.filter(s => s.component_type === 'conclusion');
                     if (conclusionSuggestions.length === 0) return null;
                     
                     return (
                       <div className="space-y-2">
                         <h3 className="text-sm font-semibold flex items-center gap-2">
                           <Badge 
                             variant="secondary"
                             style={{ backgroundColor: '#f97316', color: 'white' }}
                           >
                             SUGERENCIAS - CONCLUSIONES ({conclusionSuggestions.length})
                           </Badge>
                         </h3>
                         <div className="space-y-2">
                           {conclusionSuggestions.map((suggestion, idx) => {
                             const componentIndex = suggestion.component_index !== undefined 
                               ? suggestion.component_index - analysisResult.premises.length 
                               : -1;
                             const componentId = `conclusion-${componentIndex}`;
                             const isHovered = hoveredComponentId === componentId;
                             const componentLabel = componentIndex >= 0
                               ? `C${componentIndex + 1}`
                               : null;
                             const popoverId = `popover-suggestion-conclusion-${idx}`;
                             const isSelected = openPopoverId === popoverId;
                             
                             const relatedComponent = componentIndex >= 0
                               ? analysisResult.conclusions[componentIndex]
                               : null;
                             
                             // Alternar colores basados en el índice del componente relacionado
                             const bgColor = componentIndex % 2 === 0 
                               ? 'bg-orange-400/20 dark:bg-orange-400/10' 
                               : 'bg-orange-500/20 dark:bg-orange-500/10';
                             const borderColor = componentIndex % 2 === 0 
                               ? 'border-orange-400/50 dark:border-orange-400/30' 
                               : 'border-orange-500/50 dark:border-orange-500/30';
                             const hoverBorderColor = componentIndex % 2 === 0 
                               ? 'hover:border-orange-400 dark:hover:border-orange-400' 
                               : 'hover:border-orange-500 dark:hover:border-orange-500';
                             const indexBadgeBg = componentIndex % 2 === 0 
                               ? 'bg-orange-400 dark:bg-orange-400' 
                               : 'bg-orange-500 dark:bg-orange-500';
                             
                             return (
                               <Popover 
                                 key={idx}
                                 open={isSelected}
                                 onOpenChange={(open) => {
                                   setOpenPopoverId(open ? popoverId : null);
                                   // Hacer scroll al componente relacionado
                                   if (open && componentIndex >= 0) {
                                     setTimeout(() => {
                                       const componentElement = document.getElementById(`conclusion-${componentIndex}`);
                                       if (componentElement) {
                                         const scrollContainer = componentElement.closest('.overflow-y-auto');
                                         if (scrollContainer) {
                                           const containerRect = scrollContainer.getBoundingClientRect();
                                           const elementRect = componentElement.getBoundingClientRect();
                                           const scrollTop = scrollContainer.scrollTop;
                                           const offsetTop = elementRect.top - containerRect.top + scrollTop;
                                           const centerOffset = (containerRect.height - elementRect.height) / 2;
                                           scrollContainer.scrollTo({
                                             top: offsetTop - centerOffset,
                                             behavior: 'smooth'
                                           });
                                         }
                                       }
                                     }, 100);
                                   }
                                 }}
                               >
                                 <PopoverTrigger asChild>
                                   <div
                                     id={`suggestion-conclusion-${idx}`}
                                     className={`p-3 border-2 rounded-lg transition-all cursor-pointer relative ${bgColor} ${borderColor} ${hoverBorderColor} ${
                                       isSelected || isHovered
                                         ? 'shadow-lg scale-[1.02]'
                                         : ''
                                     }`}
                                     onMouseEnter={() => {
                                       if (componentIndex >= 0) {
                                         setHoveredComponentId(componentId);
                                       }
                                     }}
                                     onMouseLeave={() => setHoveredComponentId(null)}
                                   >
                                     <div className="flex items-start gap-3">
                                       {componentLabel && (
                                         <Badge 
                                           variant="outline"
                                           className={`shrink-0 h-6 w-6 flex items-center justify-center p-0 border-0 text-white font-bold ${indexBadgeBg}`}
                                         >
                                           {componentLabel}
                                         </Badge>
                                       )}
                                       <p className="text-sm flex-1 leading-relaxed">{suggestion.explanation}</p>
                                     </div>
                                   </div>
                                 </PopoverTrigger>
                                 {relatedComponent && (
                                   <PopoverContent className="w-96" side="right" align="start">
                                     <div className="space-y-3">
                                       <div className="flex items-center gap-2">
                                         {componentLabel && (
                                           <Badge 
                                             variant="outline"
                                             className="h-6 w-6 flex items-center justify-center p-0 border-orange-400 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 font-bold"
                                           >
                                             {componentLabel}
                                           </Badge>
                                         )}
                                         <h4 className="font-semibold text-sm">Conclusión relacionada</h4>
                                       </div>
                                       <p className="text-sm bg-muted/50 p-3 rounded border leading-relaxed">
                                         "{relatedComponent.text}"
                                       </p>
                                     </div>
                                   </PopoverContent>
                                 )}
                               </Popover>
                             );
                           })}
                         </div>
                       </div>
                     );
                   })()}
                 </div>
               ) : (
                 <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 p-8 border-dashed border-2 rounded-lg h-full">
                   <Lightbulb className="h-8 w-8 text-yellow-500" />
                   <div className="text-center space-y-1">
                     <p className="font-semibold">No hay sugerencias disponibles</p>
                     <p className="text-sm">No se generaron sugerencias de mejora para este texto.</p>
                   </div>
                 </div>
               )
             ) : (
                 <div className="text-muted-foreground flex items-center justify-center gap-2 p-8 border-dashed border-2 rounded-lg h-full">
                   <AlertCircle className="h-5 w-5" />
                   <span>Las sugerencias aparecerán aquí después del análisis.</span>
                 </div>
               )
             }
             </CardContent>
             {analysisResult && (
               <CardFooter className="border-t pt-3 flex items-center justify-between text-sm text-muted-foreground">
                 <span>
                   Total: {analysisResult.suggestions.length} sugerencias
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

       {/* Paragraph Evaluation Section */}
       {analysisResult && (
         <Card className="shadow-lg border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BarChart className="h-5 w-5 text-primary" />
               Evaluación Argumentativa por Párrafo
             </CardTitle>
             <CardDescription>
               Análisis de la fuerza argumentativa de cada párrafo
             </CardDescription>
           </CardHeader>
           <CardContent>
             {analysisResult.paragraph_analysis && analysisResult.paragraph_analysis.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {analysisResult?.paragraph_analysis?.map((para, idx) => {
                 const getStrengthColor = (strength: string) => {
                   switch (strength) {
                     case 'muy fuerte':
                       return 'bg-green-500 text-white hover:bg-green-600';
                     case 'fuerte':
                       return 'bg-blue-500 text-white hover:bg-blue-600';
                     case 'moderada':
                       return 'bg-yellow-500 text-white hover:bg-yellow-600';
                     case 'débil':
                       return 'bg-red-500 text-white hover:bg-red-600';
                     default:
                       return 'bg-gray-500 text-white hover:bg-gray-600';
                   }
                 };

                 const getProgressColor = (score: number) => {
                   if (score >= 70) return 'bg-green-500';
                   if (score >= 50) return 'bg-blue-500';
                   if (score >= 30) return 'bg-yellow-500';
                   return 'bg-red-500';
                 };

                 return (
                   <div key={idx} className="border-2 rounded-lg p-4 hover:border-primary hover:opacity-75 transition-colors">
                     <div className="flex items-center justify-between mb-3">
                       <Badge variant="outline" className="font-semibold">
                         <FileText className="h-3 w-3 mr-1" />
                         Párrafo {idx + 1}
                       </Badge>
                       <Badge className={getStrengthColor(para.strength)}>
                         <TrendingUp className="h-3 w-3 mr-1" />
                         {para.strength.charAt(0).toUpperCase() + para.strength.slice(1)}
                       </Badge>
                     </div>
                     
                     <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                       {para.text}
                     </p>
                     
                     <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                       <div className="flex items-center gap-1">
                         <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                           {para.premises_count} premisas
                         </Badge>
                       </div>
                       <div className="flex items-center gap-1">
                         <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 border-orange-200">
                           {para.conclusions_count} conclusiones
                         </Badge>
                       </div>
                       <div className="text-muted-foreground flex items-center gap-1">
                         <span>{para.word_count} palabras</span>
                       </div>
                       <div className="text-muted-foreground flex items-center gap-1">
                         <span>{Number((para.density * 100).toFixed(1)) + '% densidad'}</span>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       <div className="flex items-center justify-between text-xs">
                         <span className="text-muted-foreground font-medium">Fuerza argumentativa</span>
                         <span className="font-semibold">{para.strength_score} de 100</span>
                       </div>
                       <div className="relative">
                         <Progress value={para.strength_score} className="h-2" />
                         <div 
                           className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(para.strength_score)}`}
                           style={{ width: para.strength_score + '%' }}
                         />
                       </div>
                     </div>
                     
                     {para.recommendation && (
                       <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs opacity-90">
                         <p className="flex items-start gap-2">
                           <Lightbulb className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                           <span className="text-blue-700 dark:text-blue-300">{para.recommendation}</span>
                         </p>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
             ) : (
               <div className="text-center py-8 text-muted-foreground">
                 <BarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p>No hay evaluación de párrafos disponible</p>
               </div>
             )}
           </CardContent>
         </Card>
       )}

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
                               if (analysis) {
                                 // Parsear el spec para obtener el texto original y sugerencias
                                 let specData: any = null;
                                 let originalText = message.content;
                                 let specSuggestions: any[] = [];
                                 let specParagraphAnalysis: any[] = [];
                                 
                                 if (analysis.spec) {
                                   try {
                                     specData = typeof analysis.spec === 'string' 
                                       ? JSON.parse(analysis.spec) 
                                       : analysis.spec;
                                     
                                     // Obtener texto original del spec
                                     if (specData.original_text) {
                                       originalText = specData.original_text;
                                     } else if (specData.text) {
                                       originalText = specData.text;
                                     }
                                     
                                     // Obtener sugerencias del spec
                                     if (specData.suggestions && Array.isArray(specData.suggestions)) {
                                       specSuggestions = specData.suggestions;
                                     }
                                     
                                     // Obtener evaluación por párrafo del spec
                                     if (specData.paragraph_analysis && Array.isArray(specData.paragraph_analysis)) {
                                       specParagraphAnalysis = specData.paragraph_analysis;
                                     }
                                   } catch (e) {
                                     // Error parseando spec
                                   }
                                 }
                                 
                                 // Cargar texto en el editor
                                 const paragraphs = originalText.split(/\n\n+/);
                                 const content = paragraphs
                                   .map(para => {
                                     const lines = para.split('\n').filter(line => line.trim());
                                     if (lines.length === 0) return '';
                                     if (lines.length === 1) return `<p>${lines[0]}</p>`;
                                     return `<p>${lines.join('<br>')}</p>`;
                                   })
                                   .filter(p => p)
                                   .join('');
                                 setText(content);
                                 
                                 if (editorRef.current) {
                                   editorRef.current.commands.setContent(content);
                                 }
                                 
                                 // Procesar componentes
                                 const premises = analysis.components?.filter((c: any) => {
                                   const type = c.component_type?.toUpperCase?.() || c.component_type;
                                   return type === 'PREMISE';
                                 }).map((c: any) => ({
                                   type: 'premise' as const,
                                   text: c.text,
                                   tokens: c.tokens || [],
                                   start_pos: c.start_pos,
                                   end_pos: c.end_pos
                                 })) || [];
                                 
                                 const conclusions = analysis.components?.filter((c: any) => {
                                   const type = c.component_type?.toUpperCase?.() || c.component_type;
                                   return type === 'CONCLUSION';
                                 }).map((c: any) => ({
                                   type: 'conclusion' as const,
                                   text: c.text,
                                   tokens: c.tokens || [],
                                   start_pos: c.start_pos,
                                   end_pos: c.end_pos
                                 })) || [];
                                 
                                 // Usar sugerencias del spec si están disponibles
                                 const rawSuggestions = specSuggestions.length > 0 ? specSuggestions : (analysis.suggestions || []);
                                 
                                 const suggestions = rawSuggestions.map((s: any) => {
                                   const type = s.component_type?.toLowerCase();
                                   let componentIndex = -1;
                                   
                                   if (type === 'premise') {
                                     componentIndex = premises.findIndex(
                                       (p: any) => p.text.trim() === s.original_text?.trim()
                                     );
                                   } else if (type === 'conclusion') {
                                     const conclusionIndex = conclusions.findIndex(
                                       (c: any) => c.text.trim() === s.original_text?.trim()
                                     );
                                     if (conclusionIndex >= 0) {
                                       componentIndex = premises.length + conclusionIndex;
                                     }
                                   }
                                   
                                   return {
                                     component_type: (type === 'premise' || type === 'conclusion' ? type : 'premise') as 'premise' | 'conclusion',
                                     original_text: s.original_text || '',
                                     suggestion: s.suggestion || s.suggestion_text || '',
                                     explanation: s.explanation || '',
                                     applied: s.applied || false,
                                     component_index: componentIndex >= 0 ? componentIndex : undefined
                                   };
                                 });
                                 
                                 // Procesar paragraph_analysis si existe
                                 const paragraphAnalysis = specParagraphAnalysis.length > 0 
                                   ? specParagraphAnalysis.map((p: any, idx: number) => ({
                                       paragraph_index: idx,
                                       text: p.text || '',
                                       strength: p.strength || 'débil',
                                       premises_count: p.premises_count || 0,
                                       conclusions_count: p.conclusions_count || 0,
                                       word_count: p.word_count || 0,
                                       density: p.density || 0,
                                       strength_score: p.strength_score || 0,
                                       recommendation: p.recommendation || undefined
                                     }))
                                   : undefined;
                                 
                                 const result: AnalysisResult = {
                                   premises,
                                   conclusions,
                                   suggestions,
                                   total_premises: analysis.total_premises || premises.length,
                                   total_conclusions: analysis.total_conclusions || conclusions.length,
                                   analyzed_at: analysis.analyzed_at,
                                   paragraph_analysis: paragraphAnalysis
                                 };
                                 
                                 setAnalysisResult(result);
                                 const dateString = analysis.analyzed_at || analysis.created_at;
                                 const analyzedDate = new Date(dateString);
                                 setLastAnalyzed(analyzedDate);
                                 setLastAnalyzedText(originalText);
                                 setShowHighlights(false); // No aplicar highlights automáticamente
                               } else {
                                 // Si no hay análisis, solo cargar el texto
                                 const paragraphs = message.content.split(/\n\n+/);
                                 const content = paragraphs
                                   .map(para => {
                                     const lines = para.split('\n').filter(line => line.trim());
                                     if (lines.length === 0) return '';
                                     if (lines.length === 1) return `<p>${lines[0]}</p>`;
                                     return `<p>${lines.join('<br>')}</p>`;
                                   })
                                   .filter(p => p)
                                   .join('');
                                 setText(content);
                                 
                                 if (editorRef.current) {
                                   editorRef.current.commands.setContent(content);
                                 }
                                 
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
 