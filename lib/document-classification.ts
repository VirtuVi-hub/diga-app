const ADMINISTRATIVE_DOCUMENT_TYPES = ["Agreement", "Brief", "BOQ"];

export function isAdministrativeDocumentType(
  typeName: string | null | undefined,
): boolean {
  return typeName != null && ADMINISTRATIVE_DOCUMENT_TYPES.includes(typeName);
}
