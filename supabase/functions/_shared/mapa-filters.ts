export function applyProcessosFilters(query: any, filtros: any) {
  if (filtros.search) {
    query = query.ilike("search", `%${filtros.search}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte("data", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte("data", filtros.data_fim);
  }
  if (filtros.uf) {
    query = query.eq("uf", filtros.uf);
  }
  if (filtros.status) {
    query = query.eq("status", filtros.status);
  }
  if (filtros.fase) {
    query = query.eq("fase", filtros.fase);
  }
  if (filtros.testemunha) {
    query = query.contains("todas_testemunhas", [filtros.testemunha]);
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    query = query.gte("qtd_total_depos_unicos", filtros.qtd_depoimentos_min);
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    query = query.lte("qtd_total_depos_unicos", filtros.qtd_depoimentos_max);
  }
  if (filtros.tem_triangulacao !== undefined) {
    query = query.eq("triangulacao_confirmada", filtros.tem_triangulacao);
  }
  if (filtros.tem_troca !== undefined) {
    query = query.eq("troca_direta", filtros.tem_troca);
  }
  if (filtros.tem_prova_emprestada !== undefined) {
    query = query.eq("contem_prova_emprestada", filtros.tem_prova_emprestada);
  }
  return query;
}

export function applyTestemunhasFilters(query: any, filtros: any) {
  if (filtros.nome) {
    query = query.ilike("nome", `%${filtros.nome}%`);
  }
  if (filtros.documento) {
    query = query.eq("documento", filtros.documento);
  }
  if (filtros.search) {
    query = query.ilike("search", `%${filtros.search}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte("data", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte("data", filtros.data_fim);
  }
  if (filtros.ambos_polos !== undefined) {
    query = query.eq("foi_testemunha_em_ambos_polos", filtros.ambos_polos);
  }
  if (filtros.ja_foi_reclamante !== undefined) {
    query = query.eq("ja_foi_reclamante", filtros.ja_foi_reclamante);
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    query = query.gte("qtd_depoimentos", filtros.qtd_depoimentos_min);
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    query = query.lte("qtd_depoimentos", filtros.qtd_depoimentos_max);
  }
  if (filtros.tem_triangulacao !== undefined) {
    query = query.eq("participou_triangulacao", filtros.tem_triangulacao);
  }
  if (filtros.tem_troca !== undefined) {
    query = query.eq("participou_troca_favor", filtros.tem_troca);
  }
  return query;
}

