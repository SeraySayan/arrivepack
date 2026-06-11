-- destination_pack_requests
--
-- Records every "Request verified pack" action from the app.
-- Used to track demand and prioritise which destination to build next.
-- Each row is an individual user request event (not deduplicated).

create table if not exists destination_pack_requests (
  id                uuid        primary key default gen_random_uuid(),
  destination_name  text        not null,
  destination_slug  text        not null,
  action            text        not null default 'request_pack',
  source            text        default 'welcome_search',
  created_at        timestamptz not null default now()
);

-- Fast lookup by slug to count requests per destination.
create index if not exists destination_pack_requests_slug_idx
  on destination_pack_requests (destination_slug);
