#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { access, chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";

const modules = [
  { id: "execplans", label: "ExecPlan workflow", recommended: true },
  { id: "vite-plus", label: "Vite+ command gateway", recommended: true },
  { id: "tanstack-start", label: "TanStack Start app scaffold", recommended: false },
  { id: "playwright-pom", label: "Playwright POM E2E scaffold", recommended: false },
  { id: "testcontainers-e2e", label: "Testcontainers parallel E2E support", recommended: false },
  { id: "review-toolchain", label: "similarity-ts, Knip, dependency-cruiser", recommended: true },
  { id: "commit-governance", label: "commitlint hook and frequent commits", recommended: true },
];

const moduleIds = new Set(modules.map((module) => module.id));

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const root = process.cwd();
const selectedModules = args.modules.length > 0 ? args.modules : await promptForModules();
const notes = args.notes ?? (args.modules.length > 0 ? "" : await promptForNotes());
const appDir = args.appDir ? path.resolve(root, args.appDir) : undefined;
const appDirRelative = args.appDir ? normalizePath(args.appDir) : undefined;
const packageName = args.packageName ?? guessPackageName(appDirRelative);

validateModules(selectedModules);

const state = {
  root,
  dryRun: args.dryRun,
  notes: [],
  writes: [],
};

await applyModules(selectedModules, {
  appDir,
  appDirRelative,
  packageName,
  notes,
  state,
});

await writeSetupNotes(state);

printSummary(state);

function parseArgs(argv) {
  const parsed = {
    appDir: undefined,
    dryRun: false,
    help: false,
    modules: [],
    notes: undefined,
    packageName: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg === "--all") {
      parsed.modules = modules.map((module) => module.id);
      continue;
    }
    if (arg.startsWith("--modules=")) {
      parsed.modules = splitList(arg.slice("--modules=".length));
      continue;
    }
    if (arg === "--modules") {
      parsed.modules = splitList(readRequired(argv, (index += 1), "--modules"));
      continue;
    }
    if (arg.startsWith("--app-dir=")) {
      parsed.appDir = arg.slice("--app-dir=".length);
      continue;
    }
    if (arg === "--app-dir") {
      parsed.appDir = readRequired(argv, (index += 1), "--app-dir");
      continue;
    }
    if (arg.startsWith("--package-name=")) {
      parsed.packageName = arg.slice("--package-name=".length);
      continue;
    }
    if (arg === "--package-name") {
      parsed.packageName = readRequired(argv, (index += 1), "--package-name");
      continue;
    }
    if (arg.startsWith("--notes=")) {
      parsed.notes = arg.slice("--notes=".length);
      continue;
    }
    if (arg === "--notes") {
      parsed.notes = readRequired(argv, (index += 1), "--notes");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function readRequired(argv, index, flag) {
  const value = argv[index];
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function promptForModules() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("Select environment modules. Press Enter for recommended modules.");
    for (const [index, module] of modules.entries()) {
      const mark = module.recommended ? "x" : " ";
      console.log(`  ${index + 1}. [${mark}] ${module.id} - ${module.label}`);
    }
    const answer = await rl.question("Module ids or numbers, comma-separated: ");
    if (!answer.trim()) {
      return modules.filter((module) => module.recommended).map((module) => module.id);
    }
    return splitList(answer).map((token) => {
      const number = Number(token);
      if (Number.isInteger(number) && number >= 1 && number <= modules.length) {
        return modules[number - 1].id;
      }
      return token;
    });
  } finally {
    rl.close();
  }
}

async function promptForNotes() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question("Natural-language requirements or project notes (optional): ");
  } finally {
    rl.close();
  }
}

