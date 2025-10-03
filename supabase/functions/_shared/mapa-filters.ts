export function applyProcessosFilters(query: any, filtros: any) {
  // Search in multiple fields for por_processo_staging
  if (filtros.search) {
    query = query.or(
      `cnj.ilike.%${filtros.search}%,reclamante_limpo.ilike.%${filtros.search}%,reu_nome.ilike.%${filtros.search}%`,
    );
  }
  if (filtros.uf) {
    query = query.eq("uf", filtros.uf);
  }
  if (filtros.situacao) {
    query = query.eq("situacao", filtros.situacao);
  }
  if (filtros.categoria) {
    query = query.eq("categoria", filtros.categoria);
  }
  if (filtros.testemunha) {
    query = query.or(
      `testemunhas_ativo_limpo.ilike.%${filtros.testemunha}%,testemunhas_passivo_limpo.ilike.%${filtros.testemunha}%`,
    );
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    // Convert text to integer for comparison
    query = query.filter(
      "qtd_total_depos_unicos",
      "gte",
      filtros.qtd_depoimentos_min.toString(),
    );
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    // Convert text to integer for comparison
    query = query.filter(
      "qtd_total_depos_unicos",
      "lte",
      filtros.qtd_depoimentos_max.toString(),
    );
  }
  if (filtros.tem_triangulacao !== undefined) {
    // Handle text boolean fields - "Sim"/"Não" or "true"/"false"
    const textValue = filtros.tem_triangulacao ? "Sim" : "Não";
    query = query.eq("triangulacao_confirmada", textValue);
  }
  if (filtros.tem_troca !== undefined) {
    // Handle text boolean fields - "Sim"/"Não" or "true"/"false"
    const textValue = filtros.tem_troca ? "Sim" : "Não";
    query = query.eq("troca_direta", textValue);
  }
  if (filtros.tem_prova_emprestada !== undefined) {
    // Handle text boolean fields - "Sim"/"Não" or "true"/"false"
    const textValue = filtros.tem_prova_emprestada ? "Sim" : "Não";
    query = query.eq("contem_prova_emprestada", textValue);
  }
  if (filtros.classificacao) {
    query = query.eq("classificacao_final", filtros.classificacao);
  }
  return query;
}

export function applyTestemunhasFilters(query: any, filtros: any) {
  // Search in multiple fields for por_testemunha_staging - use correct column name
  if (filtros.nome) {
    query = query.ilike("nome_testemunha", `%${filtros.nome}%`);
  }
  if (filtros.search) {
    query = query.ilike("nome_testemunha", `%${filtros.search}%`);
  }
  if (filtros.ambos_polos !== undefined) {
    // Handle text boolean fields - "Sim"/"Não"
    const textValue = filtros.ambos_polos ? "Sim" : "Não";
    query = query.eq("foi_testemunha_em_ambos_polos", textValue);
  }
  if (filtros.ja_foi_reclamante !== undefined) {
    // Handle text boolean fields - "Sim"/"Não"
    const textValue = filtros.ja_foi_reclamante ? "Sim" : "Não";
    query = query.eq("ja_foi_reclamante", textValue);
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    // Convert text to integer for comparison
    query = query.filter(
      "qtd_depoimentos",
      "gte",
      filtros.qtd_depoimentos_min.toString(),
    );
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    // Convert text to integer for comparison
    query = query.filter(
      "qtd_depoimentos",
      "lte",
      filtros.qtd_depoimentos_max.toString(),
    );
  }
  if (filtros.tem_triangulacao !== undefined) {
    // Handle text boolean fields - "Sim"/"Não"
    const textValue = filtros.tem_triangulacao ? "Sim" : "Não";
    query = query.eq("participou_triangulacao", textValue);
  }
  if (filtros.tem_troca !== undefined) {
    // Handle text boolean fields - "Sim"/"Não"
    const textValue = filtros.tem_troca ? "Sim" : "Não";
    query = query.eq("participou_troca_favor", textValue);
  }
  if (filtros.classificacao) {
    query = query.eq("classificacao", filtros.classificacao);
  }
  return query;
}
