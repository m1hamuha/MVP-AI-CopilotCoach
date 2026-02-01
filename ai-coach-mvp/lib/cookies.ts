import { cookies } from 'next/headers';

export function getCookie(name: string): string | undefined {
  try {
    return cookies().get(name)?.value;
  } catch {
    return undefined;
  }
}

// Cookie setting/deletion is typically done via API Response headers (NextResponse)
// or in fetch handlers. This module intentionally keeps setters minimal.
export function setCookie(_name: string, _value: string, _options?: any) {
  // no-op: use NextResponse in API routes to set cookies
}

export function deleteCookie(_name: string) {
  // no-op: use NextResponse in API routes to delete cookies
}
