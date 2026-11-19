// 🛡️ [FASE 2.4 / 3 - ADJUNTOS] Validación segura de archivos e imágenes en cliente usando parámetros dinámicos de BD

export const EXTENSIONES_IMAGEN_PERMITIDAS = new Set<string>(['.png', '.jpg', '.jpeg', '.webp']);
export const MIMES_IMAGEN_PERMITIDOS = new Set<string>(['image/png', 'image/jpeg', 'image/webp']);

export interface ResultadoValidacionArchivo {
  valido: boolean;
  motivo?: string;
}

function obtenerExtension(nombre: string): string {
  const idx = nombre.lastIndexOf('.');
  return idx >= 0 ? nombre.slice(idx).toLowerCase() : '';
}

function coincidenMagicBytesImagen(bytes: Uint8Array, ext: string): boolean {
  if (ext === '.png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (ext === '.webp') {
    if (bytes.length < 12) return false;
    const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
    const webp = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return false;
}

/**
 * Valida extensión, MIME, tamaño máximo dinámico (TAMANO_MAX_ADJUNTO_MB desde BD) y firma binaria real (Magic Bytes)
 * de una imagen antes de aceptarla en la cola de subida.
 */
export async function validarArchivoImagenSeguro(
  file: File,
  tamanoMaxMb = 5,
): Promise<ResultadoValidacionArchivo> {
  const ext = obtenerExtension(file.name);
  if (!EXTENSIONES_IMAGEN_PERMITIDAS.has(ext)) {
    return {
      valido: false,
      motivo: `"${file.name}": formato no permitido. Solo se aceptan imágenes PNG, JPG o WEBP.`,
    };
  }

  if (file.type && !MIMES_IMAGEN_PERMITIDOS.has(file.type.toLowerCase())) {
    return {
      valido: false,
      motivo: `"${file.name}": tipo MIME no permitido (${file.type}). Usa PNG, JPG o WEBP.`,
    };
  }

  if (file.size <= 0) {
    return {
      valido: false,
      motivo: `"${file.name}": el archivo está vacío o dañado.`,
    };
  }

  const maxBytes = tamanoMaxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valido: false,
      motivo: `"${file.name}": supera el tamaño máximo permitido de ${tamanoMaxMb} MB.`,
    };
  }

  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!coincidenMagicBytesImagen(bytes, ext)) {
      return {
        valido: false,
        motivo: `"${file.name}": su contenido binario no coincide con una imagen ${ext.toUpperCase()} válida o está dañado.`,
      };
    }
  } catch {
    return {
      valido: false,
      motivo: `"${file.name}": no fue posible leer la firma del archivo.`,
    };
  }

  return { valido: true };
}

export function formatearTamanoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