function validateModules(selected) {
  for (const module of selected) {
    if (!moduleIds.has(module)) {
      throw new Error(`Unknown module "${module}". Known modules: ${modules.map((item) => item.id).join(", ")}`);
    }
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/apply-modern-webapp-environment.mjs [options]

Options:
  --modules <ids>       Comma-separated module ids.
  --all                 Select all modules.
  --app-dir <path>      App workspace path, for example apps/web.
  --package-name <name> Package name for app scripts, for example @scope/web.
  --notes <text>        Natural-language project requirements to include in AGENTS.
  --dry-run             Print planned writes without changing files.
  --help                Show this help.

Modules:
${modules.map((module) => `  ${module.id.padEnd(20)} ${module.label}`).join("\n")}
`);
}

async function applyModules(selected, context) {
  if (selected.includes("execplans")) {
    await applyExecPlans(context);
  }

  await applyAgentsSection(selected, context);

  if (selected.includes("vite-plus")) {
    await applyVitePlus(context);
  }
  if (selected.includes("commit-governance")) {
    await applyCommitGovernance(context);
  }
  if (selected.includes("review-toolchain")) {
    await applyReviewToolchain(context);
  }
  if (selected.includes("tanstack-start")) {
    await applyTanStackStart(context);
  }
  if (selected.includes("playwright-pom") || selected.includes("testcontainers-e2e")) {
    await applyE2e(selected, context);
  }
}

async function applyAgentsSection(selected, context) {
  const content = buildAgentsSection(selected, context);
  const file = path.join(root, "AGENTS.md");
  await replaceMarkedSection(file, "MODERN-WEBAPP-ENVIRONMENT", content, context.state);
}

function buildAgentsSection(selected, context) {
  const lines = [
    "# Modern Webapp Environment",
    "",
    "These rules were generated by the `modern-webapp-environment` skill. Keep enduring workflow rules here, architecture/API/data-model decisions in project specs, and task execution history in ExecPlans.",
    "",
  ];

  if (context.notes) {
    lines.push("## Project Notes", "", context.notes, "");
  }

  if (selected.includes("execplans")) {
    lines.push(
      "## ExecPlans",
      "",
      "When writing complex features or significant refactors, use an ExecPlan from `.agents/PLANS.md` from design through implementation.",
      "ExecPlan files live under `.agents/execplans/` and filenames must begin with the current UTC ISO datetime, for example `.agents/execplans/2026-06-05T170041Z_feature-name.md`.",
      "Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current at every stopping point.",
      "",
    );
  }

  if (selected.includes("vite-plus")) {
    lines.push(
      "## Vite+",
      "",
      "Use `vp` as the project command gateway. Run `vp install` after pulling dependency changes, `vp check` for format/lint/type validation, and `vp test` for project tests.",
      "Check `vite.config.ts` tasks and `package.json` scripts before inventing new commands. Run package tasks with `vp run <package>#<task>`.",
      "",
    );
  }

  if (selected.includes("tanstack-start")) {
    lines.push(
      "## TanStack Start",
      "",
      "Keep routes in `src/routes`, feature-local server functions in `src/features/<feature>/api/functions.ts`, and production dependency wiring next to those server functions in `api/dependencies.ts`.",
      "Put server-only dependencies behind `@tanstack/react-start/server-only` boundaries. Route files must not import database clients, secrets, or concrete side-effect adapters directly.",
      "",
    );
  }

  if (selected.includes("playwright-pom") || selected.includes("testcontainers-e2e")) {
    lines.push(
      "## E2E",
      "",
      "Use Playwright with Page Object Model classes under `tests/e2e/pages`, specs under `tests/e2e/specs`, and orchestration under `tests/e2e/support`.",
      "POM classes may drive page actions and page-local assertions, but must not create fixtures, seed databases, or call server functions.",
      "Keep E2E parallel-safe with dynamic loopback ports, per-run result directories, isolated Testcontainers databases, and project-specific seeded users when auth is involved.",
      "",
    );
  }

  if (selected.includes("review-toolchain")) {
    lines.push(
      "## Review Toolchain",
      "",
      "When reviewing or refactoring, run semantic similarity review and analyze the output before refactoring:",
      "",
      "```bash",
      "similarity-ts src --exclude routeTree.gen.ts --exclude components/ui --threshold 0.9 --types --classes --suggest",
      "```",
      "",
      "Run Knip through Vite+ and manually verify findings before deleting files or packages:",
      "",
      "```bash",
      "vp run knip",
      "```",
      "",
      "Use dependency-cruiser for explicit architecture boundaries when the app defines them. Prefer fixing dependency direction over adding broad ignores.",
      "",
    );
  }

  if (selected.includes("commit-governance")) {
    lines.push(
      "## Commit Governance",
      "",
      "Commit frequently after coherent milestones. Do not stage unrelated user changes. If the worktree is mixed, stage explicit file paths.",
      "Use conventional commit messages such as `docs(execplan): add setup plan`, `test(web): add e2e harness`, or `chore(tooling): add commitlint hook`.",
      "",
    );
  }

  lines.push(
    "## Validation Checklist",
    "",
    "- Run `vp check` when Vite+ is configured.",
    "- Run `vp test` for project tests.",
    "- Run focused package tasks with `vp run <package>#<task>`.",
    "- Run E2E when login, navigation, app routing, or critical browser flows change.",
    "- Record exact blockers when Docker/Testcontainers, Playwright browsers, or external services are unavailable.",
    "",
  );

  return lines.join("\n");
}

