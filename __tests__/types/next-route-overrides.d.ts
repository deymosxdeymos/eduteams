// Narrow test-only overloads to accept standard Request object or no-arg for GET where applicable
// Scoped to tests via file location and tsconfig.test.json includes

declare module '@/app/api/user/onboarding-progress/route' {
  export function POST(request: Request): Promise<Response> | Response;
}

declare module '@/app/api/user/onboarding-status/route' {
  export function GET(request?: Request): Promise<Response> | Response;
}

declare module '@/app/api/user/personality/route' {
  export function POST(request: Request): Promise<Response> | Response;
}

// Relative import specifiers used in some tests

declare module '../../src/app/api/user/personality/route' {
  export function POST(request: Request): Promise<Response> | Response;
}

declare module '../../src/app/api/user/onboarding-status/route' {
  export function GET(request?: Request): Promise<Response> | Response;
}

declare module '../../src/app/api/user/onboarding-progress/route' {
  export function POST(request: Request): Promise<Response> | Response;
}
