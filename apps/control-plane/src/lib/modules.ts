export interface TenantModules {
  calendar?: boolean;
}

export function parseModules(raw: unknown): TenantModules {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as TenantModules;
  }
  return {};
}

export function hasModule(raw: unknown, key: keyof TenantModules): boolean {
  return parseModules(raw)[key] === true;
}
