-- ============================================
-- Funções SQL — Análise de Mercado (Supabase)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ─── 0. ÍNDICES (executar PRIMEIRO) ─────────
-- A view inep_consolidado é UNION ALL de inep_2022, inep_2023, inep_2024
-- Índices devem ser criados nas tabelas base

-- inep_2022
CREATE INDEX IF NOT EXISTS idx_inep2022_ano ON inep_2022 (nu_ano_censo);
CREATE INDEX IF NOT EXISTS idx_inep2022_uf ON inep_2022 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2022_rede ON inep_2022 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2022_modalidade ON inep_2022 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2022_curso ON inep_2022 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2022_ies ON inep_2022 (co_ies);
CREATE INDEX IF NOT EXISTS idx_inep2022_area ON inep_2022 (no_cine_area_geral);

-- inep_2023
CREATE INDEX IF NOT EXISTS idx_inep2023_ano ON inep_2023 (nu_ano_censo);
CREATE INDEX IF NOT EXISTS idx_inep2023_uf ON inep_2023 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2023_rede ON inep_2023 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2023_modalidade ON inep_2023 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2023_curso ON inep_2023 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2023_ies ON inep_2023 (co_ies);
CREATE INDEX IF NOT EXISTS idx_inep2023_area ON inep_2023 (no_cine_area_geral);

-- inep_2024
CREATE INDEX IF NOT EXISTS idx_inep2024_ano ON inep_2024 (nu_ano_censo);
CREATE INDEX IF NOT EXISTS idx_inep2024_uf ON inep_2024 (sg_uf);
CREATE INDEX IF NOT EXISTS idx_inep2024_rede ON inep_2024 (tp_rede);
CREATE INDEX IF NOT EXISTS idx_inep2024_modalidade ON inep_2024 (tp_modalidade_ensino);
CREATE INDEX IF NOT EXISTS idx_inep2024_curso ON inep_2024 (no_curso);
CREATE INDEX IF NOT EXISTS idx_inep2024_ies ON inep_2024 (co_ies);
CREATE INDEX IF NOT EXISTS idx_inep2024_area ON inep_2024 (no_cine_area_geral);

-- ─── 1. Evolução Anual ──────────────────────
-- Consulta diretamente as tabelas base (view causa timeout)
CREATE OR REPLACE FUNCTION fn_evolucao_anual()
RETURNS TABLE (
  ano int,
  matriculas bigint,
  concluintes bigint,
  ingressantes bigint,
  presencial_mat bigint,
  ead_mat bigint,
  publica_mat bigint,
  privada_mat bigint,
  feminino_mat bigint,
  masculino_mat bigint
) AS $$
  SELECT * FROM (
    SELECT 2022 AS ano,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2022
    UNION ALL
    SELECT 2023 AS ano,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2023
    UNION ALL
    SELECT 2024 AS ano,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2024
  ) sub ORDER BY ano;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 2. Distribuição por Estado ─────────────
CREATE OR REPLACE FUNCTION fn_distribuicao_estados(p_ano int)
RETURNS TABLE (
  uf text,
  matriculas bigint,
  concluintes bigint,
  ingressantes bigint,
  instituicoes bigint,
  cursos bigint
) AS $$
  SELECT sg_uf, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint, COUNT(DISTINCT co_curso)::bigint
  FROM inep_2022 WHERE p_ano = 2022
  GROUP BY sg_uf
  UNION ALL
  SELECT sg_uf, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint, COUNT(DISTINCT co_curso)::bigint
  FROM inep_2023 WHERE p_ano = 2023
  GROUP BY sg_uf
  UNION ALL
  SELECT sg_uf, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
    COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint, COUNT(DISTINCT co_curso)::bigint
  FROM inep_2024 WHERE p_ano = 2024
  GROUP BY sg_uf
  ORDER BY 2 DESC;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 3. Ranking de Cursos ───────────────────
