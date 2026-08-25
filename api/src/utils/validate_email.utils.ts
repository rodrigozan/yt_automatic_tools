const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}
