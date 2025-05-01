// Generate a random ID for users based on their role
export function generateId(prefix: string): string {
  const randomSegment = Math.floor(Math.random() * 900) + 100; // generates a 3 digit number
  return `${prefix}-${randomSegment}`;
}
