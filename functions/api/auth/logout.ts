import { json, type Env } from '../../../server/core/http';
import { revogarSessao } from '../../../server/core/sessao';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => json({ ok:true },200,await revogarSessao(env,request));