async function applyExecPlans(context) {
  await ensureDir(path.join(root, ".agents", "execplans"), context.state);
  await writeIfAbsent(path.join(root, ".agents", "execplans", ".gitkeep"), "", context.state);
  await writeIfAbsent(path.join(root, ".agents", "PLANS.md"), execPlansTemplate(), context.state);
}

async function applyVitePlus(context) {
  await updateRootPackageJson(context.state, (pkg) => {
    pkg.type ??= "module";
    pkg.scripts ??= {};
    pkg.scripts.ready ??= "vp run fmt && vp lint && vp run test -r && vp run build -r";
    pkg.devDependencies ??= {};
    pkg.devDependencies["vite-plus"] ??= "latest";
    pkg.devDependencies.jsdom ??= "latest";
  });

  await writeIfAbsent(path.join(root, "vite.config.ts"), rootViteConfigTemplate(), context.state);
}

async function applyCommitGovernance(context) {
  await updateRootPackageJson(context.state, (pkg) => {
    pkg.scripts ??= {};
    pkg.scripts.prepare ??= "git config core.hooksPath .vite-hooks || true";
    pkg.devDependencies ??= {};
    pkg.devDependencies["@commitlint/cli"] ??= "latest";
    pkg.devDependencies["@commitlint/config-conventional"] ??= "latest";
  });
  await writeIfAbsent(path.join(root, "commitlint.config.cjs"), commitlintTemplate(), context.state);
  await ensureDir(path.join(root, ".vite-hooks"), context.state);
  const hookPath = path.join(root, ".vite-hooks", "commit-msg");
  await writeIfChanged(hookPath, commitMsgHookTemplate(), context.state);
  if (!context.state.dryRun) {
    await chmod(hookPath, 0o755);
  }
}

async function applyReviewToolchain(context) {
  await updateRootPackageJson(context.state, (pkg) => {
    pkg.scripts ??= {};
    pkg.scripts.knip ??= "knip";
    if (context.packageName && context.appDirRelative) {
      const scriptName = `depcruise:${path.basename(context.appDirRelative)}`;
      pkg.scripts[scriptName] ??= `vp run ${context.packageName}#depcruise`;
    }
    pkg.devDependencies ??= {};
    pkg.devDependencies.knip ??= "latest";
    pkg.devDependencies["dependency-cruiser"] ??= "latest";
  });
  await writeIfAbsent(path.join(root, "knip.json"), knipTemplate(context), context.state);
  if (context.appDir) {
    await ensureDir(context.appDir, context.state);
    await writeIfAbsent(
      path.join(context.appDir, "dependency-cruiser.config.cjs"),
      dependencyCruiserTemplate(),
      context.state,
    );
    await updateJsonFile(path.join(context.appDir, "package.json"), context.state, (pkg) => {
      pkg.scripts ??= {};
      pkg.scripts.depcruise ??= "depcruise --config dependency-cruiser.config.cjs --output-type err src";
      pkg.devDependencies ??= {};
      pkg.devDependencies["dependency-cruiser"] ??= "latest";
    }, packageTemplate(context.packageName));
  }
}

