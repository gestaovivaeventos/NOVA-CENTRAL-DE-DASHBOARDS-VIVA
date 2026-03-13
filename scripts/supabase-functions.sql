-- ============================================================
-- ARQUITETURA FINAL — Análise de Mercado INEP (Supabase)
-- 
-- Estratégia híbrida:
--   • Materialized Views para panoramas gerais (instantâneo)
--   • Funções RPC com filtros dinâmicos opcionais
--   • Índices compostos para queries filtradas
--
-- Execute este script UMA VEZ no SQL Editor do Supabase.
-- Depois rode: SELECT fn_refresh_views();
-- ============================================================


-- ============================================================
-- PASSO 1 — ÍNDICES
-- Sem índices = Full Table Scan em 2M+ linhas a cada filtro
-- ============================================================

-- Índices simples (colunas de filtro individual)
CREATE INDEX IF NOT EXISTS idx_inep2022_uf           ON inep_2022 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2022_rede         ON inep_2022 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2022_modalidade   ON inep_2022 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2022_municipio    ON inep_2022 (no_municipio);
CREATE INDEX IF NOT EXISTS idx_inep2022_area         ON inep_2022 (no_cine_area_geral);
CREATE INDEX IF NOT EXISTS idx_inep2022_curso        ON inep_2022 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2022_ies          ON inep_2022 (co_ies);
-- Composto: acelera filtros combinados (UF + rede + modalidade)
CREATE INDEX IF NOT EXISTS idx_inep2022_uf_rede_mod  ON inep_2022 (sg_uf, tp_rede, tp_modalidade_ensino);

CREATE INDEX IF NOT EXISTS idx_inep2023_uf           ON inep_2023 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2023_rede         ON inep_2023 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2023_modalidade   ON inep_2023 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2023_municipio    ON inep_2023 (no_municipio);
CREATE INDEX IF NOT EXISTS idx_inep2023_area         ON inep_2023 (no_cine_area_geral);
CREATE INDEX IF NOT EXISTS idx_inep2023_curso        ON inep_2023 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2023_ies          ON inep_2023 (co_ies);
CREATE INDEX IF NOT EXISTS idx_inep2023_uf_rede_mod  ON inep_2023 (sg_uf, tp_rede, tp_modalidade_ensino);

CREATE INDEX IF NOT EXISTS idx_inep2024_uf           ON inep_2024 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2024_rede         ON inep_2024 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2024_modalidade   ON inep_2024 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2024_municipio    ON inep_2024 (no_municipio);
CREATE INDEX IF NOT EXISTS idx_inep2024_area         ON inep_2024 (no_cine_area_geral);
CREATE INDEX IF NOT EXISTS idx_inep2024_curso        ON inep_2024 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2024_ies          ON inep_2024 (co_ies);
CREATE INDEX IF NOT EXISTS idx_inep2024_uf_rede_mod  ON inep_2024 (sg_uf, tp_rede, tp_modalidade_ensino);


-- ============================================================
-- PASSO 2 — MATERIALIZED VIEWS
-- Pré-calcula agregações pesadas. O dashboard lê ~100 linhas
-- em vez de varrer 2M+ registros. Atualizar só quando importar
-- dados novos do INEP (ver fn_refresh_views no final).
-- ============================================================

