// SPDX-License-Identifier: AGPL-3.0-or-later
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = process.cwd();
const roots = [
  "frontend/app/src",
  "frontend/admin/src",
  "frontend/web/src",
  "backend/src",
];
function files(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : /\.(ts|tsx)$/.test(entry.name)
          ? [path.join(directory, entry.name)]
          : [],
    );
}
const errors = [];
const graph = new Map();
for (const file of roots.flatMap((directory) =>
  files(path.join(root, directory)),
)) {
  if (/\.spec\./.test(file) || file.includes("/test/")) continue;
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  const syntax = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = syntax.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier.text);
  function reject(message) {
    errors.push(`${relative}: ${message}`);
  }
  const isFrontend = relative.startsWith("frontend/");
  if (path.basename(file) === "index.ts")
    reject("Barrel files are not allowed");
  if (isFrontend) {
    if (/<select(?:\s|>)/.test(source))
      reject("Use Chakra NativeSelect for native select fields");
    if (
      imports.some(
        (value) =>
          value.startsWith("@quenda/admin") ||
          value.startsWith("@quenda/app") ||
          value.startsWith("@quenda/web") ||
          (value.startsWith(".") &&
            !path
              .resolve(path.dirname(file), value)
              .startsWith(
                path.join(root, ...relative.split(path.sep).slice(0, 2)) +
                  path.sep,
              )),
      )
    )
      reject("Frontend workspaces must not import each other");
    if (file.endsWith(".view.tsx")) {
      const exports = syntax.statements.filter(
        (node) =>
          ts.isFunctionDeclaration(node) &&
          node.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
          ),
      );
      if (exports.length !== 1)
        reject("Each view must export exactly one component");
      if (
        path.basename(path.dirname(file)) !== path.basename(file, ".view.tsx")
      )
        reject("A view must live in its homonymous folder");
      for (const imported of imports) {
        if (imported.startsWith("../")) reject("Views cannot import upward");
        if (
          /(repositories|queries)\//.test(imported) ||
          imported.includes("client/api-client")
        )
          reject("Views cannot access data layers");
        if (
          imported.endsWith(".view") &&
          !imported.startsWith("./components/") &&
          !imported.startsWith("@/components/")
        )
          reject("Views may only import descendant or shared components");
      }
    }
    if (
      file.endsWith(".controller.ts") &&
      imports.some(
        (value) =>
          value.includes("repositories/") ||
          value.includes("client/api-client"),
      )
    )
      reject("Controllers must use query/mutation hooks");
    if (
      relative.includes("/repositories/") &&
      imports.some((value) => /react|\/pages\/|\/queries\//.test(value))
    )
      reject("Repositories must remain independent of React and orchestration");
    if (
      relative.includes("/services/") &&
      imports.some((value) => /react|\/client\//.test(value))
    )
      reject("Domain services must be pure");
  } else {
    if (
      relative.includes("/domain/") &&
      imports.some((value) =>
        /nestjs|swagger|infrastructure|\bpg\b/.test(value),
      )
    )
      reject("Domain must not depend on adapters or frameworks");
    if (/\.(command|query)\.ts$/.test(file)) {
      if (/new Date\(|Temporal\.Now|randomUUID\(/.test(source))
        reject("Application operations must use Clock and IdGenerator");
      if (imports.some((value) => value.includes("/infrastructure/")))
        reject("Application must not depend on infrastructure");
    }
    if (file.endsWith(".controller.ts")) {
      const endpoints = source.match(/@(Get|Post|Put|Patch|Delete)\(/g) ?? [];
      if (endpoints.length !== 1)
        reject("Each controller must declare exactly one endpoint");
      if (!source.includes("@V2Controller("))
        reject("Use the shared v2 adapter");
      if (
        !source.includes('V2Controller("public/') &&
        !source.includes("V2Controller('public/") &&
        !source.includes("@UseGuards(PrincipalGuard)")
      )
        reject("Non-public controllers require the principal guard");
    }
  }
  const dependencies = imports
    .filter((value) => value.startsWith(".") || value.startsWith("@/"))
    .map((value) =>
      value.startsWith("@/")
        ? path.join(
            root,
            ...relative.split(path.sep).slice(0, 2),
            "src",
            value.slice(2),
          )
        : path.resolve(path.dirname(file), value),
    )
    .map((value) =>
      [".ts", ".tsx", ".d.ts"]
        .map((extension) => value + extension)
        .find((candidate) => fs.existsSync(candidate)),
    )
    .filter(Boolean);
  graph.set(file, dependencies);
}
const visited = new Set();
const active = new Set();
function visit(file) {
  if (active.has(file)) {
    errors.push(`Circular dependency at ${path.relative(root, file)}`);
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency);
  active.delete(file);
  visited.add(file);
}
for (const file of graph.keys()) visit(file);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Architecture verified across ${graph.size} modules.`);
