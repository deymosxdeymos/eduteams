declare module 'better-auth/next-js' {
  export function toNextJsHandler(
    auth:
      | { handler: (request: Request) => Promise<Response> }
      | ((request: Request) => Promise<Response>)
  ): { POST: (request: Request) => Promise<Response>; GET: (request: Request) => Promise<Response> };

  export function nextCookies(): any;
}