-- 2.1 Evolução Anual completa (3 linhas, todos os breakdowns)
-- Gráficos de linha histórica + distribuição por métrica
DROP MATERIALIZED VIEW IF EXISTS mv_evolucao_anual;
CREATE MATERIALIZED VIEW mv_evolucao_anual AS
  SELECT
    sub.ano,
    COALESCE(SUM(qt_mat), 0)::bigint                         AS matriculas,
    COALESCE(SUM(qt_conc), 0)::bigint                        AS concluintes,
    COALESCE(SUM(qt_ing), 0)::bigint                         AS ingressantes,
    -- Breakdowns Matrículas
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END), 0)::bigint AS presencial_mat,
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END), 0)::bigint AS ead_mat,
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END), 0)::bigint              AS publica_mat,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END), 0)::bigint              AS privada_mat,
    COALESCE(SUM(qt_mat_fem), 0)::bigint                     AS feminino_mat,
    COALESCE(SUM(qt_mat_masc), 0)::bigint                    AS masculino_mat,
    -- Breakdowns Concluintes
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END), 0)::bigint AS presencial_conc,
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END), 0)::bigint AS ead_conc,
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_conc ELSE 0 END), 0)::bigint              AS publica_conc,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_conc ELSE 0 END), 0)::bigint              AS privada_conc,
    COALESCE(SUM(qt_conc_fem), 0)::bigint                    AS feminino_conc,
    COALESCE(SUM(qt_conc_masc), 0)::bigint                   AS masculino_conc,
    -- Breakdowns Ingressantes
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END), 0)::bigint AS presencial_ing,
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END), 0)::bigint AS ead_ing,
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_ing ELSE 0 END), 0)::bigint              AS publica_ing,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_ing ELSE 0 END), 0)::bigint              AS privada_ing,
    COALESCE(SUM(qt_ing_fem), 0)::bigint                     AS feminino_ing,
    COALESCE(SUM(qt_ing_masc), 0)::bigint                    AS masculino_ing,
    -- Cross-breakdowns Matrículas (rede × modalidade)
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END), 0)::bigint AS pub_pres_mat,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END), 0)::bigint AS pub_ead_mat,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END), 0)::bigint AS priv_pres_mat,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END), 0)::bigint AS priv_ead_mat,
    -- Cross-breakdowns Concluintes (rede × modalidade)
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END), 0)::bigint AS pub_pres_conc,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END), 0)::bigint AS pub_ead_conc,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END), 0)::bigint AS priv_pres_conc,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END), 0)::bigint AS priv_ead_conc,
    -- Cross-breakdowns Ingressantes (rede × modalidade)
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END), 0)::bigint AS pub_pres_ing,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END), 0)::bigint AS pub_ead_ing,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END), 0)::bigint AS priv_pres_ing,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END), 0)::bigint AS priv_ead_ing
  FROM (
    SELECT 2022 AS ano, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
           qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
           tp_modalidade_ensino, tp_rede FROM inep_2022
    UNION ALL
    SELECT 2023, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
           qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
           tp_modalidade_ensino, tp_rede FROM inep_2023
    UNION ALL
    SELECT 2024, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
           qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
           tp_modalidade_ensino, tp_rede FROM inep_2024
  ) sub
  GROUP BY sub.ano
  ORDER BY sub.ano;

-- 2.2 Totais por Estado e Ano (~81 linhas)
-- Mapas e rankings de UF
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_totais_estado AS
  SELECT
    sub.ano,
    sg_uf AS uf,
    COALESCE(SUM(qt_mat), 0)::bigint   AS matriculas,
    COALESCE(SUM(qt_conc), 0)::bigint  AS concluintes,
    COALESCE(SUM(qt_ing), 0)::bigint   AS ingressantes,
    COUNT(DISTINCT co_ies)::bigint     AS instituicoes,
    COUNT(DISTINCT co_curso)::bigint   AS cursos
  FROM (
    SELECT 2022 AS ano, sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso FROM inep_2022
    UNION ALL
    SELECT 2023, sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso FROM inep_2023
    UNION ALL
    SELECT 2024, sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso FROM inep_2024
  ) sub
  GROUP BY sub.ano, sg_uf
  ORDER BY sub.ano, matriculas DESC;

