import { erro, json, type Env } from '../../../server/core/http';
import type { AppData } from '../../../server/core/http';
export const onRequestGet: PagesFunction<Env,string,AppData> = async (ctx) => ctx.data.usuario ? json({usuario:ctx.data.usuario}) : erro('Sessão expirada.',401);
