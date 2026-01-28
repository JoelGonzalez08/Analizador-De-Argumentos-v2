'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, CheckCircle, BrainCircuit, Sparkles, BookOpen, Users, TrendingUp, FileText } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleStartAnalysis = () => {
    if (user) {
      router.push('/analyzer');
    } else {
      router.push('/login?redirect=/analyzer');
    }
  };
  return (
    <div className="flex-1">
      {/* Hero Section with Gradient */}
      <section className="w-full pt-8 md:pt-16 pb-12 md:pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Analiza y Fortalece tus Argumentos con IA
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                  Nuestra herramienta de IA te ayuda a identificar premisas, conclusiones y a recibir recomendaciones para que tus textos sean más sólidos y persuasivos.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Button 
                  size="lg" 
                  onClick={handleStartAnalysis}
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {user ? 'Ir al Analizador' : 'Empezar Gratis'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/contact">
                    Conoce al Equipo
                  </a>
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
              <div className="absolute top-10 right-10 h-32 w-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute bottom-10 left-10 h-40 w-40 bg-secondary/10 rounded-full blur-2xl" />
              
              {/* Main mockup */}
              <div className="relative w-full max-w-lg space-y-4">
                {/* Editor Card */}
                <Card className="relative bg-card border-2 rounded-xl shadow-2xl p-6 space-y-4 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">Editor de Texto</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500/20" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                      <div className="h-3 w-3 rounded-full bg-green-500/20" />
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="leading-relaxed">
                      <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 rounded">Ya que la educación es fundamental</span>
                      {" "}para el desarrollo social,{" "}
                      <span className="bg-orange-500/20 text-orange-700 dark:text-orange-300 px-1 rounded">debemos invertir más recursos</span>
                      {" "}en este sector.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Badge style={{ backgroundColor: '#3b82f6', color: 'white' }} className="text-xs">1 PREMISA</Badge>
                    <Badge style={{ backgroundColor: '#f97316', color: 'white' }} className="text-xs">1 CONCLUSIÓN</Badge>
                  </div>
                </Card>

                {/* Components Card */}
                <Card className="relative bg-card border-2 rounded-xl shadow-xl p-4 space-y-3 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs">Componentes Identificados</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                      <p className="text-xs text-muted-foreground">La educación es fundamental...</p>
                    </div>
                    <div className="p-2 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                      <p className="text-xs text-muted-foreground">Debemos invertir más recursos...</p>
                    </div>
                  </div>
                </Card>

                {/* Suggestions Card */}
                <Card className="relative bg-card border-2 rounded-xl shadow-xl p-4 space-y-3 transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-xs">Sugerencias de Mejora</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                      <Badge style={{ backgroundColor: '#3b82f6', color: 'white' }} className="text-xs">PREMISA</Badge>
                      <p className="text-xs text-muted-foreground">
                        Considera reforzar esta premisa con datos estadísticos sobre el impacto de la educación...
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section className="w-full pt-16 md:pt-24 pb-16 md:pb-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm">Características Clave</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">¿Cómo Funciona?</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Nuestra plataforma simplifica el análisis de argumentos en tres sencillos pasos. Escribe, analiza y mejora.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl items-stretch gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3 mt-12">
            <Card className="flex flex-col border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  Paso 1: Análisis Automático
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground leading-relaxed">
                  Pega tu texto y nuestra IA identificará y resaltará automáticamente las premisas y conclusiones, dándote una visión clara de la estructura de tu argumento.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  Paso 2: Recomendaciones Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground leading-relaxed">
                  Recibe sugerencias personalizadas para fortalecer tu argumentación, como detectar falacias lógicas o añadir premisas que refuercen tus conclusiones.
                </p>
              </CardContent>
            </Card>
            <Card className="flex flex-col border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  Paso 3: Mejora Continua
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground leading-relaxed">
                  Utiliza el feedback para refinar tu texto. La herramienta te permite iterar rápidamente y ver cómo tus argumentos se vuelven más sólidos y efectivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full pt-16 md:pt-24 pb-16 md:pb-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm">Para Todos</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">¿Quién Puede Usarlo?</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Nuestra herramienta está diseñada para diferentes tipos de usuarios y contextos.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mejora tus ensayos, tesis y trabajos académicos con argumentos más sólidos y estructurados.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Profesionales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Perfecciona propuestas, informes y presentaciones con una argumentación clara y convincente.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Escritores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Refuerza la lógica de tus artículos, blogs y contenidos persuasivos para mayor impacto.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full pt-16 md:pt-24 pb-16 md:pb-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                ¿Listo para Mejorar tus Argumentos?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Únete a cientos de usuarios que ya están fortaleciendo sus textos con IA.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleStartAnalysis}
              className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              <span className="relative z-10 flex items-center">
                {user ? 'Ir al Analizador' : 'Comenzar Ahora - Es Gratis'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
