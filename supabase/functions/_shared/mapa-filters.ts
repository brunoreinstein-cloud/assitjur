export function applyProcessosFilters(query: any, filtros: any) {
  // Search in multiple fields for por_processo_staging
  if (filtros.search) {
    query = query.or(`cnj.ilike.%${filtros.search}%,reclamante_limpo.ilike.%${filtros.search}%,reu_nome.ilike.%${filtros.search}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte("data_audiencia", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte("data_audiencia", filtros.data_fim);
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
    query = query.or(`testemunhas_ativo_limpo.ilike.%${filtros.testemunha}%,testemunhas_passivo_limpo.ilike.%${filtros.testemunha}%`);
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    query = query.gte("qtd_total_depos_unicos", filtros.qtd_depoimentos_min);
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    query = query.lte("qtd_total_depos_unicos", filtros.qtd_depoimentos_max);
  }
  if (filtros.tem_triangulacao !== undefined) {
    // Convert string to boolean if needed
    const hasTriangulacao = filtros.tem_triangulacao === true || filtros.tem_triangulacao === "true";
    query = query.eq("triangulacao_confirmada", hasTriangulacao);
  }
  if (filtros.tem_troca !== undefined) {
    // Convert string to boolean if needed
    const hasTroca = filtros.tem_troca === true || filtros.tem_troca === "true";
    query = query.eq("troca_direta", hasTroca);
  }
  if (filtros.tem_prova_emprestada !== undefined) {
    // Convert string to boolean if needed  
    const hasProvaEmprestada = filtros.tem_prova_emprestada === true || filtros.tem_prova_emprestada === "true";
    query = query.eq("contem_prova_emprestada", hasProvaEmprestada);
  }
  if (filtros.classificacao) {
    query = query.eq("classificacao_final", filtros.classificacao);
  }
  return query;
}

export function applyTestemunhasFilters(query: any, filtros: any) {
  // Search in multiple fields for por_testemunha_staging
  if (filtros.nome) {
    query = query.ilike("nome_civil", `%${filtros.nome}%`);
  }
  if (filtros.documento) {
    query = query.eq("documento", filtros.documento);
  }
  if (filtros.search) {
    query = query.or(`nome_civil.ilike.%${filtros.search}%,documento.ilike.%${filtros.search}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte("primeira_participacao", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte("ultima_participacao", filtros.data_fim);
  }
  if (filtros.ambos_polos !== undefined) {
    // Convert string to boolean if needed
    const ambosPolos = filtros.ambos_polos === true || filtros.ambos_polos === "true";
    query = query.eq("foi_testemunha_em_ambos_polos", ambosPolos);
  }
  if (filtros.ja_foi_reclamante !== undefined) {
    // Convert string to boolean if needed
    const jaFoiReclamante = filtros.ja_foi_reclamante === true || filtros.ja_foi_reclamante === "true";
    query = query.eq("ja_foi_reclamante", jaFoiReclamante);
  }
  if (filtros.qtd_depoimentos_min !== undefined) {
    query = query.gte("qtd_depoimentos", filtros.qtd_depoimentos_min);
  }
  if (filtros.qtd_depoimentos_max !== undefined) {
    query = query.lte("qtd_depoimentos", filtros.qtd_depoimentos_max);
  }
  if (filtros.tem_triangulacao !== undefined) {
    // Convert string to boolean if needed
    const temTriangulacao = filtros.tem_triangulacao === true || filtros.tem_triangulacao === "true";
    query = query.eq("participou_triangulacao", temTriangulacao);
  }
  if (filtros.tem_troca !== undefined) {
    // Convert string to boolean if needed
    const temTroca = filtros.tem_troca === true || filtros.tem_troca === "true";
    query = query.eq("participou_troca_favor", temTroca);
  }
  if (filtros.classificacao) {
    query = query.eq("classificacao_risco", filtros.classificacao);
  }
  return query;
}

