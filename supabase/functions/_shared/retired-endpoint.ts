/** Deployed in place of obsolete endpoints; never receives database authority. */
export const handleRetiredEndpoint = (): Response =>
  new Response(
    JSON.stringify({
      success: false,
      code: 'ENDPOINT_RETIRED',
      message: 'Update Menta and use the current invite flow.',
    }),
    {
      status: 410,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );

if (typeof Deno !== 'undefined') {
  Deno.serve(handleRetiredEndpoint);
}
