export const JOB_TITLE_HINT =
  /\b(engineer|engenheir[oa]|developer|desenvolvedor|desenvolvedora|analista|architect|arquiteto|designer|consultant|consultor|consultora|manager|gerente|lead|intern|estagiário|estagiario|specialist|especialista|programador|coordenador|assistant|assistente|marketing|solution)\b/i;

export function looksLikeRoleLine(line: string): boolean {
  return JOB_TITLE_HINT.test(line) && line.length <= 100;
}
