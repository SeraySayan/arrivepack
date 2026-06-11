-- destination_basic_drafts
--
-- Stores AI-generated basic planning drafts for unsupported destinations.
-- These are NEVER verified packs. Every draft is clearly marked as
-- low-confidence and unverified.
--
-- Purpose:
--   * Cache OpenRouter results so the same destination is not regenerated.
--   * Track demand to inform which destination packs to build next.
--   * Provide consistent draft content for repeat searches.

create table if not exists destination_basic_drafts (
  id                    uuid         primary key default gen_random_uuid(),

  -- Human-readable name as entered by the user, title-cased by the function.
  destination_name      text         not null,
  -- Normalised slug used for cache lookup, e.g. "japan", "new-york".
  destination_slug      text         not null unique,

  country_name          text,
  city_name             text,

  -- Always 'basic_draft'. Never 'verified_pack'.
  status                text         not null default 'basic_draft',
  verified              boolean      not null default false,
  confidence            text         not null default 'low',

  -- Full draft JSON as returned by OpenRouter and stored for re-use.
  draft_json            jsonb        not null,

  -- 'openrouter' when first generated; 'database_cache' is NOT stored here
  -- (that is a response-time label only).
  provider              text         not null default 'openrouter',
  model                 text,

  source                text         default 'welcome_search',

  created_at            timestamptz  not null default now(),
  updated_at            timestamptz  not null default now(),
  -- Updated on every cache hit so we can see recency.
  last_used_at          timestamptz,
  -- Incremented on every cache hit.
  usage_count           integer      not null default 1,

  -- Flags for future human review / verification pipeline.
  requires_manual_review boolean     not null default true,
  review_status         text         not null default 'unreviewed'
);

-- Fast slug lookup (the main cache key).
create index if not exists destination_basic_drafts_slug_idx
  on destination_basic_drafts (destination_slug);

-- Lets us quickly find the most-requested destinations to prioritise
-- verified pack creation.
create index if not exists destination_basic_drafts_usage_count_idx
  on destination_basic_drafts (usage_count desc);
