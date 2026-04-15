-- People normalisation patch
-- Dianne Saker + wife → Dianne
UPDATE thoughts
SET metadata = jsonb_set(
    metadata,
    '{people}',
    (
        SELECT jsonb_agg(DISTINCT
            CASE
                WHEN lower(t #>> '{}') IN ('dianne saker', 'wife') THEN '"Dianne"'::jsonb
                ELSE t
            END
        )
        FROM jsonb_array_elements(metadata->'people') t
    )
)
WHERE metadata->'people' ?| ARRAY['Dianne Saker', 'wife'];
