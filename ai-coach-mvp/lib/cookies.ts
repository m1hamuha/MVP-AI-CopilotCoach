import { cookies } from 'next/headers';

export async function getCookie(name: string): Promise<string | undefined> {
  return (await cookies()).get(name)?.value;
}

export function setCookie(name: string, value: string, options: any = {}) {
  // Note: cookies().set is not available in server components
  // This would need to be implemented differently for API routes
  console.warn('setCookie not implemented for server components');
}

export function deleteCookie(name: string) {
  // Note: cookies().set is not available in server components
  console.warn('deleteCookie not implemented for server components');
}