import { json, type Env, type AppData } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { listarUsuarios } from '../../../server/domains/usuarios/usuarios.service';
export const onRequestGet: PagesFunction<Env,string,AppData> = async (ctx) => { const denied=exigirPermissao(ctx,'usuarios.acessar'); if(denied)return denied; return json({usuarios:await listarUsuarios(ctx.env.LOJAS_DB)}); };
