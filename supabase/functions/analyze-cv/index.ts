import { handleCvAiRequest } from "./handler.js";

Deno.serve((request) => handleCvAiRequest(request, Deno.env.toObject()));
