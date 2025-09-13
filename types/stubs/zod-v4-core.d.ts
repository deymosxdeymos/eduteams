// Prevent duplicate re-exports by providing an empty module for zod/v4/core
declare module 'zod/v4/core' {
  export type ParseContext<T = any> = any;
  export type $ZodIssue = any;
  export type $ZodType<TIn = any, TOut = any, TCtx = any> = any;
  export type input<T> = any;
  export type output<T> = any;
  export type $ZodTypeInternals = any;
  export const $strip: any;
  export type $strip = any;
}