-- 2.3 Totais por Área CINE e Ano
-- Dropdown de áreas e gráficos por área
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_totais_area AS
  SELECT
    sub.ano,
    no_cine_area_geral AS area,
    COALESCE(SUM(qt_mat), 0)::bigint   AS matriculas,
    COALESCE(SUM(qt_conc), 0)::bigint  AS concluintes,
    COALESCE(SUM(qt_ing), 0)::bigint   AS ingressantes
  FROM (
    SELECT 2022 AS ano, no_cine_area_geral, qt_mat, qt_conc, qt_ing FROM inep_2022
    UNION ALL
    SELECT 2023, no_cine_area_geral, qt_mat, qt_conc, qt_ing FROM inep_2023
    UNION ALL
    SELECT 2024, no_cine_area_geral, qt_mat, qt_conc, qt_ing FROM inep_2024
  ) sub
  WHERE no_cine_area_geral IS NOT NULL
  GROUP BY sub.ano, no_cine_area_geral
  ORDER BY sub.ano, matriculas DESC;

-- Índices nas MVs para acelerar filtros
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_evolucao_ano   ON mv_evolucao_anual (ano);
CREATE INDEX IF NOT EXISTS idx_mv_estado_ano_uf         ON mv_totais_estado (ano, uf);
CREATE INDEX IF NOT EXISTS idx_mv_area_ano              ON mv_totais_area (ano);


-- ============================================================
-- PASSO 3 — FUNÇÕES RPC (usadas pelo dashboard)
-- Sem filtro dinâmico → lê Materialized View (instantâneo)
-- Com filtro dinâmico → consulta tabelas base (com índices)
-- Nomes e colunas 100% compatíveis com o frontend existente
-- ============================================================

-- ─── 3.1 Evolução Anual (filtro opcional por IES) ────────────────────────
DROP FUNCTION IF EXISTS fn_evolucao_anual();
DROP FUNCTION IF EXISTS fn_evolucao_anual(bigint);
DROP FUNCTION IF EXISTS fn_evolucao_anual(bigint, int, text, text);
CREATE OR REPLACE FUNCTION fn_evolucao_anual(
  p_ies bigint DEFAULT NULL,
  p_rede int DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_municipio text DEFAULT NULL
)
RETURNS TABLE (
  ano int, matriculas bigint, concluintes bigint, ingressantes bigint,
  presencial_mat bigint, ead_mat bigint, publica_mat bigint, privada_mat bigint,
  feminino_mat bigint, masculino_mat bigint,
  presencial_conc bigint, ead_conc bigint, publica_conc bigint, privada_conc bigint,
  feminino_conc bigint, masculino_conc bigint,
  presencial_ing bigint, ead_ing bigint, publica_ing bigint, privada_ing bigint,
  feminino_ing bigint, masculino_ing bigint,
  pub_pres_mat bigint, pub_ead_mat bigint, priv_pres_mat bigint, priv_ead_mat bigint,
  pub_pres_conc bigint, pub_ead_conc bigint, priv_pres_conc bigint, priv_ead_conc bigint,
  pub_pres_ing bigint, pub_ead_ing bigint, priv_pres_ing bigint, priv_ead_ing bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET statement_timeout = '20s'
AS $$
BEGIN
  -- Sem filtros → MV (instantâneo)
  IF p_ies IS NULL AND p_rede IS NULL AND p_uf IS NULL AND p_municipio IS NULL THEN
    RETURN QUERY
      SELECT mv.ano::int, mv.matriculas, mv.concluintes, mv.ingressantes,
        mv.presencial_mat, mv.ead_mat, mv.publica_mat, mv.privada_mat,
        mv.feminino_mat, mv.masculino_mat,
        mv.presencial_conc, mv.ead_conc, mv.publica_conc, mv.privada_conc,
        mv.feminino_conc, mv.masculino_conc,
        mv.presencial_ing, mv.ead_ing, mv.publica_ing, mv.privada_ing,
        mv.feminino_ing, mv.masculino_ing,
        mv.pub_pres_mat, mv.pub_ead_mat, mv.priv_pres_mat, mv.priv_ead_mat,
        mv.pub_pres_conc, mv.pub_ead_conc, mv.priv_pres_conc, mv.priv_ead_conc,
        mv.pub_pres_ing, mv.pub_ead_ing, mv.priv_pres_ing, mv.priv_ead_ing
      FROM mv_evolucao_anual mv ORDER BY mv.ano;
  ELSE
    -- Com filtros → tabelas base
    RETURN QUERY
      SELECT sub.ano::int,
        COALESCE(SUM(qt_mat),0)::bigint,
        COALESCE(SUM(qt_conc),0)::bigint,
        COALESCE(SUM(qt_ing),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(qt_mat_fem),0)::bigint,
        COALESCE(SUM(qt_mat_masc),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(qt_conc_fem),0)::bigint,
        COALESCE(SUM(qt_conc_masc),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(qt_ing_fem),0)::bigint,
        COALESCE(SUM(qt_ing_masc),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END),0)::bigint,
        COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END),0)::bigint
      FROM (
        SELECT 2022 AS ano, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
               qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
               tp_modalidade_ensino, tp_rede FROM inep_2022
               WHERE (p_ies IS NULL OR co_ies = p_ies)
                 AND (p_rede IS NULL OR tp_rede = p_rede)
                 AND (p_uf IS NULL OR sg_uf = p_uf)
                 AND (p_municipio IS NULL OR no_municipio = p_municipio)
        UNION ALL
        SELECT 2023, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
               qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
               tp_modalidade_ensino, tp_rede FROM inep_2023
               WHERE (p_ies IS NULL OR co_ies = p_ies)
                 AND (p_rede IS NULL OR tp_rede = p_rede)
                 AND (p_uf IS NULL OR sg_uf = p_uf)
                 AND (p_municipio IS NULL OR no_municipio = p_municipio)
        UNION ALL
        SELECT 2024, qt_mat, qt_conc, qt_ing, qt_mat_fem, qt_mat_masc,
               qt_conc_fem, qt_conc_masc, qt_ing_fem, qt_ing_masc,
               tp_modalidade_ensino, tp_rede FROM inep_2024
               WHERE (p_ies IS NULL OR co_ies = p_ies)
                 AND (p_rede IS NULL OR tp_rede = p_rede)
                 AND (p_uf IS NULL OR sg_uf = p_uf)
                 AND (p_municipio IS NULL OR no_municipio = p_municipio)
      ) sub
      GROUP BY sub.ano
      ORDER BY sub.ano;
  END IF;
