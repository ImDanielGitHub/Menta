import {
  createClient,
  type SupabaseClient,
  type User,
} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from './cors.ts';

export type FunctionContext = {
  user: User | null;
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
  ipAddress: string;
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export async function readJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getClientIp(req: Request): string {
  const headerCandidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('x-forwarded-for')?.split(',')[0],
    req.headers.get('x-real-ip'),
  ];

  for (const candidate of headerCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return 'unknown';
}

export async function buildFunctionContext(
  req: Request
): Promise<FunctionContext> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Missing Supabase environment configuration');
  }

  const authHeader = req.headers.get('Authorization') ?? '';

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  return {
    user: user ?? null,
    userClient,
    serviceClient,
    ipAddress: getClientIp(req),
  };
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyTurnstileToken(
  token: string,
  ipAddress: string
): Promise<boolean> {
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');

  if (!turnstileSecret) {
    console.error('[security] TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  if (!token || token.trim().length === 0) {
    return false;
  }

  const body = new URLSearchParams();
  body.append('secret', turnstileSecret);
  body.append('response', token.trim());
  if (ipAddress && ipAddress !== 'unknown') {
    body.append('remoteip', ipAddress);
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return payload?.success === true;
  } catch (error) {
    console.error('[security] Turnstile verification failed:', error);
    return false;
  }
}

export async function consumeRateLimit(
  serviceClient: SupabaseClient,
  endpoint: string,
  actorKey: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const actorKeyHash = await sha256Hex(actorKey);
  const { data, error } = await serviceClient.rpc('consume_edge_rate_limit', {
    p_endpoint: endpoint,
    p_actor_key_hash: actorKeyHash,
    p_max_requests: maxRequests,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    console.error('[security] Failed to consume edge rate limit:', error);
    return { allowed: false, retryAfterSeconds: windowMinutes * 60 };
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result.allowed !== 'boolean') {
    console.error('[security] Edge rate limiter returned an invalid result');
    return { allowed: false, retryAfterSeconds: windowMinutes * 60 };
  }

  return {
    allowed: result.allowed,
    retryAfterSeconds:
      typeof result.retry_after_seconds === 'number'
        ? result.retry_after_seconds
        : result.allowed
          ? 0
          : windowMinutes * 60,
  };
}
