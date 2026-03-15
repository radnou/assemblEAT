import type { AssemblyRow } from '@/types';

const STORAGE_KEY = 'custom-assemblies';

export function getCustomAssemblies(): AssemblyRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AssemblyRow[];
  } catch {
    return [];
  }
}

export function saveCustomAssembly(assembly: AssemblyRow): void {
  if (typeof window === 'undefined') return;
  const existing = getCustomAssemblies();
  const idx = existing.findIndex((a) => a.id === assembly.id);
  if (idx >= 0) {
    existing[idx] = assembly;
  } else {
    existing.push(assembly);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCustomAssembly(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getCustomAssemblies().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
