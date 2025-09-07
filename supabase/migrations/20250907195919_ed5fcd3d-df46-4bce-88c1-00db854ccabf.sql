-- ============================================================================
-- MIGRATION: Mapa das Testemunhas - Sistema de Filtros e Atualizações (FIXED)
-- Schema: assistjur
-- Data: 2025-01-07
-- 
-- Objetivo: Implementar campos de controle para o Mapa das Testemunhas
-- permitindo filtrar e atualizar status_oitiva, relevancia, risco,
-- proxima_movimentacao, nota_interna e tags de forma segura.
-- ============================================================================

-- 1. CRIAÇÃO DO SCHEMA (se não existir)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS assistjur;

-- 2. CRIAÇÃO DO ENUM status_oitiva_enum (idempotente)
-- ============================================================================
DO $$
BEGIN
    -- Criar enum se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_oitiva_enum' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'assistjur')) THEN
        CREATE TYPE assistjur.status_oitiva_enum AS ENUM (
            'nao_intimada',
            'intimada', 
            'confirmada',
            'ouvida',
            'pendente',
            'nao_localizada',
            'problema'
        );
        RAISE NOTICE 'Enum assistjur.status_oitiva_enum criado';
    ELSE
        RAISE NOTICE 'Enum assistjur.status_oitiva_enum já existe';
    END IF;
END $$;

-- 3. CRIAÇÃO DAS TABELAS BASE (se não existirem)
-- ============================================================================

-- Tabela testemunhas (se não existir)
CREATE TABLE IF NOT EXISTS assistjur.testemunhas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    tenant_id uuid NOT NULL, -- Para RLS por organização
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE assistjur.testemunhas IS 'Cadastro de testemunhas para o sistema de mapeamento';
COMMENT ON COLUMN assistjur.testemunhas.tenant_id IS 'ID da organização para isolamento de dados';

-- Tabela processos (se não existir)  
CREATE TABLE IF NOT EXISTS assistjur.processos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero text NOT NULL, -- Número do processo para identificação
    tenant_id uuid NOT NULL, -- Para RLS por organização
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE assistjur.processos IS 'Cadastro de processos para o sistema de mapeamento';
COMMENT ON COLUMN assistjur.processos.numero IS 'Número identificador do processo';
COMMENT ON COLUMN assistjur.processos.tenant_id IS 'ID da organização para isolamento de dados';

-- 4. CRIAÇÃO DA TABELA DE VÍNCULO processos_testemunhas
-- ============================================================================
CREATE TABLE IF NOT EXISTS assistjur.processos_testemunhas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id uuid NOT NULL,
    testemunha_id uuid NOT NULL,
    tenant_id uuid NOT NULL, -- Para RLS por organização
    
    -- CAMPOS ESPECÍFICOS DO MAPA DAS TESTEMUNHAS
    status_oitiva assistjur.status_oitiva_enum NOT NULL DEFAULT 'pendente',
    relevancia smallint NOT NULL DEFAULT 50,
    risco text NOT NULL DEFAULT 'media',
    proxima_movimentacao timestamptz,
    nota_interna text,
    tags text[] DEFAULT '{}'::text[],
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT fk_processos_testemunhas_processo 
        FOREIGN KEY (processo_id) REFERENCES assistjur.processos(id) ON DELETE CASCADE,
    CONSTRAINT fk_processos_testemunhas_testemunha 
        FOREIGN KEY (testemunha_id) REFERENCES assistjur.testemunhas(id) ON DELETE CASCADE,
    CONSTRAINT uq_processo_testemunha 
        UNIQUE (processo_id, testemunha_id)
);

-- 5. ADIÇÃO DE COLUNAS (se não existirem) E CONSTRAINTS
-- ============================================================================

-- Adicionar colunas se não existirem (idempotente)
DO $$
BEGIN
    -- status_oitiva
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'status_oitiva') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN status_oitiva assistjur.status_oitiva_enum NOT NULL DEFAULT 'pendente';
        RAISE NOTICE 'Coluna status_oitiva adicionada';
    END IF;

    -- relevancia
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'relevancia') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN relevancia smallint NOT NULL DEFAULT 50;
        RAISE NOTICE 'Coluna relevancia adicionada';
    END IF;

    -- risco  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'risco') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN risco text NOT NULL DEFAULT 'media';
        RAISE NOTICE 'Coluna risco adicionada';
    END IF;

    -- proxima_movimentacao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'proxima_movimentacao') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN proxima_movimentacao timestamptz;
        RAISE NOTICE 'Coluna proxima_movimentacao adicionada';
    END IF;

    -- nota_interna
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'nota_interna') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN nota_interna text;
        RAISE NOTICE 'Coluna nota_interna adicionada';
    END IF;

    -- tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'tags') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN tags text[] DEFAULT '{}'::text[];
        RAISE NOTICE 'Coluna tags adicionada';
    END IF;

    -- tenant_id (para RLS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'assistjur' AND table_name = 'processos_testemunhas' AND column_name = 'tenant_id') THEN
        ALTER TABLE assistjur.processos_testemunhas ADD COLUMN tenant_id uuid;
        RAISE NOTICE 'Coluna tenant_id adicionada';
        -- NOTA MANUAL: Popular tenant_id via FK ou inserção manual após migration
    END IF;
