import Image from "next/image";
import Link from "next/link";
import { GithubIcon } from "@/components/icons/GithubIcon";

export function PageBackdrop() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <div className="signal-glow absolute inset-x-0 top-0 h-[34rem]" />
            <div className="signal-beam absolute left-1/2 top-0 h-[30rem] w-[46rem] -translate-x-1/2 sm:w-[68rem]" />
            <div className="precision-grid absolute inset-0" />
            <div className="axis-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2" />
            <div className="intro-light-sweep absolute left-1/2 top-20 h-28 w-[min(38rem,86vw)] -translate-x-1/2" />
            <div className="page-vignette absolute inset-0" />
        </div>
    );
}

export function BrandLink({ subtle = false }: { subtle?: boolean }) {
    return (
        <Link
            href="/"
            className={`focus-ring group inline-flex min-h-10 items-center gap-2.5 rounded-lg pr-2 text-[15px] font-semibold text-[var(--app-text)] transition-opacity ${subtle ? "opacity-70 hover:opacity-100" : ""}`}
        >
            <span className="brand-icon flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-[1.03]">
                <Image
                    src="/icon.webp"
                    draggable={false}
                    alt=""
                    width={32}
                    height={32}
                    className="object-cover"
                    priority
                />
            </span>
            <span>One-Look</span>
        </Link>
    );
}

export function SiteHeader({ subtle = false }: { subtle?: boolean }) {
    return (
        <header className="site-header relative z-20 mx-auto flex w-full max-w-3xl items-center justify-between pb-3 sm:pb-4">
            <BrandLink subtle={subtle} />
            <a
                href="https://github.com/Kadxy/one-look"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link focus-ring inline-flex min-h-10 items-center gap-2 rounded-md px-1.5 text-sm transition-colors"
                aria-label="View One-Look on GitHub"
            >
                <GithubIcon size={16} />
                <span>GitHub</span>
            </a>
        </header>
    );
}
