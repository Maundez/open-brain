-- ============================================================
-- Open Brain — Thoughts Cleanup Script
-- Generated: April 2026
-- Run on: plexserver, against Supabase postgres
-- Connection: psql $DATABASE_URL (from .env or Supabase dashboard)
-- ============================================================
-- IMPORTANT: Run each section independently and verify row counts
-- before proceeding to the next. Use the CHECK queries first.
-- ============================================================


-- ============================================================
-- SECTION 1: RETIRE STALE THOUGHTS
-- Sets metadata->>'status' = 'superseded' by content match.
-- These thoughts are retained for audit but hidden from search.
-- ============================================================

-- 1A: SMSF Income Tracking — XML pipeline architecture (March 2026)
--     Superseded by: April 2026 architecture correction + project closure thoughts

-- CHECK first (should return ~14 rows):
/*
SELECT id, created_at, LEFT(content, 80)
FROM thoughts
WHERE content ILIKE ANY(ARRAY[
  '%SMSF Income Tracking — architecture summary%',
  '%SMSF Income Tracking — Input architecture%',
  '%SMSF Income Tracking — Output architecture%',
  '%SMSF Income Tracking — Excel workbook schema%',
  '%SMSF Income Tracking — Document types handled%',
  '%SMSF Income Tracking — next steps as of 31 March%',
  '%SMSF Income Tracking — Live run results%',
  '%SMSF Income Tracking — build status as of 31 March%',
  '%SMSF Income Tracking — Modules built and test counts%',
  '%SMSF Income Tracking — Computershare live run batch%',
  '%SMSF Income Tracking — portfolio identification%',
  '%SMSF Income Tracking — Security and configuration%',
  '%SMSF Income Tracking — IncomeRecord dataclass%',
  '%SMSF Income Tracking project — pivot completed March 2026%'
])
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');
*/

UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"XML pipeline architecture retired April 2026. Superseded by db-portfolio (Streamlit/PostgreSQL). See PROJECT CLOSED thought April 13 2026."'
)
WHERE content ILIKE ANY(ARRAY[
  '%SMSF Income Tracking — architecture summary%',
  '%SMSF Income Tracking — Input architecture%',
  '%SMSF Income Tracking — Output architecture%',
  '%SMSF Income Tracking — Excel workbook schema%',
  '%SMSF Income Tracking — Document types handled%',
  '%SMSF Income Tracking — next steps as of 31 March%',
  '%SMSF Income Tracking — Live run results%',
  '%SMSF Income Tracking — build status as of 31 March%',
  '%SMSF Income Tracking — Modules built and test counts%',
  '%SMSF Income Tracking — Computershare live run batch%',
  '%SMSF Income Tracking — portfolio identification%',
  '%SMSF Income Tracking — Security and configuration%',
  '%SMSF Income Tracking — IncomeRecord dataclass%',
  '%SMSF Income Tracking project — pivot completed March 2026%'
])
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1B: SMSF Income Tracking — SMSF project charter (March 2026)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Original SMSF Income Tracking project charter. Project closed April 2026, superseded by db-portfolio."'
)
WHERE content ILIKE '%SMSF Income Tracking Project — Architecture pivot completed March 2026%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1C: SMSF Income Register standalone spreadsheet (March 2026)
--     Superseded by PostgreSQL as single source of truth
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Standalone SMSF Income Register spreadsheet approach abandoned. PostgreSQL income_details is the source of truth."'
)
WHERE content ILIKE '%SMSF Income Register project — new standalone spreadsheet%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1D: Dividend Processing — strategic pivot to Income Register tab (March 2026)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Income Register tab in FY26_Financial_Reports.xlsx approach superseded by PostgreSQL db-portfolio."'
)
WHERE content ILIKE '%Dividend Processing project — strategic pivot (2026-03-29)%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1E: Early Dividend Processing pipeline — Ollama/Docling/pdfplumber (March 2026)
--     Superseded by Claude Cowork JSON extraction approach
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Early LLM/Docling/pdfplumber pipeline. Superseded by Claude Cowork direct PDF extraction to JSON."'
)
WHERE content ILIKE ANY(ARRAY[
  '%pdfplumber vs Docling diagnostic%',
  '%Docling replaced with pdfplumber%',
  '%FINAL ARCHITECTURE DECISION: Local hybrid approach using Docling%',
  '%Ollama model inventory: deepseek-r1%',
  '%environment fully verified and ready for extractor.py%',
  '%Phase 2 (extractor.py) COMPLETE%',
  '%Docling produces inconsistent markdown output%',
  '%Docling table misalignment fix%',
  '%UAT validation session (2026-03-29)%'
])
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1F: SMSF workflow reference using old Portfolio_Income.xlsx approach (April 9)
--     This one references "xml pipeline (PDF X-Change XML intermediate step)" — stale
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"SMSF income workflow reference using retired Portfolio_Income.xlsx and XML pipeline. Superseded by Cowork+PostgreSQL workflow."'
)
WHERE content ILIKE '%xml pipeline (PDF X-Change XML intermediate step%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1G: Financial tracking automation — original Gemini migration note (March 24)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Original project migration note from Gemini. Superseded by all subsequent architecture decisions."'
)
WHERE content ILIKE '%Migrating from Excel-heavy tracking to a Python/Navexa-based automated workflow%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1H: Vercel deployment thoughts — superseded by NUC self-hosting
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Vercel deployment plan superseded. App deployed to GMKtec NUC via Docker + Cloudflare Tunnel at brain.maundez.uk."'
)
WHERE content ILIKE ANY(ARRAY[
  '%PROJECT BRIEF: Digital Brain "Human Door" Web App (for Claude Code)%',
  '%ARCHITECTURE DECISIONS: Digital Brain Full Stack — Final Clarity%',
  '%Phase 1 (now): Deploy Digital Brain to Vercel (temporary)%',
  '%CORRECTION to Digital Brain "Human Door" development status%'
])
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1I: Stale task — extract web/ to standalone repo (already done)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Completed. web/ extracted to Maundez/open-brain-ui repo. Docker deployed to NUC."'
)
WHERE content ILIKE '%ARCHITECTURE NOTE: Digital Brain web app (Next.js) was built inside the open-brain Supabase project under web/%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1J: Infrastructure decisions — NUC still on Windows, Vercel Phase 1 (April 8)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Stale infrastructure decisions. NUC migrated to Ubuntu, app deployed to NUC. Vercel never used."'
)
WHERE content ILIKE '%INFRASTRUCTURE DECISIONS: DTS Solutions Home Lab & Hosting%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1K: Digital Brain dev status with "Deploy to Vercel" next step (April 8)
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Stale dev status. App fully deployed to brain.maundez.uk. Vercel never used."'
)
WHERE content ILIKE '%Digital Brain "Human Door" web app — development status as of 2026-04-08%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- 1L: Master roadmap April 12 — pre-deployment, references brain.dtssolutions.com.au
--     Superseded by actual deployment summary April 13
UPDATE thoughts
SET metadata = jsonb_set(
    jsonb_set(metadata, '{status}', '"superseded"'),
    '{superseded_reason}', '"Pre-deployment roadmap. Superseded by April 13 deployment milestone. App live at brain.maundez.uk."'
)
WHERE content ILIKE '%MASTER ROADMAP: Digital Brain & NUC Infrastructure — Updated April 12 2026%'
AND (metadata->>'status' IS NULL OR metadata->>'status' != 'superseded');


-- ============================================================
-- SECTION 2: NORMALISE TOPICS
-- Consolidates duplicate/variant topic tags in metadata->topics
-- ============================================================

-- 2A: dividend processing → Dividend Processing (case fix)
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN lower(t::text) = '"dividend processing"' THEN '"Dividend Processing"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' @> '["dividend processing"]';


-- 2B: SMSF Income Tracking → SMSF
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text = '"SMSF Income Tracking"' THEN '"SMSF"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' @> '["SMSF Income Tracking"]';


-- 2C: Digital Brain → Open Brain (naming update)
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text = '"Digital Brain"' THEN '"Open Brain"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' @> '["Digital Brain"]';


-- 2D: Architecture variants → Architecture
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text IN ('"Architecture Decisions"', '"Architecture decision"', '"Architectural Decision"', '"architecture"', '"Architecture Decisions"')
                    THEN '"Architecture"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' ?| ARRAY[
    'Architecture Decisions', 'Architecture decision',
    'Architectural Decision', 'architecture'
];