CREATE OR REPLACE FUNCTION fn_ranking_cursos(p_ano int)
RETURNS TABLE (
  nome text,
  area text,
  matriculas bigint,
  concluintes bigint,
  ingressantes bigint,
  instituicoes bigint,
  presencial_mat bigint,
  ead_mat bigint,
  publica_mat bigint,
  privada_mat bigint,
  feminino_mat bigint,
  masculino_mat bigint
) AS $$
  SELECT * FROM (
    SELECT no_curso, no_cine_area_geral,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COUNT(DISTINCT co_ies)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2022 WHERE p_ano = 2022
    GROUP BY no_curso, no_cine_area_geral
    UNION ALL
    SELECT no_curso, no_cine_area_geral,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COUNT(DISTINCT co_ies)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2023 WHERE p_ano = 2023
    GROUP BY no_curso, no_cine_area_geral
    UNION ALL
    SELECT no_curso, no_cine_area_geral,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint,
      COUNT(DISTINCT co_ies)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_modalidade_ensino=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=1 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(CASE WHEN tp_rede=2 THEN qt_mat ELSE 0 END),0)::bigint,
      COALESCE(SUM(qt_mat_fem),0)::bigint, COALESCE(SUM(qt_mat_masc),0)::bigint
    FROM inep_2024 WHERE p_ano = 2024
    GROUP BY no_curso, no_cine_area_geral
  ) sub ORDER BY 3 DESC LIMIT 100;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 4. Instituições ─────────────────────────
CREATE OR REPLACE FUNCTION fn_instituicoes(p_ano int)
RETURNS TABLE (
  cod_ies bigint,
  nome text,
  sigla text,
  tipo int,
  uf text,
  cursos bigint,
  matriculas bigint,
  concluintes bigint,
  ingressantes bigint
) AS $$
  SELECT * FROM (
    SELECT co_ies::bigint, MAX(no_ies), MAX(sg_ies), tp_rede,
      (ARRAY_AGG(sg_uf ORDER BY qt_mat DESC NULLS LAST))[1],
      COUNT(DISTINCT co_curso)::bigint,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint
    FROM inep_2022 WHERE p_ano = 2022
    GROUP BY co_ies, tp_rede
    UNION ALL
    SELECT co_ies::bigint, MAX(no_ies), MAX(sg_ies), tp_rede,
      (ARRAY_AGG(sg_uf ORDER BY qt_mat DESC NULLS LAST))[1],
      COUNT(DISTINCT co_curso)::bigint,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint
    FROM inep_2023 WHERE p_ano = 2023
    GROUP BY co_ies, tp_rede
    UNION ALL
    SELECT co_ies::bigint, MAX(no_ies), MAX(sg_ies), tp_rede,
      (ARRAY_AGG(sg_uf ORDER BY qt_mat DESC NULLS LAST))[1],
      COUNT(DISTINCT co_curso)::bigint,
      COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint, COALESCE(SUM(qt_ing),0)::bigint
    FROM inep_2024 WHERE p_ano = 2024
    GROUP BY co_ies, tp_rede
  ) sub ORDER BY 7 DESC LIMIT 50;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 5. Cidades por Estado (drill-down) ─────
CREATE OR REPLACE FUNCTION fn_cidades_estado(p_ano int, p_uf text)
RETURNS TABLE (
  municipio text,
  matriculas bigint,
  concluintes bigint,
  ingressantes bigint,
  instituicoes bigint
) AS $$
  SELECT * FROM (
    SELECT no_municipio, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
      COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint
    FROM inep_2022 WHERE p_ano = 2022 AND sg_uf = p_uf
    GROUP BY no_municipio
    UNION ALL
    SELECT no_municipio, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
      COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint
    FROM inep_2023 WHERE p_ano = 2023 AND sg_uf = p_uf
    GROUP BY no_municipio
    UNION ALL
    SELECT no_municipio, COALESCE(SUM(qt_mat),0)::bigint, COALESCE(SUM(qt_conc),0)::bigint,
      COALESCE(SUM(qt_ing),0)::bigint, COUNT(DISTINCT co_ies)::bigint
    FROM inep_2024 WHERE p_ano = 2024 AND sg_uf = p_uf
    GROUP BY no_municipio
  ) sub ORDER BY 2 DESC LIMIT 30;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 6. Anos Disponíveis ────────────────────
CREATE OR REPLACE FUNCTION fn_anos_disponiveis()
RETURNS TABLE (ano int) AS $$
  SELECT 2022 UNION ALL SELECT 2023 UNION ALL SELECT 2024 ORDER BY 1;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 7. Áreas Disponíveis ───────────────────