async function applyTanStackStart(context) {
  requireAppDir(context, "tanstack-start");
  await updateJsonFile(path.join(context.appDir, "package.json"), context.state, (pkg) => {
    pkg.name ??= context.packageName;
    pkg.private ??= true;
    pkg.type ??= "module";
    pkg.imports ??= { "#/*": "./src/*" };
    pkg.scripts ??= {};
    pkg.scripts.dev ??= "vp dev --port 3000";
    pkg.scripts.build ??= "vp build";
    pkg.scripts.preview ??= "vp preview --port 3000";
    pkg.scripts.test ??= "vp test";
    pkg.dependencies ??= {};
    pkg.dependencies["@tanstack/react-router"] ??= "latest";
    pkg.dependencies["@tanstack/react-start"] ??= "latest";
    pkg.dependencies["@tanstack/router-plugin"] ??= "latest";
    pkg.dependencies.react ??= "latest";
    pkg.dependencies["react-dom"] ??= "latest";
    pkg.dependencies.zod ??= "latest";
    pkg.devDependencies ??= {};
    pkg.devDependencies["@vitejs/plugin-react"] ??= "latest";
    pkg.devDependencies["@tailwindcss/vite"] ??= "latest";
    pkg.devDependencies.nitro ??= "latest";
    pkg.devDependencies.typescript ??= "latest";
    pkg.devDependencies.vite ??= "latest";
    pkg.devDependencies.vitest ??= "latest";
  }, packageTemplate(context.packageName));

  await writeIfAbsent(path.join(context.appDir, "vite.config.ts"), tanstackViteConfigTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "src", "router.tsx"), routerTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "src", "start.ts"), startTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "src", "routes", "__root.tsx"), rootRouteTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "src", "routes", "index.tsx"), indexRouteTemplate(), context.state);
}

async function applyE2e(selected, context) {
  requireAppDir(context, selected.includes("testcontainers-e2e") ? "testcontainers-e2e" : "playwright-pom");
  await updateJsonFile(path.join(context.appDir, "package.json"), context.state, (pkg) => {
    pkg.scripts ??= {};
    pkg.scripts.e2e ??= "vp exec tsx tests/e2e/support/run-playwright.ts";
    pkg.devDependencies ??= {};
    pkg.devDependencies["@playwright/test"] ??= "latest";
    pkg.devDependencies.tsx ??= "latest";
    if (selected.includes("testcontainers-e2e")) {
      pkg.devDependencies.pg ??= "latest";
      pkg.devDependencies.testcontainers ??= "latest";
      pkg.devDependencies["@types/pg"] ??= "latest";
    }
  }, packageTemplate(context.packageName));

  await writeIfAbsent(path.join(context.appDir, "playwright.config.ts"), playwrightConfigTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "tests", "support", "ports.ts"), portsTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "tests", "e2e", "support", "run-playwright.ts"), runPlaywrightTemplate(), context.state);
  await writeIfAbsent(
    path.join(context.appDir, "tests", "e2e", "support", "test-server.ts"),
    testServerTemplate(selected.includes("testcontainers-e2e")),
    context.state,
  );
  await writeIfAbsent(path.join(context.appDir, "tests", "e2e", "pages", "home-page.ts"), homePageTemplate(), context.state);
  await writeIfAbsent(path.join(context.appDir, "tests", "e2e", "specs", "smoke.spec.ts"), smokeSpecTemplate(), context.state);
  if (selected.includes("testcontainers-e2e")) {
    await writeIfAbsent(path.join(context.appDir, "tests", "support", "postgres.ts"), postgresTemplate(), context.state);
  }
}

function requireAppDir(context, moduleName) {
  if (!context.appDir) {
    throw new Error(`${moduleName} requires --app-dir <path>.`);
  }
}