END $$;

-- 6. CONSTRAINTS DE VALIDAÇÃO (idempotentes)
-- ============================================================================

-- CHECK constraint para relevancia (0-100)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_schema = 'assistjur' AND constraint_name = 'chk_relevancia_range') THEN
        ALTER TABLE assistjur.processos_testemunhas 
        ADD CONSTRAINT chk_relevancia_range CHECK (relevancia BETWEEN 0 AND 100);
        RAISE NOTICE 'Constraint chk_relevancia_range adicionada';
    END IF;
END $$;

-- CHECK constraint para risco (baixa|media|alta)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_schema = 'assistjur' AND constraint_name = 'chk_risco_values') THEN
        ALTER TABLE assistjur.processos_testemunhas 
        ADD CONSTRAINT chk_risco_values CHECK (risco IN ('baixa','media','alta'));
        RAISE NOTICE 'Constraint chk_risco_values adicionada';
    END IF;
END $$;

-- 7. COMENTÁRIOS NAS COLUNAS
-- ============================================================================
COMMENT ON COLUMN assistjur.processos_testemunhas.status_oitiva IS 'Status da oitiva da testemunha: nao_intimada, intimada, confirmada, ouvida, pendente, nao_localizada, problema';
COMMENT ON COLUMN assistjur.processos_testemunhas.relevancia IS 'Relevância da testemunha para o processo (0-100, onde 100 é mais relevante)';
COMMENT ON COLUMN assistjur.processos_testemunhas.risco IS 'Nível de risco da testemunha: baixa, media ou alta';
COMMENT ON COLUMN assistjur.processos_testemunhas.proxima_movimentacao IS 'Data/hora da próxima movimentação esperada para esta testemunha';
COMMENT ON COLUMN assistjur.processos_testemunhas.nota_interna IS 'Anotações internas sobre a testemunha (acesso restrito via RPC)';
COMMENT ON COLUMN assistjur.processos_testemunhas.tags IS 'Tags/marcadores para categorização e filtros';

-- 8. ÍNDICES PARA PERFORMANCE DE FILTROS
-- ============================================================================

-- Índice para status_oitiva
CREATE INDEX IF NOT EXISTS idx_proc_test_status 
ON assistjur.processos_testemunhas (status_oitiva);

-- Índice para relevancia
CREATE INDEX IF NOT EXISTS idx_proc_test_relevancia 
ON assistjur.processos_testemunhas (relevancia);

-- Índice para risco
CREATE INDEX IF NOT EXISTS idx_proc_test_risco 
ON assistjur.processos_testemunhas (risco);

-- Índice para proxima_movimentacao
CREATE INDEX IF NOT EXISTS idx_proc_test_proxima_mov 
ON assistjur.processos_testemunhas (proxima_movimentacao);

-- Índice GIN para tags (arrays)
CREATE INDEX IF NOT EXISTS idx_proc_test_tags_gin 
ON assistjur.processos_testemunhas USING GIN (tags);

-- Índice composto para tenant_id + filtros comuns
CREATE INDEX IF NOT EXISTS idx_proc_test_tenant_filters 
ON assistjur.processos_testemunhas (tenant_id, status_oitiva, risco, relevancia);

-- 9. VIEW DE LEITURA PÚBLICA (sem nota_interna) - CORRIGIDA
-- ============================================================================
CREATE OR REPLACE VIEW assistjur.v_mapa_testemunhas AS
SELECT 
    pt.id as vinculo_id,
    pt.processo_id,
    p.numero as processo_numero,
    pt.testemunha_id,
    t.nome as testemunha_nome,
    pt.status_oitiva,
    pt.relevancia,
    pt.risco,
    pt.proxima_movimentacao,
    pt.tags,
    pt.created_at,
    pt.updated_at
FROM assistjur.processos_testemunhas pt
JOIN assistjur.processos p ON pt.processo_id = p.id
JOIN assistjur.testemunhas t ON pt.testemunha_id = t.id;

COMMENT ON VIEW assistjur.v_mapa_testemunhas IS 'View pública para leitura do mapa de testemunhas (sem nota_interna por privacidade)';

