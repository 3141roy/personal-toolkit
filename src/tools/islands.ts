const modules = import.meta.glob<{ default: unknown }>('./*/[A-Z]*.svelte');

export function loadIsland(toolId: string) {
  const key = Object.keys(modules).find((path) => path.startsWith(`./${toolId}/`));
  if (!key) {
    throw new Error(`No island component found for tool "${toolId}"`);
  }
  return modules[key]();
}
