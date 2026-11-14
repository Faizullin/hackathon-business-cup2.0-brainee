/** Local configuration for the report tooling ported from game-store-planning. */
export const settings = {
  defaultModule: "scaffold",
  baseUrl: "http://127.0.0.1:3123",
  locale: "ru",
  localeId: "ru-RU",
  auth: null,
};

export const modules = {
  scaffold: {
    title: "Brainee: starter screens and navigation",
    scenario: "scripts/reports/scenarios/scaffold.json",
    routePrefix: "/",
    viewports: ["ipad", "phone"],
    localeLabel: "Russian",
    fixtures: {},
    staticAssets: {},
  },
  learning: {
    title: "Brainee: saved child learning loop",
    scenario: "scripts/reports/scenarios/learning.json",
    routePrefix: "/",
    viewports: ["ipad", "phone"],
    localeLabel: "Russian",
    fixtures: {},
    staticAssets: {},
  },
};

export function reportModule(id) {
  if (!Object.hasOwn(modules, id)) {
    throw new Error(`Unknown report module: ${id}. Choose ${Object.keys(modules).join(", ")}.`);
  }
  return { id, ...modules[id] };
}

export function resolveWorklist(module, worklist, env = process.env) {
  return JSON.parse(
    JSON.stringify(worklist).replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const spec = module.fixtures[name];
      if (!spec) throw new Error(`Unknown ${module.id} fixture: ${name}`);
      const value = env[spec.env] ?? spec.fallback;
      if (!/^[1-9]\d*$/.test(value)) {
        throw new Error(`Set ${spec.env} to a positive fixture ID; see docs/reports/README.md.`);
      }
      return value;
    }),
  );
}
