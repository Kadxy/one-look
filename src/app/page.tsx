import CreateForm from "@/components/CreateForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 selection:bg-pink-500/30 overflow-hidden">

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-bold text-xl tracking-tighter opacity-80">One-Look</div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <a
            href="https://github.com/kadxy/One-Look"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </nav>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 dark:opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/0 via-zinc-50/50 to-zinc-50/80 dark:from-black/0 dark:via-black/50 dark:to-black/80 pointer-events-none -z-10"></div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter ...">
            One-Look
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl font-medium animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
            Share secrets. <span className="text-zinc-900 dark:text-zinc-100 decoration-pink-500/50 underline underline-offset-4 decoration-2">Burn forever.</span>
          </p>
        </div>

        <div className="w-full animate-in fade-in zoom-in-95 duration-700 delay-200">
          <CreateForm />
        </div>
      </div>
    </main>
  );
}