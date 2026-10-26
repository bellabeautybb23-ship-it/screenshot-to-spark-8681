// Lógica de análise ATS 100% no navegador (simula uma IA com heurísticas simples).

// Palavras irrelevantes (pt + en) que não contam como keyword
const STOPWORDS = new Set(
  `a o as os um uma uns umas de da do das dos em no na nos nas por para com sem sob sobre e ou mas que se como mais menos muito muita já não sim ser estar ter haver é são foi será seu sua seus suas nosso nossa você vocês ele ela eles elas isso isto aquele aquela entre até após ao aos à às pelo pela pelos pelas cada todo toda todos todas qualquer onde quando também bem boa bom ótimo ótima vaga empresa candidato candidata buscamos procuramos área time equipe trabalho trabalhar experiência conhecimento conhecimentos desejável diferencial requisitos responsabilidades atividades será irá nível anos ano forma etc além outros outras sua deve devem possuir the and or of to in for with on at by an be is are as from this that you we our your will have has can`.split(
    /\s+/,
  ),
);

// Termos multi-palavra comuns em vagas de tecnologia
const PHRASES = [
  "machine learning", "power bi", "react native", "node.js", "next.js", "banco de dados",
  "trabalho em equipe", "comunicação", "resolução de problemas", "inglês avançado",
  "métodos ágeis", "metodologias ágeis", "ci/cd", "clean code", "design system",
  "google cloud", "spring boot", "ux design", "ui design", "data science", "rest api",
];

const normalize = (s: string) => s.toLowerCase().normalize("NFC");

/** Extrai as N keywords mais relevantes da descrição da vaga. */
export function extractKeywords(jd: string, n = 20): string[] {
  const text = normalize(jd);
  const counts = new Map<string, number>();

  // Frases conhecidas valem mais
  for (const p of PHRASES) {
    const hits = text.split(p).length - 1;
    if (hits) counts.set(p, hits * 3);
  }

  const tokens = text.match(/[a-zà-ú0-9+#./-]+/gi) ?? [];
  for (let raw of tokens) {
    raw = raw.replace(/^[./-]+|[./-]+$/g, "");
    if (raw.length < 3 && !/^(c#|go|r|ai|ux|ui|qa)$/.test(raw)) continue;
    if (STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
    // Termos técnicos (com símbolos ou dígitos) recebem bônus
    const bonus = /[+#.]|\d/.test(raw) ? 2 : 1;
    counts.set(raw, (counts.get(raw) ?? 0) + bonus);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, n)
    .map(([k]) => k);
}

export interface Analysis {
  score: number;
  found: string[];
  missing: string[];
  suggestions: string[];
}

/** Compara currículo × vaga e retorna o Match Score. */
export function analyze(resume: string, jd: string): Analysis {
  const keywords = extractKeywords(jd);
  const cv = normalize(resume);
  const found = keywords.filter((k) => cv.includes(k));
  const missing = keywords.filter((k) => !cv.includes(k));
  const score = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;

  const suggestions: string[] = [];
  if (missing.length) suggestions.push(`Inclua naturalmente: ${missing.slice(0, 5).join(", ")}.`);
  if (!/resumo|sobre mim|objetivo|summary/i.test(resume))
    suggestions.push("Adicione uma seção 'Resumo Profissional' no topo.");
  if (!/experi[eê]ncia/i.test(resume)) suggestions.push("Use o título padrão 'Experiência Profissional'.");
  if (!/forma[çc][ãa]o|educa[çc][ãa]o/i.test(resume)) suggestions.push("Inclua a seção 'Formação Acadêmica'.");
  if (/[│┃|\t]{2,}/.test(resume)) suggestions.push("Evite tabelas e colunas: o ATS lê linha a linha.");
  if (!/\d+%|\d+\s?(mil|k)/i.test(resume))
    suggestions.push("Quantifique resultados (ex.: 'reduzi o tempo de entrega em 30%').");
  suggestions.push("Salve em PDF de texto simples, sem imagens, ícones ou gráficos.");

  return { score, found, missing, suggestions };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Reescreve o currículo em estrutura ATS-friendly, incorporando keywords faltando. */
export function optimize(resume: string, missing: string[]): string {
  // Remove caracteres de tabela/colunas e símbolos decorativos
  const clean = resume
    .replace(/[│┃|•●▪■★☆✓✔→➤]/g, "-")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  const lines = clean.split("\n").map((l) => l.trim());
  const name = lines.find((l) => l.length > 0) ?? "Seu Nome";
  const body = lines.slice(lines.indexOf(name) + 1).join("\n").trim();

  const skills = missing.map(cap);
  const summaryKw = missing.slice(0, 4).join(", ");

  return [
    name.toUpperCase(),
    "",
    "RESUMO PROFISSIONAL",
    `Profissional orientado a resultados${summaryKw ? `, com conhecimento em ${summaryKw}` : ""}, buscando contribuir com entregas de qualidade e aprendizado contínuo.`,
    "",
    body,
    "",
    ...(skills.length
      ? ["COMPETÊNCIAS-CHAVE", ...skills.map((s) => `- ${s}`), ""]
      : []),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