CREATE OR REPLACE FUNCTION fn_areas_disponiveis()
RETURNS TABLE (area text) AS $$
  SELECT DISTINCT no_cine_area_geral FROM inep_2024
  WHERE no_cine_area_geral IS NOT NULL
  ORDER BY 1;
$$ LANGUAGE sql STABLE
SECURITY DEFINER
SET statement_timeout = '30s';

-- ─── 8. Indicadores (KPI Cards) ─────────────
-- Usa PL/pgSQL para consultar APENAS as tabelas necessárias
-- Separa SUM (rápido) de COUNT DISTINCT (lento) para evitar timeout
CREATE OR REPLACE FUNCTION fn_indicadores(p_ano int)
RETURNS TABLE (
  ano int,
  total_matriculas bigint,
  total_concluintes bigint,
  total_ingressantes bigint,
  total_ies bigint,
  total_cursos bigint
) AS $$
DECLARE
  v_mat bigint; v_conc bigint; v_ing bigint; v_ies bigint; v_cur bigint;
  v_mat2 bigint; v_conc2 bigint; v_ing2 bigint; v_ies2 bigint; v_cur2 bigint;
BEGIN
  -- Ano atual
  IF p_ano = 2022 THEN
    SELECT COALESCE(SUM(qt_mat),0), COALESCE(SUM(qt_conc),0), COALESCE(SUM(qt_ing),0)
    INTO v_mat, v_conc, v_ing FROM inep_2022;
    SELECT COUNT(DISTINCT co_ies), COUNT(DISTINCT co_curso)
    INTO v_ies, v_cur FROM inep_2022;
    ano := 2022; total_matriculas := v_mat; total_concluintes := v_conc;
    total_ingressantes := v_ing; total_ies := v_ies; total_cursos := v_cur;
    RETURN NEXT;
  ELSIF p_ano = 2023 THEN
    SELECT COALESCE(SUM(qt_mat),0), COALESCE(SUM(qt_conc),0), COALESCE(SUM(qt_ing),0)
    INTO v_mat, v_conc, v_ing FROM inep_2023;
    SELECT COUNT(DISTINCT co_ies), COUNT(DISTINCT co_curso)
    INTO v_ies, v_cur FROM inep_2023;
    ano := 2023; total_matriculas := v_mat; total_concluintes := v_conc;
    total_ingressantes := v_ing; total_ies := v_ies; total_cursos := v_cur;
    RETURN NEXT;
    -- Ano anterior
    SELECT COALESCE(SUM(qt_mat),0), COALESCE(SUM(qt_conc),0), COALESCE(SUM(qt_ing),0)
    INTO v_mat2, v_conc2, v_ing2 FROM inep_2022;
    SELECT COUNT(DISTINCT co_ies), COUNT(DISTINCT co_curso)
    INTO v_ies2, v_cur2 FROM inep_2022;
    ano := 2022; total_matriculas := v_mat2; total_concluintes := v_conc2;
    total_ingressantes := v_ing2; total_ies := v_ies2; total_cursos := v_cur2;
    RETURN NEXT;
  ELSIF p_ano = 2024 THEN
    SELECT COALESCE(SUM(qt_mat),0), COALESCE(SUM(qt_conc),0), COALESCE(SUM(qt_ing),0)
    INTO v_mat, v_conc, v_ing FROM inep_2024;
    SELECT COUNT(DISTINCT co_ies), COUNT(DISTINCT co_curso)
    INTO v_ies, v_cur FROM inep_2024;
    ano := 2024; total_matriculas := v_mat; total_concluintes := v_conc;
    total_ingressantes := v_ing; total_ies := v_ies; total_cursos := v_cur;
    RETURN NEXT;
    -- Ano anterior
    SELECT COALESCE(SUM(qt_mat),0), COALESCE(SUM(qt_conc),0), COALESCE(SUM(qt_ing),0)
    INTO v_mat2, v_conc2, v_ing2 FROM inep_2023;
    SELECT COUNT(DISTINCT co_ies), COUNT(DISTINCT co_curso)
    INTO v_ies2, v_cur2 FROM inep_2023;
    ano := 2023; total_matriculas := v_mat2; total_concluintes := v_conc2;
    total_ingressantes := v_ing2; total_ies := v_ies2; total_cursos := v_cur2;
    RETURN NEXT;
  END IF;
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET statement_timeout = '60s';