END;
$$;


-- ─── 3.2 Indicadores / KPI Cards ────────────────────────────────────────
-- Retorna ano atual + anterior para calcular variação %
DROP FUNCTION IF EXISTS fn_indicadores(int);
DROP FUNCTION IF EXISTS fn_indicadores(int, bigint);
DROP FUNCTION IF EXISTS fn_indicadores(int, bigint, int, text, text);
CREATE OR REPLACE FUNCTION fn_indicadores(
  p_ano int DEFAULT NULL,
  p_ies bigint DEFAULT NULL,
  p_rede int DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_municipio text DEFAULT NULL
)
RETURNS TABLE (
  ano int,
  total_matriculas bigint,
  total_concluintes bigint,
  total_ingressantes bigint,
  total_ies bigint,
  total_cursos bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET statement_timeout = '15s'
AS $$
BEGIN
  -- Sem filtros → MVs (rápido)
  IF p_ies IS NULL AND p_rede IS NULL AND p_uf IS NULL AND p_municipio IS NULL THEN
    RETURN QUERY
      SELECT
        ev.ano,
        ev.matriculas            AS total_matriculas,
        ev.concluintes           AS total_concluintes,
        ev.ingressantes          AS total_ingressantes,
        st.instituicoes          AS total_ies,
        st.cursos                AS total_cursos
      FROM mv_evolucao_anual ev
      JOIN (
        SELECT mv.ano, SUM(mv.instituicoes)::bigint AS instituicoes, SUM(mv.cursos)::bigint AS cursos
        FROM mv_totais_estado mv GROUP BY mv.ano
      ) st ON st.ano = ev.ano
      WHERE p_ano IS NULL
         OR ev.ano = p_ano
         OR ev.ano = p_ano - 1
      ORDER BY ev.ano DESC;
  ELSE
    -- Com filtros → tabelas base
    RETURN QUERY
      SELECT
        sub.ano::int,
        COALESCE(SUM(qt_mat),0)::bigint,
        COALESCE(SUM(qt_conc),0)::bigint,
        COALESCE(SUM(qt_ing),0)::bigint,
        COUNT(DISTINCT co_ies)::bigint,
        COUNT(DISTINCT co_curso)::bigint
      FROM (
        SELECT 2022 AS ano, qt_mat, qt_conc, qt_ing, co_curso, co_ies FROM inep_2022
          WHERE (p_ies IS NULL OR co_ies = p_ies)
            AND (p_rede IS NULL OR tp_rede = p_rede)
            AND (p_uf IS NULL OR sg_uf = p_uf)
            AND (p_municipio IS NULL OR no_municipio = p_municipio)
            AND (p_ano IS NULL OR p_ano = 2022 OR p_ano - 1 = 2022)
        UNION ALL
        SELECT 2023, qt_mat, qt_conc, qt_ing, co_curso, co_ies FROM inep_2023
          WHERE (p_ies IS NULL OR co_ies = p_ies)
            AND (p_rede IS NULL OR tp_rede = p_rede)
            AND (p_uf IS NULL OR sg_uf = p_uf)
            AND (p_municipio IS NULL OR no_municipio = p_municipio)
            AND (p_ano IS NULL OR p_ano = 2023 OR p_ano - 1 = 2023)
        UNION ALL
        SELECT 2024, qt_mat, qt_conc, qt_ing, co_curso, co_ies FROM inep_2024
          WHERE (p_ies IS NULL OR co_ies = p_ies)
            AND (p_rede IS NULL OR tp_rede = p_rede)
            AND (p_uf IS NULL OR sg_uf = p_uf)
            AND (p_municipio IS NULL OR no_municipio = p_municipio)
            AND (p_ano IS NULL OR p_ano = 2024 OR p_ano - 1 = 2024)
      ) sub
      GROUP BY sub.ano
      ORDER BY sub.ano DESC;
  END IF;
END;
$$;


-- ─── 3.3 Distribuição por Estado (filtros dinâmicos opcionais) ──────────
DROP FUNCTION IF EXISTS fn_distribuicao_estados(int);
DROP FUNCTION IF EXISTS fn_distribuicao_estados(int, int, int);
DROP FUNCTION IF EXISTS fn_distribuicao_estados(int, int, int, bigint);
CREATE OR REPLACE FUNCTION fn_distribuicao_estados(
  p_ano        int  DEFAULT NULL,
  p_modalidade int  DEFAULT NULL,
  p_rede       int  DEFAULT NULL,
  p_ies        bigint DEFAULT NULL
)
RETURNS TABLE (
  uf text, matriculas bigint, concluintes bigint,
  ingressantes bigint, instituicoes bigint, cursos bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET statement_timeout = '15s'
AS $$
BEGIN
  -- Sem filtros dinâmicos e sem IES → Materialized View (instantâneo)
  IF p_modalidade IS NULL AND p_rede IS NULL AND p_ies IS NULL THEN
    RETURN QUERY
      SELECT mv.uf, mv.matriculas, mv.concluintes, mv.ingressantes, mv.instituicoes, mv.cursos
      FROM mv_totais_estado mv
      WHERE (p_ano IS NULL OR mv.ano = p_ano)
      ORDER BY mv.matriculas DESC;
  -- Com filtros → tabelas base (com índices)
  ELSE
    RETURN QUERY
      SELECT sg_uf,
        COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
        COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint,
        COUNT(DISTINCT co_curso)::bigint
      FROM (
        SELECT sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso, tp_modalidade_ensino, tp_rede
        FROM inep_2022 WHERE (p_ano IS NULL OR p_ano = 2022)
        UNION ALL
        SELECT sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso, tp_modalidade_ensino, tp_rede
        FROM inep_2023 WHERE (p_ano IS NULL OR p_ano = 2023)
        UNION ALL
        SELECT sg_uf, qt_mat, qt_conc, qt_ing, co_ies, co_curso, tp_modalidade_ensino, tp_rede
        FROM inep_2024 WHERE (p_ano IS NULL OR p_ano = 2024)
      ) base
      WHERE (p_modalidade IS NULL OR tp_modalidade_ensino = p_modalidade)
        AND (p_rede       IS NULL OR tp_rede              = p_rede)
        AND (p_ies        IS NULL OR co_ies               = p_ies)
      GROUP BY sg_uf
      ORDER BY SUM(qt_mat) DESC NULLS LAST;
  END IF;
END;
$$;


-- ─── 3.4 Ranking de Cursos (todos os filtros opcionais) ─────────────────
-- Nomes: presencial_mat, ead_mat, feminino_mat, etc. (compatível)
DROP FUNCTION IF EXISTS fn_ranking_cursos(int);
DROP FUNCTION IF EXISTS fn_ranking_cursos(int, text, int, int, text, int);
DROP FUNCTION IF EXISTS fn_ranking_cursos(int, text, int, int, text, int, bigint);
DROP FUNCTION IF EXISTS fn_ranking_cursos(int, text, int, int, text, int, bigint, text);
CREATE OR REPLACE FUNCTION fn_ranking_cursos(
  p_ano        int  DEFAULT NULL,
  p_uf         text DEFAULT NULL,
  p_modalidade int  DEFAULT NULL,
  p_rede       int  DEFAULT NULL,
  p_area       text DEFAULT NULL,
  p_limit      int  DEFAULT 100,
  p_ies        bigint DEFAULT NULL,
  p_municipio  text DEFAULT NULL
)
RETURNS TABLE (
  nome text, area text, matriculas bigint, concluintes bigint,
  ingressantes bigint, instituicoes bigint,
  presencial_mat bigint, ead_mat bigint,
  publica_mat bigint, privada_mat bigint,
  feminino_mat bigint, masculino_mat bigint,
  pub_pres_mat bigint, pub_ead_mat bigint,
  priv_pres_mat bigint, priv_ead_mat bigint,
  publica_conc bigint, privada_conc bigint,
  publica_ing bigint, privada_ing bigint,
  pub_pres_conc bigint, pub_ead_conc bigint,
  priv_pres_conc bigint, priv_ead_conc bigint,
  pub_pres_ing bigint, pub_ead_ing bigint,
  priv_pres_ing bigint, priv_ead_ing bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '20s'
AS $$
  SELECT
    no_curso, no_cine_area_geral,
    COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint,
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
    -- Concluintes por rede
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_conc ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_conc ELSE 0 END),0)::bigint,
    -- Ingressantes por rede
    COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_ing ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_ing ELSE 0 END),0)::bigint,
    -- Cross-breakdowns Concluintes
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_conc ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_conc ELSE 0 END),0)::bigint,
    -- Cross-breakdowns Ingressantes
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=1 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=1 THEN qt_ing ELSE 0 END),0)::bigint,
    COALESCE(SUM(CASE WHEN tp_rede=2 AND tp_modalidade_ensino=2 THEN qt_ing ELSE 0 END),0)::bigint
  FROM (
    SELECT * FROM inep_2022 WHERE (p_ano IS NULL OR p_ano = 2022)
    UNION ALL
    SELECT * FROM inep_2023 WHERE (p_ano IS NULL OR p_ano = 2023)
    UNION ALL
    SELECT * FROM inep_2024 WHERE (p_ano IS NULL OR p_ano = 2024)
  ) base
  WHERE (p_uf         IS NULL OR sg_uf                = p_uf)
    AND (p_modalidade IS NULL OR tp_modalidade_ensino = p_modalidade)
    AND (p_rede       IS NULL OR tp_rede              = p_rede)
    AND (p_area       IS NULL OR no_cine_area_geral   = p_area)
    AND (p_ies        IS NULL OR co_ies               = p_ies)
    AND (p_municipio  IS NULL OR no_municipio          = p_municipio)
  GROUP BY no_curso, no_cine_area_geral
  ORDER BY SUM(qt_mat) DESC NULLS LAST
  LIMIT p_limit;
