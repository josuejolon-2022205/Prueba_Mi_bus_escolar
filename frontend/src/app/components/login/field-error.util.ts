export interface FieldError {
  campo: string;
  mensaje: string;
}

export function normalizeFieldName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function matchesField(
  campoBackend: string | null | undefined,
  campo: string,
  aliases: string[] = []
): boolean {
  if (typeof campoBackend !== 'string') {
    return false;
  }
  const clave = normalizeFieldName(campoBackend);
  if (!clave) {
    return false;
  }
  const candidatos = [campo, ...aliases].map(normalizeFieldName).filter(Boolean);
  return candidatos.some((c) => clave === c || clave.endsWith(c));
}

export function findFieldError(
  errors: FieldError[] | null | undefined,
  campo: string,
  aliases: string[] = []
): string | null {
  if (!errors || errors.length === 0) {
    return null;
  }
  for (const error of errors) {
    if (error && matchesField(error.campo, campo, aliases)) {
      return error.mensaje;
    }
  }
  return null;
}

export function findFieldErrors(
  errors: FieldError[] | null | undefined,
  campo: string,
  aliases: string[] = []
): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }
  const resultado: string[] = [];
  for (const error of errors) {
    if (error && matchesField(error.campo, campo, aliases)) {
      resultado.push(error.mensaje);
    }
  }
  return resultado;
}