-- 2E: AI variants → AI
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text IN ('"AI Models"', '"AI models"', '"AI Services"', '"AI setup"', '"AI Protocol"')
                    THEN '"AI"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' ?| ARRAY[
    'AI Models', 'AI models', 'AI Services', 'AI setup', 'AI Protocol'
];


-- 2F: exercise recovery / exercise_recovery_nutrition → split into exercise + nutrition
--     Remove compound tags, keep atomic ones
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(t)
        FROM jsonb_array_elements(metadata->'topics') t
        WHERE t::text NOT IN ('"exercise recovery"', '"exercise_recovery_nutrition"', '"exercise recovery nutrition"')
    )
)
WHERE metadata->'topics' ?| ARRAY[
    'exercise recovery', 'exercise_recovery_nutrition', 'exercise recovery nutrition'
];


-- 2G: web app development variants → Web Development
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text IN ('"web app deployment"', '"web development"', '"Web App Development"')
                    THEN '"Web Development"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' ?| ARRAY[
    'web app deployment', 'web development', 'Web App Development'
];


-- 2H: income tracking variants → Income Tracking
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN t::text IN ('"income tracking"', '"Income Tracking"', '"Income Register"')
                    THEN '"Income Tracking"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE metadata->'topics' ?| ARRAY[
    'income tracking', 'Income Tracking', 'Income Register'
];


-- 2I: deduplicate topics within each row (remove dupes created by consolidation above)
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{topics}',
    (
        SELECT jsonb_agg(DISTINCT t)
        FROM jsonb_array_elements(metadata->'topics') t
    )
)
WHERE jsonb_array_length(metadata->'topics') != (
    SELECT count(DISTINCT t)
    FROM jsonb_array_elements(metadata->'topics') t
);


-- ============================================================
-- SECTION 3: NORMALISE PEOPLE
-- Standardises name variants in metadata->people
-- ============================================================

-- CHECK first:
/*
SELECT DISTINCT jsonb_array_elements_text(metadata->'people') AS person
FROM thoughts
ORDER BY 1;
*/

UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{people}',
    (
        SELECT jsonb_agg(
            CASE
                WHEN lower(t #>> '{}') IN ('stephen', 'stephen maunder', 'steve')
                    THEN '"Steve"'::jsonb
                WHEN lower(t #>> '{}') IN ('brad seeto', 'brad')
                    THEN '"Brad Seeto"'::jsonb
                WHEN lower(t #>> '{}') IN ('dianne', 'di')
                    THEN '"Dianne"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'people') t
    )
)
WHERE metadata->'people' IS NOT NULL
  AND jsonb_array_length(metadata->'people') > 0;


-- Deduplicate people within each row
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{people}',
    (
        SELECT jsonb_agg(DISTINCT t)
        FROM jsonb_array_elements(metadata->'people') t
    )
)
WHERE metadata->'people' IS NOT NULL
  AND jsonb_array_length(metadata->'people') != (
    SELECT count(DISTINCT t)
    FROM jsonb_array_elements(metadata->'people') t
);


-- ============================================================
-- SECTION 4: VERIFICATION QUERIES
-- Run these after the updates to confirm results
-- ============================================================

-- 4A: Count of superseded thoughts (expect ~25-30)
-- SELECT count(*) FROM thoughts WHERE metadata->>'status' = 'superseded';

-- 4B: Remaining distinct topics (expect ~40-50, clean)
-- SELECT DISTINCT jsonb_array_elements_text(metadata->'topics') AS topic
-- FROM thoughts
-- WHERE metadata->>'status' IS DISTINCT FROM 'superseded'
-- ORDER BY 1;

-- 4C: Remaining distinct people (expect: Steve, Brad, Dianne, Nick, Claude Cowork, wife)
-- SELECT DISTINCT jsonb_array_elements_text(metadata->'people') AS person
-- FROM thoughts
-- WHERE metadata->>'status' IS DISTINCT FROM 'superseded'
-- ORDER BY 1;

-- 4D: Topic counts post-cleanup
-- SELECT jsonb_array_elements_text(metadata->'topics') AS topic, count(*) AS n
-- FROM thoughts
-- WHERE metadata->>'status' IS DISTINCT FROM 'superseded'
-- GROUP BY 1
-- ORDER BY 2 DESC
-- LIMIT 20;