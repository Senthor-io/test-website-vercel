import senthor from "@senthor-io/vercel";

// export default senthor;
export default async function senthor(request) {
    try {
        // Only intercept GET requests
        if (request.method !== "GET") {
            return;
        }

        const url = new URL(request.url);
        const request_url = url.pathname;

        const client_ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            'unknown';
        const headers = Object.fromEntries(request.headers);
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'set-cookie',
            'x-csrf-token',
        ];
        const filteredHeaders = Object.fromEntries(
            Object.entries(headers).filter(([key]) =>
                !sensitiveHeaders.includes(key.toLowerCase())
            )
        );

        const payload = {
            headers: filteredHeaders,
            request_url,
            client_ip
        };
        const apiResponse = await fetch('https://waf-api.senthor.io/api/check-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (apiResponse.status === 402) {
            const headers = new Headers();
            Object.entries(apiResponse.headers).forEach(([key, value]) => {
                if (key.toLowerCase().startsWith('crawler-')) {
                    headers.set(key, value);
                }
            });

            const response = new Response(apiResponse.body, {
                status: apiResponse.status,
                headers: headers,
            });
            return response;
        }
    } catch (err) {}
}

export const config = { matcher: "/:path*" };