$$;


-- ─── 3.5 Instituições (filtros dinâmicos opcionais) ─────────────────────
DROP FUNCTION IF EXISTS fn_instituicoes(int);
DROP FUNCTION IF EXISTS fn_instituicoes(int, text, int, int, int);
DROP FUNCTION IF EXISTS fn_instituicoes(int, text, int, int, int, text);
CREATE OR REPLACE FUNCTION fn_instituicoes(
  p_ano        int  DEFAULT NULL,
  p_uf         text DEFAULT NULL,
  p_modalidade int  DEFAULT NULL,
  p_rede       int  DEFAULT NULL,
  p_limit      int  DEFAULT 5000,
  p_municipio  text DEFAULT NULL
)
RETURNS TABLE (
  cod_ies bigint, nome text, sigla text, tipo int, uf text,
  cursos bigint, matriculas bigint, concluintes bigint, ingressantes bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '20s'
AS $$
  SELECT
    co_ies::bigint, MAX(no_ies), MAX(sg_ies), MAX(tp_rede),
    (ARRAY_AGG(sg_uf ORDER BY qt_mat DESC NULLS LAST))[1],
    COUNT(DISTINCT co_curso)::bigint,
    COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint
  FROM (
    SELECT * FROM inep_2022 WHERE (p_ano IS NULL OR p_ano = 2022)
    UNION ALL
    SELECT * FROM inep_2023 WHERE (p_ano IS NULL OR p_ano = 2023)
    UNION ALL
    SELECT * FROM inep_2024 WHERE (p_ano IS NULL OR p_ano = 2024)
  ) base
  WHERE (p_uf         IS NULL OR sg_uf                = p_uf)
    AND (p_modalidade IS NULL OR tp_modalidade_ensino = p_modalidade)
    AND (p_rede       IS NULL OR tp_rede              = p_rede)
    AND (p_municipio  IS NULL OR no_municipio          = p_municipio)
  GROUP BY co_ies
  ORDER BY SUM(qt_mat) DESC NULLS LAST
  LIMIT p_limit;
$$;


-- ─── 3.6 Cidades por Estado (drill-down, filtros opcionais) ─────────────
DROP FUNCTION IF EXISTS fn_cidades_estado(int, text);
DROP FUNCTION IF EXISTS fn_cidades_estado(int, text, int, int);
DROP FUNCTION IF EXISTS fn_cidades_estado(int, text, int, int, bigint);
CREATE OR REPLACE FUNCTION fn_cidades_estado(
  p_ano        int,
  p_uf         text,
  p_modalidade int  DEFAULT NULL,
  p_rede       int  DEFAULT NULL,
  p_ies        bigint DEFAULT NULL
)
RETURNS TABLE (
  municipio text, matriculas bigint, concluintes bigint,
  ingressantes bigint, instituicoes bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '15s'
AS $$
  SELECT
    no_municipio,
    COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint
  FROM (
    SELECT * FROM inep_2022 WHERE p_ano = 2022
    UNION ALL
    SELECT * FROM inep_2023 WHERE p_ano = 2023
    UNION ALL
    SELECT * FROM inep_2024 WHERE p_ano = 2024
  ) base
  WHERE sg_uf = p_uf
    AND (p_modalidade IS NULL OR tp_modalidade_ensino = p_modalidade)
    AND (p_rede       IS NULL OR tp_rede              = p_rede)
    AND (p_ies        IS NULL OR co_ies               = p_ies)
  GROUP BY no_municipio
  HAVING SUM(qt_mat) > 0
  ORDER BY SUM(qt_mat) DESC NULLS LAST;
$$;


-- ─── 3.7 Anos Disponíveis ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS fn_anos_disponiveis();
CREATE OR REPLACE FUNCTION fn_anos_disponiveis()
RETURNS TABLE (ano int)
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '5s'
AS $$
  SELECT mv.ano FROM mv_evolucao_anual mv ORDER BY 1;
$$;


-- ─── 3.8 Áreas Disponíveis ──────────────────────────────────────────────
DROP FUNCTION IF EXISTS fn_areas_disponiveis();
CREATE OR REPLACE FUNCTION fn_areas_disponiveis()
RETURNS TABLE (area text)
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '5s'
AS $$
  SELECT DISTINCT mv.area FROM mv_totais_area mv
  WHERE mv.area IS NOT NULL ORDER BY 1;
$$;


-- ─── 3.9 Filtros Disponíveis (bônus — popula todos os dropdowns) ────────
DROP FUNCTION IF EXISTS fn_filtros_disponiveis();
CREATE OR REPLACE FUNCTION fn_filtros_disponiveis()
RETURNS TABLE (anos int[], ufs text[], areas text[])
LANGUAGE sql STABLE SECURITY DEFINER SET statement_timeout = '5s'
AS $$
  SELECT
    ARRAY(SELECT mv.ano FROM mv_evolucao_anual mv ORDER BY 1),
    ARRAY(SELECT DISTINCT mv.uf FROM mv_totais_estado mv ORDER BY 1),
    ARRAY(SELECT DISTINCT mv.area FROM mv_totais_area mv WHERE mv.area IS NOT NULL ORDER BY 1);
$$;


-- ============================================================
-- PASSO 4 — REFRESH DAS MATERIALIZED VIEWS
-- Função master para atualizar tudo (rodar quando importar
-- dados novos do INEP, ou seja, ~1x por ano)
-- ============================================================

DROP FUNCTION IF EXISTS fn_refresh_views();
DROP FUNCTION IF EXISTS fn_refresh_cache_all();
CREATE OR REPLACE FUNCTION fn_refresh_views()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET statement_timeout = '300s'
AS $$
DECLARE
  t_start timestamptz := clock_timestamp();
BEGIN
  REFRESH MATERIALIZED VIEW mv_evolucao_anual;
  REFRESH MATERIALIZED VIEW mv_totais_estado;
  REFRESH MATERIALIZED VIEW mv_totais_area;
  RETURN 'Views atualizadas em ' || round(extract(epoch from (clock_timestamp() - t_start))::numeric, 1) || 's';
END;
$$;


-- ============================================================
-- PERMISSÕES (leitura anônima nas MVs para o SDK do Supabase)
-- ============================================================
GRANT SELECT ON mv_evolucao_anual TO anon, authenticated;
GRANT SELECT ON mv_totais_estado  TO anon, authenticated;
GRANT SELECT ON mv_totais_area    TO anon, authenticated;


-- ============================================================
-- APÓS EXECUTAR ESTE SCRIPT, RODE:
--   SELECT fn_refresh_views();
-- Isso pré-computa tudo (~30-60s). Depois o dashboard responde
-- em <5ms para todas as queries sem filtro dinâmico.
--
-- No TypeScript:
--   supabase.rpc('fn_evolucao_anual')                          // igual antes
--   supabase.rpc('fn_indicadores', { p_ano: 2024 })            // igual antes
--   supabase.rpc('fn_ranking_cursos', { p_ano: 2024 })         // igual antes
--   supabase.rpc('fn_ranking_cursos', { p_ano: 2024, p_uf: 'SP', p_area: 'Educação' })  // NOVO: filtros!
-- ============================================================
