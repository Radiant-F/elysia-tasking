import { app } from "./index";
import { env } from "./lib/env";

app.listen(env.PORT);

// eslint-disable-next-line no-console
console.log(`🦊 Elysia is running at http://localhost:${env.PORT}`);
