/* eslint-disable import/extensions, import/no-unresolved */
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

/**
 * Menta Check worker.
 *
 * Woken by a database trigger after a Menta-checked proof is sent, and every
 * minute by pg_cron for retries and group backups. For each claimed job it
 * describes a photo with a vision model, asks Jev fixed questions, applies the
 * code thresholds in policy.ts and hands the result to menta_check_apply_v1,
 * which decides the proof with the same authority as a human review.
 *
 * Only the maintenance secret can call this. The OpenRouter key lives only in
 * this function's environment.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.109.0';
import {
  ownsProofPath,
  removeJpegMetadata,
  prepareVideo,
  MAX_VIDEO_BYTES,
} from './media.ts';
import {
  DIAGNOSTIC_IMAGE_BASE64,
  DIAGNOSTIC_COUNTER_BASE64,
} from './diagnostic-image.ts';
import {
  DIAGNOSTIC_BLANK_VIDEO,
  DIAGNOSTIC_TIMER_VIDEO,
} from './diagnostic-video.ts';
import {
  CHAT_ENDPOINT,
  DEFAULT_JEV_MODEL,
  DEFAULT_SECOND_LOOK_MODEL,
  DEFAULT_VISION_MODEL,
  JEV_ENDPOINT,
  buildJevRequest,
  contextFromAuthorisedJob,
  buildVisionRequest,
  parseJevResponse,
  parseVisionResponse,
  type ProofContext,
} from './jev.ts';
import {
  MENTA_CHECK_POLICY_VERSION,
  decide,
  flagsFor,
  type MentaAnswers,
  type PhotoDescription,
  type ProofKind,
} from './policy.ts';

declare const Deno: any;

const PROOF_BUCKET = 'challenge-verifications';
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const unauthorised = (req: Request): Response | null => {
  const expected = Deno.env.get('DAILY_MAINTENANCE_SECRET')?.trim() ?? '';
  const provided = req.headers.get('x-maintenance-secret')?.trim() ?? '';
  return !expected || provided !== expected
    ? json({ error: 'Unauthorized' }, 401)
    : null;
};

type ClaimedJob = {
  user_id: string;
  job_id: number;
  kind: 'check' | 'hint' | 'backup';
  submission_id: string;
  media_url: string | null;
  media_type: string | null;
  submission_text: string | null;
  local_time: string | null;
  is_correction: boolean;
  minutes_pending: number;
  promise_title: string;
  proof_rule: string | null;
  proof_kind: string | null;
  prior_verdict: {
    p_match: number | null;
    reason: string | null;
    reason_confidence: number | null;
    flags: string[] | null;
    jev_model: string | null;
    vision_model: string | null;
  } | null;
  recent_hashes: string[];
};

const proofKindOf = (job: ClaimedJob): ProofKind => {
  const value = job.media_type ?? job.proof_kind;
  return value === 'video' || value === 'text' ? value : 'photo';
};

async function postJson(
  url: string,
  key: string,
  body: unknown
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://menta.app',
        'X-Title': 'Menta Check',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      // Provider bodies can echo a private note, photo or credential.
      await response.body?.cancel();
      throw new Error(`PROVIDER_HTTP_${response.status}`);
    }
    const text = await response.text();
    if (text.length > 64_000) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('PROVIDER_JSON_INVALID');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('PROVIDER_TIMEOUT');
    if (error instanceof Error && /^[A-Z][A-Z0-9_]{1,80}$/.test(error.message))
      throw error;
    throw new Error('PROVIDER_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
};

const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

async function describe(
  key: string,
  model: string,
  context: ProofContext,
  imageBase64: string
) {
  const body = await postJson(
    CHAT_ENDPOINT,
    key,
    buildVisionRequest({
      model,
      context,
      imageBase64,
      mimeType: context.proofKind === 'video' ? 'video/mp4' : 'image/jpeg',
    })
  );
  return parseVisionResponse(body);
}

async function askJev(
  key: string,
  context: ProofContext,
  description: PhotoDescription | null
) {
  const body = await postJson(
    JEV_ENDPOINT,
    key,
    buildJevRequest({
      model: Deno.env.get('MENTA_CHECK_JEV_MODEL') || DEFAULT_JEV_MODEL,
      context,
      description,
    })
  );
  return parseJevResponse(body);
}

async function processJob(supabase: any, job: ClaimedJob) {
  const started = Date.now();
  const mayDisclose = async () => {
    const { data, error } = await supabase.rpc('menta_check_authorise_job_v1', {
      p_job_id: job.job_id,
    });
    if (error) throw new Error('JOB_AUTHORISATION_FAILED');
    return data === true;
  };
  if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
  const proofKind = proofKindOf(job);
  const context = contextFromAuthorisedJob(job, proofKind);

  // A backup reuses what Menta already worked out while people had the proof.
  if (job.kind === 'backup' && job.prior_verdict?.p_match != null) {
    const prior = job.prior_verdict;
    const answers: MentaAnswers = {
      pMatch: Number(prior.p_match),
      reason: (prior.reason === null ? 'matches' : prior.reason) as any,
      reasonConfidence: Number(prior.reason_confidence ?? 0),
      tip: 'none',
    };
    // Rejection reasons stored as 'cant_see_rule' etc. map back to Jev's
    // choices; any stored flag keeps blocking a pass.
    const flags = (prior.flags ?? []) as any[];
    const decision = decide({
      kind: 'backup',
      proofKind,
      answers,
      flags,
      secondLookDone: true,
      minutesPending: job.minutes_pending,
    });
    return apply(supabase, job, decision, {
      p_match: answers.pMatch,
      reason_confidence: answers.reasonConfidence,
      flags,
      jev_model: prior.jev_model,
      vision_model: prior.vision_model,
      latency_ms: Date.now() - started,
    });
  }

  const key = Deno.env.get('OPENROUTER_API_KEY')?.trim();
  if (!key) throw new Error('OPENROUTER_API_KEY_MISSING');

  let cost = 0;
  let description: PhotoDescription | null = null;
  let visionModel: string | null = null;
  let imageBase64: string | null = null;
  let mediaSha256: string | null = null;
  let secondLook = false;

  if (proofKind === 'photo' || proofKind === 'video') {
    const maxBytes = proofKind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (!job.media_url) throw new Error('PHOTO_MISSING');
    if (!ownsProofPath(job.media_url, job.user_id))
      throw new Error('PHOTO_PATH_NOT_OWNED');
    const { data, error } = await supabase.storage
      .from(PROOF_BUCKET)
      .download(job.media_url);
    if (error || !data) throw new Error('PHOTO_DOWNLOAD_FAILED');
    if (data.size > maxBytes)
      throw new Error(
        proofKind === 'video' ? 'VIDEO_TOO_LARGE' : 'PHOTO_TOO_LARGE'
      );
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.byteLength > maxBytes)
      throw new Error(
        proofKind === 'video' ? 'VIDEO_TOO_LARGE' : 'PHOTO_TOO_LARGE'
      );
    mediaSha256 = await sha256Hex(bytes);
    imageBase64 = toBase64(
      proofKind === 'video' ? prepareVideo(bytes) : removeJpegMetadata(bytes)
    );
    if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
    let described;
    try {
      described = await describe(
        key,
        Deno.env.get('MENTA_CHECK_VISION_MODEL') || DEFAULT_VISION_MODEL,
        context,
        imageBase64
      );
    } catch {
      if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
      described = await describe(
        key,
        Deno.env.get('MENTA_CHECK_SECOND_LOOK_MODEL') ||
          DEFAULT_SECOND_LOOK_MODEL,
        context,
        imageBase64
      );
      secondLook = true;
    }
    description = described.description;
    visionModel = described.model;
    cost += described.cost;
  }

  if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
  let jev = await askJev(key, context, description);
  cost += jev.cost;
  const isDuplicate = Boolean(
    mediaSha256 && (job.recent_hashes ?? []).includes(mediaSha256)
  );
  let flags = flagsFor({ description, screenOk: jev.screenOk, isDuplicate });
  let decision = decide({
    kind: job.kind,
    proofKind,
    answers: jev.answers,
    flags,
    secondLookDone: secondLook,
    minutesPending: job.minutes_pending,
  });

  if (decision.action === 'second_look' && imageBase64) {
    if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
    // Never turn a photo down on one cheap description.
    const described = await describe(
      key,
      Deno.env.get('MENTA_CHECK_SECOND_LOOK_MODEL') ||
        DEFAULT_SECOND_LOOK_MODEL,
      context,
      imageBase64
    );
    description = described.description;
    visionModel = described.model;
    cost += described.cost;
    if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
    jev = await askJev(key, context, description);
    cost += jev.cost;
    flags = flagsFor({ description, screenOk: jev.screenOk, isDuplicate });
    secondLook = true;
    decision = decide({
      kind: job.kind,
      proofKind,
      answers: jev.answers,
      flags,
      secondLookDone: true,
      minutesPending: job.minutes_pending,
    });
  }

  if (!(await mayDisclose())) return { code: 'NO_LONGER_AUTHORISED' };
  return apply(supabase, job, decision, {
    p_match: jev.answers.pMatch,
    reason_confidence: jev.answers.reasonConfidence,
    flags,
    second_look: secondLook,
    jev_model: jev.model,
    jev_request_id: jev.requestId,
    vision_model: visionModel,
    caption: description,
    jev_answers: {
      ...jev.answers,
      screen_ok: jev.screenOk,
    },
    jev_reason: jev.answers.reason,
    media_sha256: mediaSha256,
    cost_usd: cost,
    latency_ms: Date.now() - started,
  });
}

async function apply(
  supabase: any,
  job: ClaimedJob,
  decision: ReturnType<typeof decide>,
  evidence: Record<string, unknown>
) {
  if (decision.action === 'second_look') {
    throw new Error('SECOND_LOOK_UNRESOLVED');
  }
  const verdict = {
    policy_version: MENTA_CHECK_POLICY_VERSION,
    decision:
      decision.action === 'approve'
        ? 'approve'
        : decision.action === 'reject'
          ? 'reject'
          : 'record',
    outcome: decision.outcome,
    // A recorded verdict keeps Jev's reason so a later backup can reuse it.
    reason:
      decision.action === 'reject'
        ? decision.reason
        : decision.action === 'record' &&
            typeof evidence.jev_reason === 'string' &&
            evidence.jev_reason !== 'matches'
          ? evidence.jev_reason
          : null,
    tip: decision.action === 'approve' ? decision.tip : null,
    hint: decision.hint,
    ...evidence,
  };
  delete (verdict as Record<string, unknown>).jev_reason;
  const { data, error } = await supabase.rpc('menta_check_apply_v1', {
    p_job_id: job.job_id,
    p_verdict: verdict,
  });
  if (error) throw new Error('APPLY_FAILED');
  if (data?.success === false && data?.code === 'UNKNOWN') {
    throw new Error(`APPLY_UNKNOWN: ${data?.message ?? ''}`);
  }
  return data;
}

async function failOpen(supabase: any, job: ClaimedJob, reason: string) {
  const { data } = await supabase.rpc('menta_check_fail_v1', {
    p_job_id: job.job_id,
    p_error: reason,
  });
  if (data !== 'fail_open') return { code: String(data ?? 'retry') };
  // Menta could not get a proper look in time, so the proof counts.
  const { data: applied } = await supabase.rpc('menta_check_apply_v1', {
    p_job_id: job.job_id,
    p_verdict: {
      policy_version: MENTA_CHECK_POLICY_VERSION,
      decision: 'approve',
      outcome: 'unavailable',
      flags: [],
    },
  });
  return applied;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const denied = unauthorised(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);
  // Maintenance-only deployment diagnostic. Uses invented text, never a
  // customer proof, and returns bounded status rather than provider content.
  if (url.searchParams.get('smoke') === '1') {
    const key = Deno.env.get('OPENROUTER_API_KEY')?.trim();
    if (!key) return json({ ready: false, code: 'PROVIDER_KEY_MISSING' }, 503);
    try {
      if (url.searchParams.get('vision') === '1') {
        const positive = url.searchParams.get('positive') === '1';
        const video = url.searchParams.get('video') === '1';
        const context: ProofContext = {
          promiseTitle: positive
            ? 'Record twenty minutes'
            : 'A photo of a book',
          proofRule: positive
            ? 'A screenshot of a timer displaying 20:00'
            : 'An open book',
          proofKind: video ? 'video' : 'photo',
          note: null,
          localTime: '13:00',
          isCorrection: false,
        };
        const models = [
          Deno.env.get('MENTA_CHECK_VISION_MODEL') || DEFAULT_VISION_MODEL,
          Deno.env.get('MENTA_CHECK_SECOND_LOOK_MODEL') ||
            DEFAULT_SECOND_LOOK_MODEL,
        ];
        const results = [];
        for (const model of models) {
          const response = await postJson(
            CHAT_ENDPOINT,
            key,
            buildVisionRequest({
              model,
              context,
              imageBase64: video
                ? positive
                  ? DIAGNOSTIC_TIMER_VIDEO
                  : DIAGNOSTIC_BLANK_VIDEO
                : positive
                  ? DIAGNOSTIC_COUNTER_BASE64
                  : DIAGNOSTIC_IMAGE_BASE64,
              mimeType: video ? 'video/mp4' : 'image/png',
            })
          );
          let parsed;
          try {
            parsed = parseVisionResponse(response);
          } catch {
            const text = response?.choices?.[0]?.message?.content;
            let value;
            try {
              value = JSON.parse(text);
            } catch {
              value = null;
            }
            return json(
              {
                ready: false,
                code: 'VISION_SCHEMA_FAILED',
                model,
                field_types:
                  value && typeof value === 'object'
                    ? Object.fromEntries(
                        Object.entries(value).map(([key, item]) => [
                          key.slice(0, 40),
                          Array.isArray(item) ? 'array' : typeof item,
                        ])
                      )
                    : null,
                content_length: typeof text === 'string' ? text.length : 0,
                finish_reason: response?.choices?.[0]?.finish_reason ?? null,
              },
              502
            );
          }
          const judged = await askJev(key, context, parsed.description);
          const policy = decide({
            kind: 'check',
            proofKind: context.proofKind,
            answers: judged.answers,
            flags: flagsFor({
              description: parsed.description,
              screenOk: judged.screenOk,
              isDuplicate: false,
            }),
            secondLookDone: model === models[1],
            minutesPending: 0,
          });
          results.push({
            model: parsed.model,
            valid_description: true,
            cost_usd: parsed.cost + judged.cost,
            expected_action: positive ? 'approve' : 'reject',
            actual_action: policy.action,
            p_match: judged.answers.pMatch,
            reason: judged.answers.reason,
            screen_ok: judged.screenOk,
            image_kind: parsed.description.image_kind,
            flags: flagsFor({
              description: parsed.description,
              screenOk: judged.screenOk,
              isDuplicate: false,
            }),
          });
        }
        return json({ ready: true, vision: results });
      }
      const result = await askJev(
        key,
        {
          promiseTitle: 'Read ten pages',
          proofRule: 'A note naming the pages read',
          proofKind: 'text',
          note: 'Today I read pages 11 through 20 of my book after lunch.',
          localTime: '13:00',
          isCorrection: false,
        },
        null
      );
      return json({
        ready: true,
        model: result.model,
        valid_decision: true,
        cost_usd: result.cost,
      });
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      return json(
        {
          ready: false,
          code: /^[A-Z][A-Z0-9_]{1,80}$/.test(raw)
            ? raw
            : 'PROVIDER_CHECK_FAILED',
        },
        502
      );
    }
  }
  const batch = Math.min(
    1,
    Math.max(1, Number.parseInt(url.searchParams.get('batch') ?? '1', 10) || 1)
  );

  if (url.searchParams.get('sweep') === '1') {
    await supabase.rpc('menta_check_queue_backups_v1', { p_limit: 50 });
  }

  const { data: jobs, error } = await supabase.rpc('menta_check_claim_v1', {
    p_limit: batch,
  });
  if (error) return json({ error: error.message }, 500);

  const results: Record<string, unknown>[] = [];
  for (const job of (jobs ?? []) as ClaimedJob[]) {
    try {
      const result = await processJob(supabase, job);
      results.push({ job: job.job_id, ...(result ?? {}) });
    } catch (jobError) {
      const raw = jobError instanceof Error ? jobError.message : '';
      const message = /^[A-Z][A-Z0-9_]{1,80}$/.test(raw) ? raw : 'CHECK_FAILED';
      const invalidEvidence = [
        'PHOTO_MISSING',
        'PHOTO_PATH_NOT_OWNED',
        'PHOTO_TOO_LARGE',
        'PHOTO_FORMAT_UNSUPPORTED',
        'PHOTO_FORMAT_INVALID',
        'VIDEO_FORMAT_INVALID',
      ].includes(message);
      const result = invalidEvidence
        ? await apply(
            supabase,
            job,
            job.kind === 'check'
              ? {
                  action: 'reject',
                  outcome: 'not_yet',
                  reason: 'too_unclear',
                  hint: null,
                }
              : {
                  action: 'record',
                  outcome: 'left_for_people',
                  hint: 'unsure',
                },
            { flags: ['blank_or_stock'] }
          )
        : await failOpen(supabase, job, message);
      results.push({
        job: job.job_id,
        error: message.slice(0, 120),
        ...(result ?? {}),
      });
    }
  }

  return json({ processed: results.length, results });
});
