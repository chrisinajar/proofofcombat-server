import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

type ExtractedRule = {
  id: string;
  whenCode: string;
  lines: string[];
};

type ExtractedPersona = {
  tavern: string;
  name?: string;
  tone?: string;
  rules: ExtractedRule[];
  fallback: string[];
};

function readSource(filePath: string): ts.SourceFile {
  const code = fs.readFileSync(filePath, "utf8");
  return ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
}

function isPropertyAssignment(
  p: ts.ObjectLiteralElementLike,
): p is ts.PropertyAssignment {
  return ts.isPropertyAssignment(p);
}

function getProp(
  obj: ts.ObjectLiteralExpression,
  key: string,
): ts.Expression | undefined {
  for (const p of obj.properties) {
    if (!isPropertyAssignment(p)) continue;
    const name = p.name;
    if (
      (ts.isIdentifier(name) && name.text === key) ||
      (ts.isStringLiteral(name) && name.text === key)
    ) {
      return p.initializer;
    }
  }
  return undefined;
}

function getStringLiteralValue(expr?: ts.Expression): string | undefined {
  if (!expr) return undefined;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }
  return undefined;
}

function reconstructTemplateLiteral(expr: ts.TemplateExpression): string {
  let out = "`" + expr.head.text;
  for (const span of expr.templateSpans) {
    out += "${" + span.expression.getText() + "}" + span.literal.text;
  }
  out += "`";
  return out;
}

function collectStrings(node: ts.Node, out: Set<string>) {
  function visit(n: ts.Node) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      out.add(n.text);
    } else if (ts.isTemplateExpression(n)) {
      out.add(reconstructTemplateLiteral(n));
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
}

function uniqueSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function extractRulesFromArray(
  arrExpr: ts.ArrayLiteralExpression,
  sf: ts.SourceFile,
): ExtractedRule[] {
  const rules: ExtractedRule[] = [];
  for (const el of arrExpr.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    const id = getStringLiteralValue(getProp(el, "id")) || "(no-id)";
    const whenExpr = getProp(el, "when");
    const whenCode = whenExpr ? whenExpr.getText(sf).trim() : "";
    const linesExpr = getProp(el, "lines");
    const lineSet = new Set<string>();
    if (linesExpr) {
      // lines is usually an arrow function
      collectStrings(linesExpr, lineSet);
    }
    rules.push({ id, whenCode, lines: uniqueSorted(Array.from(lineSet)) });
  }
  return rules;
}

function extractPersonas(sf: ts.SourceFile): ExtractedPersona[] {
  const personas: ExtractedPersona[] = [];

  // Find the variable named `personas`
  let personasDecl: ts.VariableDeclaration | undefined;
  sf.forEachChild((node) => {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations
    ) {
      for (const d of node.declarationList.declarations) {
        if (
          ts.isIdentifier(d.name) &&
          d.name.text === "personas" &&
          d.initializer &&
          ts.isObjectLiteralExpression(d.initializer)
        ) {
          personasDecl = d;
        }
      }
    }
  });

  if (!personasDecl || !personasDecl.initializer) return personas;
  const root = personasDecl.initializer as ts.ObjectLiteralExpression;

  for (const prop of root.properties) {
    if (!isPropertyAssignment(prop)) continue;
    const key = prop.name;
    const tavern = ts.isStringLiteral(key)
      ? key.text
      : ts.isIdentifier(key)
        ? key.text
        : key.getText(sf);
    if (!ts.isObjectLiteralExpression(prop.initializer)) continue;
    const obj = prop.initializer;

    const name = getStringLiteralValue(getProp(obj, "name"));
    const tone = getStringLiteralValue(getProp(obj, "tone"));

    const rulesExpr = getProp(obj, "rules");
    const rules =
      rulesExpr && ts.isArrayLiteralExpression(rulesExpr)
        ? extractRulesFromArray(rulesExpr, sf)
        : [];

    const fallbackExpr = getProp(obj, "fallback");
    const fallbackSet = new Set<string>();
    if (fallbackExpr) collectStrings(fallbackExpr, fallbackSet);

    personas.push({
      tavern,
      name,
      tone,
      rules,
      fallback: uniqueSorted(Array.from(fallbackSet)),
    });
  }

  return personas.sort((a, b) => a.tavern.localeCompare(b.tavern));
}

function extractGenericRules(sf: ts.SourceFile): ExtractedRule[] {
  // Find the variable named `genericRules`
  let decl: ts.VariableDeclaration | undefined;
  sf.forEachChild((node) => {
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (
          ts.isIdentifier(d.name) &&
          d.name.text === "genericRules" &&
          d.initializer &&
          ts.isArrayLiteralExpression(d.initializer)
        ) {
          decl = d;
        }
      }
    }
  });
  if (!decl || !decl.initializer) return [];
  return extractRulesFromArray(decl.initializer as ts.ArrayLiteralExpression, sf);
}

function mdEscape(text: string): string {
  return text.replace(/([*_`])/g, "\\$1");
}

async function generateBartenderAdviceMarkdown() {
  const advicePath = path.join(
    __dirname,
    "..",
    "schema",
    "quests",
    "text",
    "bartender-advice.ts",
  );

  const outDir = path.join(__dirname, "..", "docs");
  const outPath = path.join(outDir, "bartender-advice.md");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const sf = readSource(advicePath);

  const personas = extractPersonas(sf);
  const generic = extractGenericRules(sf);

  let md = "# Bartender Advice\n\n";
  md +=
    "This document is generated from the bartender advice rules. ‘When’ predicates are stringified for readability, and ‘Lines’ list the possible variants found in source.\n\n";

  for (const p of personas) {
    md += `## ${mdEscape(p.tavern)}\n`;
    if (p.name || p.tone) {
      const bits = [] as string[];
      if (p.name) bits.push(`Persona: ${mdEscape(p.name)}`);
      if (p.tone) bits.push(`Tone: ${mdEscape(p.tone)}`);
      md += `${bits.join(" — ")}\n`;
    }
    md += "\n";

    if (p.rules.length) {
      md += "### Rules\n\n";
      for (const r of p.rules) {
        md += `#### ${mdEscape(r.id)}\n\n`;
        if (r.whenCode) {
          md += "When:\n";
          md += "```ts\n" + r.whenCode + "\n```\n\n";
        }
        if (r.lines.length) {
          md += "Lines:\n";
          for (const line of r.lines) {
            md += `- ${line.startsWith("`") ? line : '"' + mdEscape(line) + '"'}\n`;
          }
          md += "\n";
        }
      }
    }

    if (p.fallback.length) {
      md += "### Fallback Lines\n\n";
      for (const line of p.fallback) {
        md += `- ${line.startsWith("`") ? line : '"' + mdEscape(line) + '"'}\n`;
      }
      md += "\n";
    }
  }

  if (generic.length) {
    md += "## Generic Rules\n\n";
    for (const r of generic) {
      md += `### ${mdEscape(r.id)}\n\n`;
      if (r.whenCode) {
        md += "When:\n";
        md += "```ts\n" + r.whenCode + "\n```\n\n";
      }
      if (r.lines.length) {
        md += "Lines:\n";
        for (const line of r.lines) {
          md += `- ${line.startsWith("`") ? line : '"' + mdEscape(line) + '"'}\n`;
        }
        md += "\n";
      }
    }
  }

  fs.writeFileSync(outPath, md, "utf8");
  console.log(`Bartender advice markdown generated at: ${outPath}`);
}

generateBartenderAdviceMarkdown().catch((err) => {
  console.error(err);
  process.exit(1);
});

