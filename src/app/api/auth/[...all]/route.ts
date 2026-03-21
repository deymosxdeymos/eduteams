import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

const authHandler = toNextJsHandler(getAuth());

export const GET = authHandler.GET;
export const POST = authHandler.POST;