-- 10. RPC DE ATUALIZAÇÃO SEGURA
-- ============================================================================
CREATE OR REPLACE FUNCTION assistjur.rpc_atualizar_mapa_testemunha(
    vinculo_id uuid,
    p_status assistjur.status_oitiva_enum,
    p_relev smallint,
    p_risco text,
    p_prox timestamptz,
    p_nota text,
    p_tags text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = assistjur, public
AS $$
BEGIN
    -- Verificar se usuário está autenticado
    IF auth.role() != 'authenticated' THEN
        RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
    END IF;

    -- Validar parâmetros
    IF p_relev < 0 OR p_relev > 100 THEN
        RAISE EXCEPTION 'Relevância deve estar entre 0 e 100 (fornecido: %)', p_relev;
    END IF;

    IF p_risco NOT IN ('baixa', 'media', 'alta') THEN
        RAISE EXCEPTION 'Risco deve ser: baixa, media ou alta (fornecido: %)', p_risco;
    END IF;

    -- Verificar se o vínculo existe e pertence ao tenant do usuário
    IF NOT EXISTS (
        SELECT 1 
        FROM assistjur.processos_testemunhas pt 
        WHERE pt.id = vinculo_id 
        AND pt.tenant_id = (
            SELECT COALESCE(
                (auth.jwt() ->> 'tenant_id')::uuid,
                (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
            )
        )
    ) THEN
        RAISE EXCEPTION 'Vínculo não encontrado ou acesso negado (ID: %)', vinculo_id;
    END IF;

    -- Atualizar os campos especificados
    UPDATE assistjur.processos_testemunhas 
    SET 
        status_oitiva = p_status,
        relevancia = p_relev,
        risco = p_risco,
        proxima_movimentacao = p_prox,
        nota_interna = p_nota,
        tags = COALESCE(p_tags, '{}'::text[]),
        updated_at = now()
    WHERE id = vinculo_id;

    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Falha na atualização do vínculo (ID: %)', vinculo_id;
    END IF;
END;
$$;

COMMENT ON FUNCTION assistjur.rpc_atualizar_mapa_testemunha IS 'Atualiza campos do mapa de testemunhas de forma segura com validações e controle de acesso';

-- 11. ATIVAÇÃO DE ROW LEVEL SECURITY
-- ============================================================================

-- Ativar RLS nas tabelas
ALTER TABLE assistjur.testemunhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur.processos ENABLE ROW LEVEL SECURITY;  
ALTER TABLE assistjur.processos_testemunhas ENABLE ROW LEVEL SECURITY;

-- Policies para testemunhas
DROP POLICY IF EXISTS testemunhas_select_policy ON assistjur.testemunhas;
CREATE POLICY testemunhas_select_policy ON assistjur.testemunhas
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = COALESCE(
            (auth.jwt() ->> 'tenant_id')::uuid,
            (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        )
    );

-- Policies para processos
DROP POLICY IF EXISTS processos_select_policy ON assistjur.processos;
CREATE POLICY processos_select_policy ON assistjur.processos
    FOR SELECT 
    TO authenticated
    USING (
        tenant_id = COALESCE(
            (auth.jwt() ->> 'tenant_id')::uuid,
            (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        )
    );

-- Policies para processos_testemunhas
DROP POLICY IF EXISTS processos_testemunhas_select_policy ON assistjur.processos_testemunhas;
CREATE POLICY processos_testemunhas_select_policy ON assistjur.processos_testemunhas
    FOR SELECT
    TO authenticated  
    USING (
        tenant_id = COALESCE(
            (auth.jwt() ->> 'tenant_id')::uuid,
            (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        )
    );

DROP POLICY IF EXISTS processos_testemunhas_update_policy ON assistjur.processos_testemunhas;
CREATE POLICY processos_testemunhas_update_policy ON assistjur.processos_testemunhas
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = COALESCE(
            (auth.jwt() ->> 'tenant_id')::uuid,
            (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
        )
    );

-- 12. TRIGGER PARA updated_at AUTOMÁTICO
-- ============================================================================
CREATE OR REPLACE FUNCTION assistjur.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DO $$
BEGIN
    -- Trigger para testemunhas
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_testemunhas_updated_at') THEN
        CREATE TRIGGER trigger_testemunhas_updated_at
            BEFORE UPDATE ON assistjur.testemunhas
            FOR EACH ROW
            EXECUTE FUNCTION assistjur.update_updated_at_column();
    END IF;

    -- Trigger para processos  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_processos_updated_at') THEN
        CREATE TRIGGER trigger_processos_updated_at  
            BEFORE UPDATE ON assistjur.processos
            FOR EACH ROW
            EXECUTE FUNCTION assistjur.update_updated_at_column();
    END IF;

    -- Trigger para processos_testemunhas
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_processos_testemunhas_updated_at') THEN
        CREATE TRIGGER trigger_processos_testemunhas_updated_at
            BEFORE UPDATE ON assistjur.processos_testemunhas
            FOR EACH ROW
            EXECUTE FUNCTION assistjur.update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- MIGRATION CONCLUÍDO COM SUCESSO
-- 
-- PRÓXIMOS PASSOS MANUAIS (se necessário):
-- 1. Popular tenant_id em processos_testemunhas se já havia dados:
--    UPDATE assistjur.processos_testemunhas pt 
--    SET tenant_id = p.tenant_id 
--    FROM assistjur.processos p 
--    WHERE pt.processo_id = p.id AND pt.tenant_id IS NULL;
--
-- 2. Inserir dados de exemplo se necessário para teste
-- ============================================================================