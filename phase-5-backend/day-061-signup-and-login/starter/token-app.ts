import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { signJwt, verifyJwt, type Claims } from "./jwt.ts";
import { RefreshTokens, REFRESH_DAYS } from "./refresh-tokens.ts";

export const ACCESS_MINUTES = 15;
export const REFRESH_COOKIE = "refresh";

export interface TokenUser {
  id: number;
  name: string;
  role: "fan" | "organiser";
}

export interface TokenAppOptions {
  secret: string;
  // Part 1 already checks passwords properly; here that's handed in, so today is only about tokens.
  checkLogin: (email: string, password: string) => Promise<TokenUser | null>;
  findUser: (id: number) => Promise<TokenUser | null>;
  now?: () => Date;
}

type Env = { Variables: { claims: Claims } };

export function createTokenApp(options: TokenAppOptions) {
  const now = options.now ?? (() => new Date());
  const refreshTokens = new RefreshTokens();

  const accessTokenFor = (user: TokenUser) => {
    // TODO: sign { sub: the id as a string, name, role, iat: now in seconds, exp: iat + ACCESS_MINUTES minutes }.
    void [signJwt, user];
    throw new Error("not implemented yet");
  };

  const setRefreshCookie = (c: Context, token: string) =>
    setCookie(c, REFRESH_COOKIE, token, {
      httpOnly: true, // page JavaScript never sees it
      secure: true,
      sameSite: "Strict", // only ever needed by our own site
      path: "/auth", // only sent to /auth/*, not with every API call
      maxAge: REFRESH_DAYS * 24 * 60 * 60,
    });

  const tokensResponse = (c: Context, user: TokenUser, refreshToken: string) => {
    setRefreshCookie(c, refreshToken);
    return c.json({ accessToken: accessTokenFor(user), tokenType: "Bearer", expiresIn: ACCESS_MINUTES * 60 });
  };

  // 401 tells the client what to do next. The WWW-Authenticate header is the standard way to say it.
  const unauthorized = (description: string, error?: "invalid_token") =>
    new HTTPException(401, {
      res: new Response(JSON.stringify({ error: description }), {
        status: 401,
        headers: { "Content-Type": "application/json", "WWW-Authenticate": error ? `Bearer error="${error}", error_description="${description}"` : "Bearer" },
      }),
    });

  const requireToken = createMiddleware<Env>(async (c, next) => {
    // TODO: read "Authorization: Bearer <token>". Missing -> throw unauthorized("Log in first").
    //   verifyJwt it. Not ok -> unauthorized("Token expired" or "Token is not valid", "invalid_token").
    //   Ok -> c.set("claims", ...) and await next().
    void [verifyJwt, unauthorized, c, next];
    throw new Error("not implemented yet");
  });

  const app = new Hono<Env>();

  app.post("/auth/login", async (c) => {
    const input = (await c.req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
    const user = typeof input.email === "string" && typeof input.password === "string" ? await options.checkLogin(input.email, input.password) : null;
    if (!user) throw new HTTPException(401, { message: "Email or password is wrong" });
    return tokensResponse(c, user, refreshTokens.issue(user.id, now()));
  });

  app.post("/auth/refresh", async (c) => {
    // TODO: rotate the token from the REFRESH_COOKIE cookie, then findUser(userId).
    //   Either fails -> delete the cookie (path "/auth") and throw a 401 "Log in again".
    //   Otherwise -> tokensResponse with the NEW refresh token.
    void [getCookie, deleteCookie];
    throw new Error("not implemented yet");
  });

  app.post("/auth/logout", (c) => {
    const token = getCookie(c, REFRESH_COOKIE);
    if (token) refreshTokens.revoke(token);
    deleteCookie(c, REFRESH_COOKIE, { path: "/auth" });
    return c.body(null, 204);
  });

  app.get("/me", requireToken, (c) => {
    const { sub, name, role } = c.get("claims");
    return c.json({ user: { id: Number(sub), name, role } });
  });

  // Logged in (so not 401) but not allowed (403). See Day 62.
  app.post("/events", requireToken, (c) => {
    if (c.get("claims").role !== "organiser") throw new HTTPException(403, { message: "Only organisers can create events" });
    return c.json({ created: true }, 201);
  });

  app.onError((error, c) => {
    if (!(error instanceof HTTPException)) return c.json({ error: "Something went wrong on our side" }, 500);
    return error.res ?? c.json({ error: error.message }, error.status);
  });

  return { app, refreshTokens };
}
