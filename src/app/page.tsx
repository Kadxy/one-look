import CreateForm from "@/components/CreateForm";
import { GithubIcon } from "@/components/icons/GithubIcon";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center pt-32 p-6 overflow-hidden bg-black text-zinc-200">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 pb-4">
            One-Look
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl font-medium animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100 font-mono">
            Share secrets securely.&nbsp;
            <span className="text-zinc-200 decoration-zinc-500 underline underline-offset-4 decoration-2">
              Burn forever after one look.
            </span>
          </p>
        </div>

        <div className="w-full animate-in fade-in zoom-in-95 duration-700 delay-200">
          <CreateForm />
        </div>
      </div>

      <div className="fixed top-8 right-8 z-10 hidden md:block">
        <a
          href="https://github.com/Kadxy/one-look"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <GithubIcon size={16} className="text-zinc-500 group-hover:text-zinc-200 transition-colors duration-300" />
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-100 transition-colors duration-300 tracking-wide">Kadxy/One-Look</span>
        </a>
      </div>
    </main>
  );
}