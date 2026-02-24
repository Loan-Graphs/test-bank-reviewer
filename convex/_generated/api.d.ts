/* eslint-disable */
/**
 * Generated `api` utility.
 * Run `npx convex dev` to regenerate.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as questions from "../questions.js";
import type * as memory from "../memory.js";
import type * as queue from "../queue.js";

declare const fullApi: ApiFromModules<{
  questions: typeof questions;
  memory: typeof memory;
  queue: typeof queue;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