async function updateRootPackageJson(state, mutate) {
  await updateJsonFile(path.join(root, "package.json"), state, mutate, {
    name: path.basename(root),
    private: true,
    type: "module",
    scripts: {},
  });
}

async function updateJsonFile(file, state, mutate, fallback) {
  const existing = await readIfExists(file);
  let json = fallback ?? {};
  if (existing) {
    try {
      json = JSON.parse(existing);
    } catch (error) {
      state.notes.push(`Could not parse ${relative(file)} as JSON: ${error.message}. Left it unchanged.`);
      return;
    }
  }
  mutate(json);
  await writeIfChanged(file, `${JSON.stringify(json, null, 2)}\n`, state);
}

async function replaceMarkedSection(file, marker, content, state) {
  const begin = `<!-- ${marker}:BEGIN -->`;
  const end = `<!-- ${marker}:END -->`;
  const section = `${begin}\n${content.trim()}\n${end}\n`;
  const existing = await readIfExists(file);
  if (!existing) {
    await writeIfChanged(file, `${section}`, state);
    return;
  }

  if (existing.includes(begin) && existing.includes(end)) {
    const before = existing.slice(0, existing.indexOf(begin));
    const after = existing.slice(existing.indexOf(end) + end.length).replace(/^\n+/, "");
    await writeIfChanged(file, `${before}${section}${after}`, state);
    return;
  }

  await writeIfChanged(file, `${existing.replace(/\s*$/, "\n\n")}${section}`, state);
}

async function writeIfAbsent(file, content, state) {
  const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
  const existing = await readIfExists(file);
  if (existing !== undefined) {
    if (existing === normalizedContent) {
      return;
    }
    state.notes.push(`Kept existing ${relative(file)}. Review it against the selected module reference.`);
    return;
  }
  await writeIfChanged(file, normalizedContent, state);
}

async function writeIfChanged(file, content, state) {
  const normalizedContent = content.endsWith("\n") ? content : `${content}\n`;
  const existing = await readIfExists(file);
  if (existing === normalizedContent) {
    return;
  }
  state.writes.push(relative(file));
  if (state.dryRun) {
    return;
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, normalizedContent, "utf8");
}

async function ensureDir(dir, state) {
  if (await exists(dir)) {
    return;
  }
  state.writes.push(`${relative(dir)}/`);
  if (!state.dryRun) {
    await mkdir(dir, { recursive: true });
  }
}

async function writeSetupNotes(state) {
  if (state.notes.length === 0) {
    return;
  }
  const file = path.join(root, ".agents", "environment-setup-notes.md");
  const content = [
    "# Environment Setup Notes",
    "",
    "Generated by modern-webapp-environment.",
    "",
    ...state.notes.map((note) => `- ${note}`),
    "",
  ].join("\n");
  await writeIfChanged(file, content, state);
}

function printSummary(state) {
  const verb = state.dryRun ? "Would write" : "Wrote";
  console.log(`${verb} ${state.writes.length} path(s):`);
  for (const file of [...new Set(state.writes)].sort()) {
    console.log(`  - ${file}`);
  }
  if (state.notes.length > 0) {
    console.log("Notes:");
    for (const note of state.notes) {
      console.log(`  - ${note}`);
    }
  }
}

