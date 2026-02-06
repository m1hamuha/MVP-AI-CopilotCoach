import { cookies } from 'next/headers';

export async function getCookie(name: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch {
    return undefined;
  }
}

export function setCookie(_name: string, _value: string, _options?: any) {}
export function deleteCookie(_name: string) {}
