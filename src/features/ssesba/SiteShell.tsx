import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Landmark, Languages } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { copy, type Lang } from "@/lib/ssesba-data";

export function SiteShell({ lang, title, eyebrow, children }: { lang: Lang; title: string; eyebrow: string; children: ReactNode }) {
  const t = copy[lang]; const en = lang === "en"; const base = en ? "/en" : "/";
  return <div className="min-h-screen bg-background text-foreground" dir={en ? "ltr" : "rtl"}>
    <header className="border-b border-brand-gold/30 bg-brand-navy text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link to={base} className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-md border border-brand-gold text-brand-gold"><Landmark /></span><span><b className="block font-serif text-lg">SSESBA</b><small className="text-brand-gold-soft">GSCS Standard</small></span></Link>
        <nav className="hidden items-center gap-5 text-sm md:flex"><Link to={base}>{t.standard}</Link><Link to={en ? "/en/request" : "/request"}>{t.request}</Link><Link to={en ? "/en/assessment" : "/assessment"}>{t.assessment}</Link><Link to="/explorer">{t.explorer}</Link></nav>
        <Button asChild variant="outline" size="sm" className="border-brand-gold/60 bg-transparent text-primary-foreground hover:bg-brand-gold hover:text-brand-navy"><Link to={en ? location.pathname.replace(/^\/en/, "") || "/" : `/en${location.pathname === "/" ? "" : location.pathname}`}><Languages />{t.language}</Link></Button>
      </div>
    </header>
    <main><section className="border-b border-brand-gold/20 bg-brand-navy text-primary-foreground"><div className="mx-auto max-w-7xl px-5 py-14"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-soft">{eyebrow}</p><h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-6xl">{title}</h1></div></section>{children}</main>
    <footer className="mt-16 border-t bg-brand-navy text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm"><span>SSESBA · GSCS</span><Link to={base} className="flex items-center gap-2 text-brand-gold-soft">{en ? <ArrowLeft /> : <ArrowRight />}{t.back}</Link></div></footer>
  </div>;
}