async function readIfExists(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function relative(file) {
  return normalizePath(path.relative(root, file));
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function guessPackageName(appDirRelative) {
  if (!appDirRelative) {
    return undefined;
  }
  return `@app/${path.basename(appDirRelative)}`;
}

function packageTemplate(name) {
  return {
    name,
    private: true,
    type: "module",
    imports: { "#/*": "./src/*" },
    scripts: {},
  };
}

function execPlansTemplate() {
  return `# Codex Execution Plans (ExecPlans)

This document describes the requirements for an execution plan ("ExecPlan"), a design document that a coding agent can follow to deliver a working feature or system change. Treat the reader as a complete beginner to this repository: they have only the current working tree and the single ExecPlan file you provide.

## Requirements

- Every ExecPlan must be fully self-contained.
- Every ExecPlan is a living document and must be updated as progress is made, discoveries occur, and decisions are finalized.
- Every ExecPlan must enable a complete novice to implement the feature end-to-end without prior knowledge of this repo.
- Every ExecPlan must produce demonstrably working behavior, not merely code changes.
- Every term of art must be defined in plain language.

## Formatting

When writing an ExecPlan to a Markdown file, save it in .agents/execplans/. The filename must begin with the current UTC ISO datetime followed by a descriptive name, for example .agents/execplans/2026-06-05T170041Z_feature-name.md.

An ExecPlan must contain and maintain these sections:

- Purpose / Big Picture
- Progress
- Surprises & Discoveries
- Decision Log
- Outcomes & Retrospective
- Context and Orientation
- Plan of Work
- Concrete Steps
- Validation and Acceptance
- Idempotence and Recovery
- Artifacts and Notes
- Interfaces and Dependencies

## Progress

Use checkboxes with timestamps. Every stopping point must be represented.

## Decision Log

Record decisions in this form:

- Decision: ...
  Rationale: ...
  Date/Author: ...

## Validation

Validation is not optional. Include exact commands, working directory, expected observations, and evidence from successful or blocked runs.
`;
}

function rootViteConfigTemplate() {
  return `import { defineConfig } from "vite-plus";

const generatedIgnorePatterns = ["**/routeTree.gen.ts"];
const shadcnComponentIgnorePatterns = ["**/components/ui/**"];
const referenceIgnorePatterns = ["docs/references/**/*"];

export default defineConfig({
  fmt: {
    ignorePatterns: [
      ...generatedIgnorePatterns,
      ...shadcnComponentIgnorePatterns,
      ...referenceIgnorePatterns,
    ],
  },
  lint: {
    ignorePatterns: [
      ...generatedIgnorePatterns,
      ...shadcnComponentIgnorePatterns,
      ...referenceIgnorePatterns,
    ],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    passWithNoTests: true,
  },
});
`;
}

function commitlintTemplate() {
  return `module.exports = {
  extends: ["@commitlint/config-conventional"],
};
`;
}

function commitMsgHookTemplate() {
  return `#!/usr/bin/env sh
vp exec commitlint --edit "$1"
`;
}

function knipTemplate(context) {
  const appEntry = context.appDirRelative
    ? `
    "${context.appDirRelative}": {
      "entry": [
        "src/router.tsx",
        "src/routes/**/*.{ts,tsx}",
        "src/start.ts",
        "src/**/*.test.ts",
        "tests/e2e/specs/**/*.{ts,tsx}"
      ],
      "project": ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"]
    }`
    : "\n";
  return `{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "include": ["files", "unlisted"],
  "workspaces": {${appEntry}
  },
  "ignore": ["docs/references/**"],
  "vitest": {
    "config": ["vite.config.ts"]
  }
}
`;
}

function dependencyCruiserTemplate() {
  return `/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-does-not-import-routes",
      severity: "error",
      comment: "Domain/application code should not depend on route presentation modules.",
      from: { path: "^src/(domain|application|core)/", pathNot: "\\\\.test\\\\.tsx?$" },
      to: { path: "^src/routes/" },
    },
    {
      name: "domain-does-not-import-feature-composition",
      severity: "error",
      comment: "Composition roots own production side effects; application code receives dependencies.",
      from: { path: "^src/(domain|application|core)/", pathNot: "\\\\.test\\\\.tsx?$" },
      to: { path: "^src/features/[^/]+/api/(dependencies|functions)\\\\.ts$" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "node", "default"],
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
`;
}

function tanstackViteConfigTemplate() {
  return `import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"], tsconfigPaths: true },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
});
`;
}

function routerTemplate() {
  return `import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
`;
}

function startTemplate() {
  return `import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  requestMiddleware: [],
}));
`;
}

function rootRouteTemplate() {
  return `import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return <Outlet />;
}
`;
}

function indexRouteTemplate() {
  return `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <main><h1>App Ready</h1></main>;
}
`;
}

function playwrightConfigTemplate() {
  return `import { defineConfig, devices } from "@playwright/test";

const appPort = process.env.E2E_APP_PORT ?? "3100";
const appOrigin = process.env.E2E_APP_ORIGIN ?? \`http://127.0.0.1:\${appPort}\`;
const outputDir = process.env.E2E_TEST_RESULTS_DIR ?? "test-results";
const webServerTimeout = Number(process.env.E2E_WEB_SERVER_TIMEOUT_MS ?? 240_000);

export default defineConfig({
  testDir: "./tests/e2e/specs",
  outputDir,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: appOrigin,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "vp exec tsx tests/e2e/support/test-server.ts",
    url: appOrigin,
    reuseExistingServer: false,
    timeout: webServerTimeout,
  },
});
`;
}

function portsTemplate() {
  return `import { createServer } from "node:net";

export async function getAvailableLoopbackPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  if (!address || typeof address === "string") {
    throw new Error("Failed to allocate a loopback TCP port.");
  }
  return address.port;
}
`;
}

function runPlaywrightTemplate() {
  return `import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import { getAvailableLoopbackPort } from "../../support/ports";

const args = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === "--"));
const runId = process.env.E2E_RUN_ID ?? randomUUID();
const appPort = process.env.E2E_APP_PORT ?? String(await getAvailableLoopbackPort());
const appOrigin = process.env.E2E_APP_ORIGIN ?? \`http://127.0.0.1:\${appPort}\`;
const testResultsDir = process.env.E2E_TEST_RESULTS_DIR ?? \`test-results/\${runId}\`;

const env = {
  ...process.env,
  E2E_RUN_ID: runId,
  E2E_APP_PORT: appPort,
  E2E_APP_ORIGIN: appOrigin,
  E2E_TEST_RESULTS_DIR: testResultsDir,
};

console.log(\`E2E run \${runId}: app=\${appOrigin}, results=\${testResultsDir}\`);

const child = spawn("vp", ["exec", "playwright", "test", "-c", "playwright.config.ts", ...args], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
`;
}

function testServerTemplate(withPostgres) {
  const imports = withPostgres
    ? `import { startPostgresTestDatabase, type PostgresTestDatabase } from "../../support/postgres";\n`
    : "";
  const dbDecl = withPostgres ? "let database: PostgresTestDatabase | undefined;\n" : "";
  const dbStart = withPostgres
    ? `  database = await startPostgresTestDatabase();\n  const env = createAppEnv(database.databaseUrl);\n`
    : "  const env = createAppEnv();\n";
  const dbEnvParam = withPostgres ? "databaseUrl?: string" : "";
  const dbEnvLine = withPostgres ? "    DATABASE_URL: databaseUrl,\n" : "";
  const dbCleanup = withPostgres ? "  await database?.stop();\n" : "";
  return `import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
${imports}
const appPort = readPortEnv("E2E_APP_PORT", 3100);
const appOrigin = process.env.E2E_APP_ORIGIN ?? \`http://127.0.0.1:\${appPort}\`;
const appServerMode = readAppServerMode();

let app: ChildProcess | undefined;
${dbDecl}
async function main() {
${dbStart}  app = await startAppServer(env);
  await waitForChildServerUrl(app, appOrigin, "E2E app server", { timeoutMs: 120_000 });
  await new Promise(() => {});
}

function createAppEnv(${dbEnvParam}): NodeJS.ProcessEnv {
  return {
    ...process.env,
${dbEnvLine}    E2E_APP_ORIGIN: appOrigin,
    NODE_ENV: "test",
  };
}

async function startAppServer(env: NodeJS.ProcessEnv): Promise<ChildProcess> {
  if (appServerMode === "development") {
    return spawn("vp", ["dev", "--host", "127.0.0.1", "--port", String(appPort)], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });
  }

  await spawnAndWait("vp", ["build"], { ...env, NODE_ENV: "production" });
  return spawn("vp", ["preview", "--host", "127.0.0.1", "--port", String(appPort), "--strictPort"], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
}

function readPortEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(\`\${name} must be a valid TCP port, got \${raw}.\`);
  }
  return port;
}

function readAppServerMode(): "production" | "development" {
  const raw = process.env.E2E_APP_SERVER_MODE ?? "production";
  if (raw === "production" || raw === "development") return raw;
  throw new Error(\`E2E_APP_SERVER_MODE must be "production" or "development", got \${JSON.stringify(raw)}.\`);
}

async function spawnAndWait(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env, stdio: "inherit" });
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(\`\${command} \${args.join(" ")} exited via \${signal}.\`));
      else if (code === 0) resolve();
      else reject(new Error(\`\${command} \${args.join(" ")} exited with code \${code ?? 1}.\`));
    });
    child.on("error", reject);
  });
}

async function waitForUrl(url: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return;
      lastError = new Error(\`HTTP \${response.status}\`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(\`Timed out waiting for \${url}: \${String(lastError)}\`);
}

async function waitForChildServerUrl(
  child: ChildProcess,
  url: string,
  label: string,
  options: { timeoutMs?: number } = {},
) {
  let cleanup = () => undefined;
  const exitPromise = new Promise<never>((_resolve, reject) => {
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      reject(new Error(\`\${label} exited before \${url} became ready: \${signal ?? code ?? 1}.\`));
    };
    const onError = (error: Error) => reject(new Error(\`\${label} failed: \${error.message}.\`));
    cleanup = () => {
      child.off("exit", onExit);
      child.off("error", onError);
    };
    child.once("exit", onExit);
    child.once("error", onError);
  });

  try {
    await Promise.race([waitForUrl(url, options.timeoutMs), exitPromise]);
  } finally {
    cleanup();
  }
}

async function cleanup() {
  app?.kill("SIGTERM");
${dbCleanup}}

process.on("SIGTERM", () => void cleanup().finally(() => process.exit(0)));
process.on("SIGINT", () => void cleanup().finally(() => process.exit(0)));
process.on("exit", () => app?.kill("SIGTERM"));

main().catch((error) => {
  console.error(error);
  void cleanup().finally(() => process.exit(1));
});
`;
}

function postgresTemplate() {
  return `import { Pool } from "pg";
import { GenericContainer, Wait } from "testcontainers";

const databaseImage = process.env.TEST_POSTGRES_IMAGE ?? "postgres:17";
const databaseName = "app_test";
const databaseUser = "test";
const databasePassword = "test";

export type PostgresTestDatabase = {
  databaseUrl: string;
  stop: () => Promise<void>;
};

export async function startPostgresTestDatabase(): Promise<PostgresTestDatabase> {
  const container = await new GenericContainer(databaseImage)
    .withEnvironment({
      POSTGRES_DB: databaseName,
      POSTGRES_PASSWORD: databasePassword,
      POSTGRES_USER: databaseUser,
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
    .withStartupTimeout(180_000)
    .start();

  const databaseUrl = \`postgres://\${databaseUser}:\${databasePassword}@\${container.getHost()}:\${container.getMappedPort(5432)}/\${databaseName}\`;

  await waitForPostgres(databaseUrl);

  return {
    databaseUrl,
    stop: async () => {
      await container.stop();
    },
  };
}

async function waitForPostgres(databaseUrl: string) {
  const deadline = Date.now() + 180_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query("select 1");
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      await pool.end().catch(() => undefined);
    }
  }
  throw new Error(\`Timed out waiting for PostgreSQL readiness: \${String(lastError)}\`);
}
`;
}

function homePageTemplate() {
  return `import { expect, type Page } from "@playwright/test";

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async expectReady() {
    await expect(this.page.getByRole("heading", { name: /app ready/i })).toBeVisible();
  }
}
`;
}

function smokeSpecTemplate() {
  return `import { test } from "@playwright/test";

import { HomePage } from "../pages/home-page";

test("home page loads", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.expectReady();
});
`;
}
