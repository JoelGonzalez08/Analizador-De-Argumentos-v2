
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import JoelG from "./JoelG.jpg";
import DrMiguelG from "./DrMiguelG.png";
import DrALopezL from "./DrALopezL.jpg";
import DrSamuel from "./DrSamuel.jpg";
import Link from "next/link";

const teamMembers = [
  {
    name: "Joel David González Barros",
    role: "Universidad Tecnológica de Bolívar",
    location: "Cartagena de Indias, Colombia",
    imageUrl: JoelG,
    imageHint: "man portrait",
    email: "joegonzalez@utb.edu.co",
    initials: "JG",
  },
  {
    name: "Dr. Jesús Miguel García-Gorrostieta",
    role: "Universidad de la Sierra",
    location: "Sonora, México",
    imageUrl: DrMiguelG,
    imageHint: "man portrait",
    email: "jgarcia@unisierra.edu.mx",
    initials: "JG",
  },
  {
    name: "Dr. Aurelio López-López",
    role: "Instituto Nacional de Astrofísica, Óptica y Electrónica",
    location: "Puebla, México",
    imageUrl: DrALopezL,
    imageHint: "man portrait",
    email: "allopez@inaoep.mx",
    initials: "AL",
  },
  {
    name: "Dr. Samuel González-López",
    role: "Tecnológico Nacional de México Campus Nogales",
    location: "Nogales, Sonora, México",
    imageUrl: DrSamuel,
    imageHint: "man portrait",
    email: "samuel.gl@nogales.tecnm.mx",
    initials: "SG",
  },
];

export default function ContactPage() {
  return (
    <div className="flex-1 p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Nuestro Equipo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Este proyecto fue desarrollado por un equipo de investigadores dedicados a la innovación
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card 
              key={member.name} 
              className="group relative overflow-hidden flex flex-col items-center text-center p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50"
            >
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex flex-col items-center w-full">
                {/* Avatar with ring animation */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <Avatar className="relative h-32 w-32 border-4 border-background shadow-xl ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                    <AvatarImage 
                      src={member.imageUrl.src} 
                      alt={member.name} 
                      data-ai-hint={member.imageHint} 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-blue-600 text-white">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="space-y-3 w-full">
                  <h3 className="font-bold text-xl group-hover:text-primary transition-colors duration-300">
                    {member.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary/80 leading-relaxed">
                      {member.role}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {member.location}
                    </p>
                  </div>

                  {/* Email button */}
                  <Link 
                    href={`mailto:${member.email}`} 
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all duration-300 group/email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/email:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contactar
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
