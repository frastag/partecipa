import { redirect } from "react-router";

import { localPath } from "~/core/http/safe-redirect";
import { getSession, sessionStorage } from "~/core/session/session.server";
import type { Route } from "./+types/language.route";
import { isLang } from "./i18n";

/**
 * GET /lingua/:code stores the language in the session and goes back to the page the person
 * came from, never to another host. An unknown code changes nothing (docs/routes.md).
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const back = localPath(request.headers.get("Referer"));
  if (!isLang(params.code)) return redirect(back);

  const session = await getSession(request);
  session.set("lang", params.code);
  return redirect(back, {
    headers: { "Set-Cookie": await sessionStorage().commitSession(session) },
  });
}
