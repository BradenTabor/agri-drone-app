export function checkboxValue(formData: FormData, name: string): boolean {
  return formData.getAll(name).map(String).includes("true");
}
