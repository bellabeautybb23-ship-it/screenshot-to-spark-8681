import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Copy, Download, Rocket, Sparkles, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyze, optimize, type Analysis } from "@/lib/ats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATS Boost — Currículo que passa no robô do RH" },
      { name: "description", content: "Compare seu currículo com a vaga, veja o Match Score e gere uma versão ATS-friendly." },
      { property: "og:title", content: "ATS Boost — Currículo que passa no robô do RH" },
      { property: "og:description", content: "Transforme seu currículo em um passe livre para a entrevista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Campo de texto com contador de caracteres */
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="min-h-64 rounded-xl bg-card border-border text-sm" />
      <span className="self-end text-xs text-muted-foreground">{value.length} caracteres</span>
    </label>
  );
}

/** Score circular (radial) */
function ScoreRing({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 70 ? "stroke-success" : score >= 40 ? "stroke-primary" : "stroke-destructive";
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} strokeWidth="10" className="fill-none stroke-muted" />
        <circle cx="60" cy="60" r={r} strokeWidth="10" strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c} className={`fill-none transition-all duration-700 ${color}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}%</span>
        <span className="text-xs text-muted-foreground">Match</span>
      </div>
    </div>
  );
}

function Index() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [optimized, setOptimized] = useState("");

  const runAnalysis = () => {
    if (resume.trim().length < 30 || jd.trim().length < 30) {
      toast.error("Cole o currículo e a descrição da vaga (mín. 30 caracteres cada).");
      return;
    }
    setResult(analyze(resume, jd));
    setOptimized("");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(optimized);
    toast.success("Currículo copiado!");
  };

  return (
    <div className="min-h-screen font-sans">
      <Toaster theme="dark" position="top-center" />
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-brand"><Rocket className="size-5 text-primary-foreground" /></div>
        <div>
          <p className="font-bold leading-tight">ATS Boost 🚀</p>
          <p className="text-xs text-muted-foreground">Seu currículo passando no robô</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="py-12 text-center md:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Seu currículo é <span className="text-gradient-brand">invisível</span> para o RH?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Transforme seu currículo em um passe livre para a entrevista.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Field label="Seu currículo atual" value={resume} onChange={setResume} placeholder="Cole aqui o texto do seu currículo..." />
          <Field label="Descrição da vaga" value={jd} onChange={setJd} placeholder="Cole aqui a descrição da vaga..." />
        </section>

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={runAnalysis} className="h-14 rounded-xl bg-gradient-brand px-10 text-base font-bold shadow-glow hover:opacity-90">
            <ScanSearch className="size-5" /> Analisar Compatibilidade
          </Button>
        </div>

        {result && (
          <section className="mt-12 rounded-xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
              <ScoreRing score={result.score} />
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-success">Keywords encontradas ({result.found.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.found.map((k) => <span key={k} className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs text-success">{k}</span>)}
                    {!result.found.length && <span className="text-xs text-muted-foreground">Nenhuma ainda.</span>}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-destructive">Keywords faltando ({result.missing.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing.map((k) => <span key={k} className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive">{k}</span>)}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Sugestões de melhoria</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.suggestions.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={() => setOptimized(optimize(resume, result.missing))} className="h-12 rounded-xl bg-gradient-brand px-8 font-bold shadow-glow hover:opacity-90">
                <Sparkles className="size-5" /> Gerar Versão Otimizada
              </Button>
            </div>
          </section>
        )}

        {optimized && (
          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-muted-foreground">Original</h3>
              <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{resume}</pre>
            </div>
            <div className="rounded-xl border border-primary/40 bg-card p-6 shadow-glow">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-primary">Otimizado (ATS-friendly)</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={copy}><Copy className="size-4" /> Copiar</Button>
                  <Button size="sm" onClick={() => window.print()}><Download className="size-4" /> Baixar PDF</Button>
                </div>
              </div>
              <div id="print-area" className="rounded-lg bg-paper p-5 text-paper-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{optimized}</pre>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Feito para quem busca primeiro emprego e vagas de tecnologia
      </footer>
    </div>
  );
}
