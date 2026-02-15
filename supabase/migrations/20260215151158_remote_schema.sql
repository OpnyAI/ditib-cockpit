drop extension if exists "pg_net";

create type "public"."category_scope" as enum ('INCOME', 'EXPENSE', 'BOTH');

create type "public"."notification_audience" as enum ('PUBLIC_MEMBERS', 'INTERNAL_BOARD');

create type "public"."notification_status" as enum ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

create type "public"."post_kind" as enum ('MESSAGE', 'ANNOUNCEMENT');

create type "public"."subscriber_status" as enum ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

create type "public"."transaction_type" as enum ('INCOME', 'EXPENSE');

create type "public"."visibility" as enum ('INTERNAL', 'PUBLIC');


  create table "public"."activity_log" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "actor_user_id" uuid,
    "action" text not null,
    "entity_type" text not null,
    "entity_id" uuid not null,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "actor_name" text,
    "visibility" text default 'INTERNAL'::text
      );


alter table "public"."activity_log" enable row level security;


  create table "public"."ditib_directory" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "city" text not null,
    "postal_code" text,
    "country" text not null,
    "address" text,
    "created_at" timestamp with time zone not null default now(),
    "claimed_tenant_id" uuid,
    "claimed_at" timestamp with time zone,
    "claimed_by" uuid
      );


alter table "public"."ditib_directory" enable row level security;


  create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "visibility" public.visibility not null,
    "title" text not null,
    "description" text not null default ''::text,
    "starts_at" timestamp with time zone not null,
    "ends_at" timestamp with time zone,
    "location" text,
    "published_at" timestamp with time zone,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."events" enable row level security;


  create table "public"."finance_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null,
    "currency" text not null default 'EUR'::text,
    "opening_balance_cents" bigint not null default 0,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."finance_accounts" enable row level security;


  create table "public"."finance_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "entity_type" text not null,
    "entity_id" uuid not null,
    "action" text not null,
    "actor_user_id" uuid,
    "occurred_at" timestamp with time zone not null default now(),
    "before" jsonb,
    "after" jsonb
      );


alter table "public"."finance_audit_log" enable row level security;


  create table "public"."finance_categories" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "type" text not null,
    "name" text not null,
    "sort_order" integer not null default 0,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."finance_categories" enable row level security;


  create table "public"."finance_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "account_id" uuid not null,
    "category_id" uuid,
    "type" text not null,
    "booking_date" date not null,
    "amount_cents" bigint not null,
    "counterparty" text,
    "memo" text,
    "reference" text,
    "created_by" uuid not null,
    "updated_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_archived" boolean not null default false,
    "archived_at" timestamp with time zone,
    "archived_by" uuid
      );


alter table "public"."finance_transactions" enable row level security;


  create table "public"."notification_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "audience" public.notification_audience not null,
    "event" text not null,
    "entity_type" text not null,
    "entity_id" uuid not null,
    "status" public.notification_status not null default 'PENDING'::public.notification_status,
    "attempts" integer not null default 0,
    "last_error" text,
    "created_at" timestamp with time zone not null default now(),
    "processed_at" timestamp with time zone
      );


alter table "public"."notification_jobs" enable row level security;


  create table "public"."notification_preferences" (
    "tenant_id" uuid not null,
    "user_id" uuid not null,
    "channel_push_enabled" boolean not null default true,
    "channel_email_enabled" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_preferences" enable row level security;


  create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "kind" public.post_kind not null,
    "visibility" public.visibility not null,
    "title" text not null,
    "content" text not null,
    "published_at" timestamp with time zone,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."posts" enable row level security;


  create table "public"."profiles" (
    "user_id" uuid not null,
    "tenant_id" uuid,
    "role" text not null default 'MITARBEITER'::text,
    "display_name" text,
    "created_at" timestamp with time zone not null default now(),
    "is_board_member" boolean not null default false
      );


alter table "public"."profiles" enable row level security;


  create table "public"."public_push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "subscriber_id" uuid,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "created_at" timestamp with time zone not null default now(),
    "last_seen_at" timestamp with time zone
      );


alter table "public"."public_push_subscriptions" enable row level security;


  create table "public"."public_subscribers" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "email" text,
    "status" public.subscriber_status not null default 'PENDING'::public.subscriber_status,
    "confirm_token" text not null,
    "unsubscribe_token" text not null,
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."public_subscribers" enable row level security;


  create table "public"."push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "user_id" uuid not null,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "user_agent" text,
    "created_at" timestamp with time zone not null default now(),
    "last_seen_at" timestamp with time zone
      );


alter table "public"."push_subscriptions" enable row level security;


  create table "public"."tenant_categories" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "name" text not null,
    "scope" public.category_scope not null default 'BOTH'::public.category_scope,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."tenant_categories" enable row level security;


  create table "public"."tenant_join_requests" (
    "id" uuid not null default gen_random_uuid(),
    "directory_id" uuid not null,
    "tenant_id" uuid,
    "user_id" uuid not null,
    "display_name" text,
    "status" text not null default 'PENDING'::text,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "decided_at" timestamp with time zone
      );


alter table "public"."tenant_join_requests" enable row level security;


  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "logo_url" text,
    "created_at" timestamp with time zone not null default now(),
    "directory_id" uuid
      );


alter table "public"."tenants" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "type" public.transaction_type not null,
    "amount_cents" integer not null,
    "currency" text not null default 'EUR'::text,
    "booked_at" date not null default CURRENT_DATE,
    "category" text,
    "note" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transactions" enable row level security;

CREATE UNIQUE INDEX activity_log_pkey ON public.activity_log USING btree (id);

CREATE INDEX activity_log_tenant_created_idx ON public.activity_log USING btree (tenant_id, created_at DESC);

CREATE UNIQUE INDEX ditib_directory_claimed_tenant_id_key ON public.ditib_directory USING btree (claimed_tenant_id);

CREATE UNIQUE INDEX ditib_directory_pkey ON public.ditib_directory USING btree (id);

CREATE INDEX ditib_directory_search_idx ON public.ditib_directory USING btree (country, city, name);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE INDEX events_tenant_starts_idx ON public.events USING btree (tenant_id, starts_at);

CREATE UNIQUE INDEX finance_accounts_name_per_tenant ON public.finance_accounts USING btree (tenant_id, name);

CREATE UNIQUE INDEX finance_accounts_pkey ON public.finance_accounts USING btree (id);

CREATE INDEX finance_accounts_tenant_id_idx ON public.finance_accounts USING btree (tenant_id);

CREATE UNIQUE INDEX finance_audit_log_pkey ON public.finance_audit_log USING btree (id);

CREATE INDEX finance_audit_tenant_time_idx ON public.finance_audit_log USING btree (tenant_id, occurred_at DESC);

CREATE UNIQUE INDEX finance_categories_name_per_type ON public.finance_categories USING btree (tenant_id, type, name);

CREATE UNIQUE INDEX finance_categories_pkey ON public.finance_categories USING btree (id);

CREATE INDEX finance_categories_tenant_id_idx ON public.finance_categories USING btree (tenant_id);

CREATE UNIQUE INDEX finance_transactions_pkey ON public.finance_transactions USING btree (id);

CREATE INDEX finance_transactions_tenant_account_idx ON public.finance_transactions USING btree (tenant_id, account_id);

CREATE INDEX finance_transactions_tenant_archived_idx ON public.finance_transactions USING btree (tenant_id, is_archived, archived_at DESC);

CREATE INDEX finance_transactions_tenant_booking_not_archived_idx ON public.finance_transactions USING btree (tenant_id, booking_date DESC, created_at DESC) WHERE (is_archived = false);

CREATE INDEX finance_transactions_tenant_category_idx ON public.finance_transactions USING btree (tenant_id, category_id);

CREATE INDEX finance_transactions_tenant_date_idx ON public.finance_transactions USING btree (tenant_id, booking_date DESC);

CREATE INDEX idx_transactions_tenant ON public.transactions USING btree (tenant_id);

CREATE INDEX idx_transactions_tenant_booked ON public.transactions USING btree (tenant_id, booked_at);

CREATE UNIQUE INDEX notification_jobs_pkey ON public.notification_jobs USING btree (id);

CREATE INDEX notification_jobs_status_idx ON public.notification_jobs USING btree (status, created_at);

CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (tenant_id, user_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE INDEX posts_tenant_published_idx ON public.posts USING btree (tenant_id, published_at DESC);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE INDEX profiles_tenant_id_idx ON public.profiles USING btree (tenant_id);

CREATE UNIQUE INDEX public_push_endpoint_unique ON public.public_push_subscriptions USING btree (endpoint);

CREATE UNIQUE INDEX public_push_subscriptions_pkey ON public.public_push_subscriptions USING btree (id);

CREATE UNIQUE INDEX public_subscribers_pkey ON public.public_subscribers USING btree (id);

CREATE INDEX public_subscribers_tenant_status_idx ON public.public_subscribers USING btree (tenant_id, status);

CREATE UNIQUE INDEX public_subscribers_unique_email_per_tenant ON public.public_subscribers USING btree (tenant_id, lower(email)) WHERE (email IS NOT NULL);

CREATE UNIQUE INDEX push_subscriptions_endpoint_unique ON public.push_subscriptions USING btree (endpoint);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

CREATE UNIQUE INDEX push_subscriptions_unique ON public.push_subscriptions USING btree (tenant_id, user_id, endpoint);

CREATE UNIQUE INDEX tenant_categories_pkey ON public.tenant_categories USING btree (id);

CREATE UNIQUE INDEX tenant_categories_unique_name_per_tenant ON public.tenant_categories USING btree (tenant_id, lower(name));

CREATE INDEX tenant_join_requests_directory_id_idx ON public.tenant_join_requests USING btree (directory_id);

CREATE UNIQUE INDEX tenant_join_requests_pkey ON public.tenant_join_requests USING btree (id);

CREATE INDEX tenant_join_requests_tenant_id_idx ON public.tenant_join_requests USING btree (tenant_id);

CREATE INDEX tenant_join_requests_user_id_idx ON public.tenant_join_requests USING btree (user_id);

CREATE INDEX tenants_directory_id_idx ON public.tenants USING btree (directory_id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

alter table "public"."activity_log" add constraint "activity_log_pkey" PRIMARY KEY using index "activity_log_pkey";

alter table "public"."ditib_directory" add constraint "ditib_directory_pkey" PRIMARY KEY using index "ditib_directory_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."finance_accounts" add constraint "finance_accounts_pkey" PRIMARY KEY using index "finance_accounts_pkey";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_pkey" PRIMARY KEY using index "finance_audit_log_pkey";

alter table "public"."finance_categories" add constraint "finance_categories_pkey" PRIMARY KEY using index "finance_categories_pkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_pkey" PRIMARY KEY using index "finance_transactions_pkey";

alter table "public"."notification_jobs" add constraint "notification_jobs_pkey" PRIMARY KEY using index "notification_jobs_pkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_pkey" PRIMARY KEY using index "notification_preferences_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."public_push_subscriptions" add constraint "public_push_subscriptions_pkey" PRIMARY KEY using index "public_push_subscriptions_pkey";

alter table "public"."public_subscribers" add constraint "public_subscribers_pkey" PRIMARY KEY using index "public_subscribers_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."tenant_categories" add constraint "tenant_categories_pkey" PRIMARY KEY using index "tenant_categories_pkey";

alter table "public"."tenant_join_requests" add constraint "tenant_join_requests_pkey" PRIMARY KEY using index "tenant_join_requests_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."activity_log" add constraint "activity_log_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."activity_log" validate constraint "activity_log_actor_user_id_fkey";

alter table "public"."activity_log" add constraint "activity_log_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."activity_log" validate constraint "activity_log_tenant_id_fkey";

alter table "public"."activity_log" add constraint "activity_log_visibility_check" CHECK ((visibility = ANY (ARRAY['INTERNAL'::text, 'ADMIN_ONLY'::text]))) not valid;

alter table "public"."activity_log" validate constraint "activity_log_visibility_check";

alter table "public"."ditib_directory" add constraint "ditib_directory_claimed_by_fkey" FOREIGN KEY (claimed_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."ditib_directory" validate constraint "ditib_directory_claimed_by_fkey";

alter table "public"."ditib_directory" add constraint "ditib_directory_claimed_tenant_id_key" UNIQUE using index "ditib_directory_claimed_tenant_id_key";

alter table "public"."ditib_directory" add constraint "ditib_directory_country_check" CHECK ((country = ANY (ARRAY['DE'::text, 'AT'::text, 'CH'::text]))) not valid;

alter table "public"."ditib_directory" validate constraint "ditib_directory_country_check";

alter table "public"."events" add constraint "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."events" validate constraint "events_created_by_fkey";

alter table "public"."events" add constraint "events_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_tenant_id_fkey";

alter table "public"."finance_accounts" add constraint "finance_accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."finance_accounts" validate constraint "finance_accounts_created_by_fkey";

alter table "public"."finance_accounts" add constraint "finance_accounts_currency_chk" CHECK (((char_length(currency) >= 3) AND (char_length(currency) <= 10))) not valid;

alter table "public"."finance_accounts" validate constraint "finance_accounts_currency_chk";

alter table "public"."finance_accounts" add constraint "finance_accounts_name_per_tenant" UNIQUE using index "finance_accounts_name_per_tenant";

alter table "public"."finance_accounts" add constraint "finance_accounts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."finance_accounts" validate constraint "finance_accounts_tenant_id_fkey";

alter table "public"."finance_accounts" add constraint "finance_accounts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."finance_accounts" validate constraint "finance_accounts_updated_by_fkey";

alter table "public"."finance_audit_log" add constraint "finance_audit_action_chk" CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))) not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_action_chk";

alter table "public"."finance_audit_log" add constraint "finance_audit_entity_type_chk" CHECK ((entity_type = ANY (ARRAY['transaction'::text, 'account'::text, 'category'::text]))) not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_entity_type_chk";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_actor_user_id_fkey";

alter table "public"."finance_audit_log" add constraint "finance_audit_log_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."finance_audit_log" validate constraint "finance_audit_log_tenant_id_fkey";

alter table "public"."finance_categories" add constraint "finance_categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."finance_categories" validate constraint "finance_categories_created_by_fkey";

alter table "public"."finance_categories" add constraint "finance_categories_name_per_type" UNIQUE using index "finance_categories_name_per_type";

alter table "public"."finance_categories" add constraint "finance_categories_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."finance_categories" validate constraint "finance_categories_tenant_id_fkey";

alter table "public"."finance_categories" add constraint "finance_categories_type_chk" CHECK ((type = ANY (ARRAY['INCOME'::text, 'EXPENSE'::text]))) not valid;

alter table "public"."finance_categories" validate constraint "finance_categories_type_chk";

alter table "public"."finance_categories" add constraint "finance_categories_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."finance_categories" validate constraint "finance_categories_updated_by_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id) ON DELETE RESTRICT not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_account_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_amount_positive_chk" CHECK ((amount_cents > 0)) not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_amount_positive_chk";

alter table "public"."finance_transactions" add constraint "finance_transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.finance_categories(id) ON DELETE SET NULL not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_category_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_created_by_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_tenant_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_type_chk" CHECK ((type = ANY (ARRAY['INCOME'::text, 'EXPENSE'::text]))) not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_type_chk";

alter table "public"."finance_transactions" add constraint "finance_transactions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_updated_by_fkey";

alter table "public"."notification_jobs" add constraint "notification_jobs_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."notification_jobs" validate constraint "notification_jobs_tenant_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."notification_preferences" validate constraint "notification_preferences_tenant_id_fkey";

alter table "public"."notification_preferences" add constraint "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notification_preferences" validate constraint "notification_preferences_user_id_fkey";

alter table "public"."posts" add constraint "posts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."posts" validate constraint "posts_created_by_fkey";

alter table "public"."posts" add constraint "posts_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_tenant_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['ADMIN'::text, 'VORSTAND'::text, 'KASSIERER'::text, 'MITARBEITER'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "profiles_role_chk" CHECK ((role = ANY (ARRAY['ADMIN'::text, 'VORSTAND'::text, 'KASSIERER'::text, 'MITARBEITER'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_chk";

alter table "public"."profiles" add constraint "profiles_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_tenant_id_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."public_push_subscriptions" add constraint "public_push_subscriptions_subscriber_id_fkey" FOREIGN KEY (subscriber_id) REFERENCES public.public_subscribers(id) ON DELETE SET NULL not valid;

alter table "public"."public_push_subscriptions" validate constraint "public_push_subscriptions_subscriber_id_fkey";

alter table "public"."public_push_subscriptions" add constraint "public_push_subscriptions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."public_push_subscriptions" validate constraint "public_push_subscriptions_tenant_id_fkey";

alter table "public"."public_subscribers" add constraint "public_subscribers_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."public_subscribers" validate constraint "public_subscribers_tenant_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_tenant_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_user_id_fkey";

alter table "public"."tenant_categories" add constraint "tenant_categories_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_categories" validate constraint "tenant_categories_tenant_id_fkey";

alter table "public"."tenant_join_requests" add constraint "tenant_join_requests_directory_id_fkey" FOREIGN KEY (directory_id) REFERENCES public.ditib_directory(id) ON DELETE RESTRICT not valid;

alter table "public"."tenant_join_requests" validate constraint "tenant_join_requests_directory_id_fkey";

alter table "public"."tenant_join_requests" add constraint "tenant_join_requests_status_check" CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))) not valid;

alter table "public"."tenant_join_requests" validate constraint "tenant_join_requests_status_check";

alter table "public"."tenant_join_requests" add constraint "tenant_join_requests_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL not valid;

alter table "public"."tenant_join_requests" validate constraint "tenant_join_requests_tenant_id_fkey";

alter table "public"."tenant_join_requests" add constraint "tenant_join_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_join_requests" validate constraint "tenant_join_requests_user_id_fkey";

alter table "public"."tenants" add constraint "tenants_directory_id_fkey" FOREIGN KEY (directory_id) REFERENCES public.ditib_directory(id) ON DELETE SET NULL not valid;

alter table "public"."tenants" validate constraint "tenants_directory_id_fkey";

alter table "public"."tenants" add constraint "tenants_slug_key" UNIQUE using index "tenants_slug_key";

alter table "public"."transactions" add constraint "transactions_amount_cents_check" CHECK ((amount_cents >= 0)) not valid;

alter table "public"."transactions" validate constraint "transactions_amount_cents_check";

alter table "public"."transactions" add constraint "transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_created_by_fkey";

alter table "public"."transactions" add constraint "transactions_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_tenant_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.claim_directory(p_directory_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_dir record;
  v_slug text;
  v_tenant_id uuid;
  v_try int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_dir
  from public.ditib_directory
  where id = p_directory_id
  for update;

  if not found then
    raise exception 'Directory entry not found';
  end if;

  if v_dir.claimed_tenant_id is not null then
    raise exception 'This organization is already claimed';
  end if;

  -- slug aus name+city, maximal simpel, aber robust
  v_slug := lower(regexp_replace(v_dir.name || '-' || v_dir.city, '[^a-z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '(^-+|-+$)', '', 'g');

  -- Unique slug sicherstellen (bei Konflikt suffix)
  while exists (select 1 from public.tenants t where t.slug = v_slug) loop
    v_try := v_try + 1;
    v_slug := v_slug || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
    if v_try > 5 then
      raise exception 'Could not generate unique slug';
    end if;
  end loop;

  -- Tenant erstellen
  insert into public.tenants (name, slug, directory_id)
  values (v_dir.name, v_slug, v_dir.id)
  returning id into v_tenant_id;

  -- Directory als claimed markieren
  update public.ditib_directory
  set claimed_tenant_id = v_tenant_id,
      claimed_at = now(),
      claimed_by = v_user_id
  where id = v_dir.id;

  -- Profil upsert: User → ADMIN + tenant_id
  insert into public.profiles (user_id, tenant_id, role)
  values (v_user_id, v_tenant_id, 'ADMIN')
  on conflict (user_id) do update
    set tenant_id = excluded.tenant_id,
        role = 'ADMIN';

  return v_tenant_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select p.role
  from public.profiles p
  where p.user_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select p.tenant_id
  from public.profiles p
  where p.user_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.get_joinable_directory()
 RETURNS TABLE(id uuid, name text, city text, postal_code text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    d.id,
    d.name,
    d.city,
    d.postal_code
  from public.tenants t
  join public.ditib_directory d on d.id = t.directory_id
  where t.directory_id is not null;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_join_request_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Auf APPROVED reagieren (Insert oder Status-Update)
  if (tg_op = 'INSERT' and new.status = 'APPROVED')
     or (tg_op = 'UPDATE' and new.status = 'APPROVED' and old.status is distinct from new.status) then

    -- Temporär erlauben, profiles.tenant_id/role zu setzen
    perform set_config('app.allow_profile_privilege_write', 'on', true);

    insert into public.profiles (user_id, tenant_id, role, display_name)
    values (
      new.user_id,
      new.tenant_id,
      'MITARBEITER',
      new.display_name
    )
    on conflict (user_id)
    do update set
      tenant_id = excluded.tenant_id,
      role = excluded.role,
      display_name = coalesce(excluded.display_name, public.profiles.display_name);

  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_of_tenant(tid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.tenant_id = tid
      and p.role = 'ADMIN'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_board_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(p.is_board_member, false)
  from public.profiles p
  where p.user_id = auth.uid()
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.is_finance_reader()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select public.current_role() in ('ADMIN','KASSIERER','VORSTAND')
$function$
;

CREATE OR REPLACE FUNCTION public.is_finance_writer()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select public.current_role() in ('ADMIN','KASSIERER')
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_of_tenant(tid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.tenant_id = tid
  );
$function$
;

create or replace view "public"."joinable_directory" as  SELECT d.id,
    d.name,
    d.city,
    d.postal_code
   FROM (public.tenants t
     JOIN public.ditib_directory d ON ((d.id = t.directory_id)))
  WHERE (t.directory_id IS NOT NULL);


CREATE OR REPLACE FUNCTION public.log_finance_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_tenant uuid;
  v_entity_type text;
  v_entity_id uuid;
  v_actor uuid;
begin
  -- Determine table
  if (tg_table_name = 'finance_transactions') then
    v_entity_type := 'transaction';
    if (tg_op = 'DELETE') then
      v_tenant := old.tenant_id;
      v_entity_id := old.id;
      v_actor := coalesce(auth.uid(), old.updated_by, old.created_by);
    else
      v_tenant := new.tenant_id;
      v_entity_id := new.id;
      v_actor := coalesce(auth.uid(), new.updated_by, new.created_by);
    end if;

  elsif (tg_table_name = 'finance_accounts') then
    v_entity_type := 'account';
    if (tg_op = 'DELETE') then
      v_tenant := old.tenant_id;
      v_entity_id := old.id;
      v_actor := coalesce(auth.uid(), old.updated_by, old.created_by);
    else
      v_tenant := new.tenant_id;
      v_entity_id := new.id;
      v_actor := coalesce(auth.uid(), new.updated_by, new.created_by);
    end if;

  elsif (tg_table_name = 'finance_categories') then
    v_entity_type := 'category';
    if (tg_op = 'DELETE') then
      v_tenant := old.tenant_id;
      v_entity_id := old.id;
      v_actor := coalesce(auth.uid(), old.updated_by, old.created_by);
    else
      v_tenant := new.tenant_id;
      v_entity_id := new.id;
      v_actor := coalesce(auth.uid(), new.updated_by, new.created_by);
    end if;

  else
    return null;
  end if;

  insert into public.finance_audit_log (
    tenant_id,
    entity_type,
    entity_id,
    action,
    actor_user_id,
    before,
    after
  ) values (
    v_tenant,
    v_entity_type,
    v_entity_id,
    tg_op,
    v_actor,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );

  if (tg_op = 'DELETE') then
    return old;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Service Role darf verwaltende Änderungen durchführen (z.B. Admin-Freigabe, Rollenvergabe)
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  -- Alle anderen dürfen tenant_id/role niemals selbst ändern
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'tenant_id cannot be changed by user';
  end if;

  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by user';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.created_by is null then
    new.created_by := auth.uid(); -- kann bei Service Role null sein, API soll idealerweise setzen
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_by = auth.uid();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.setup_create_tenant_and_profile(p_display_name text, p_tenant_name text, p_tenant_slug text, p_directory_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_tenant_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.profiles where user_id = v_user_id) then
    raise exception 'Profile not found for user';
  end if;

  insert into public.tenants (name, slug, logo_url, directory_id)
  values (p_tenant_name, p_tenant_slug, null, p_directory_id)
  returning id into v_tenant_id;

  update public.profiles
  set
    tenant_id = v_tenant_id,
    display_name = p_display_name,
    role = 'ADMIN',
    is_board_member = true
  where user_id = v_user_id;

  insert into public.tenant_categories (tenant_id, name, scope)
  values
    (v_tenant_id, 'Spenden', 'INCOME'),
    (v_tenant_id, 'Mitgliedsbeiträge', 'INCOME'),
    (v_tenant_id, 'Miete', 'EXPENSE'),
    (v_tenant_id, 'Energie', 'EXPENSE'),
    (v_tenant_id, 'Veranstaltungen', 'BOTH')
  on conflict do nothing;

  insert into public.activity_log (tenant_id, actor_user_id, action, entity_type, entity_id, meta)
  values (
    v_tenant_id,
    v_user_id,
    'tenant.created',
    'tenants',
    v_tenant_id,
    jsonb_build_object('name', p_tenant_name)
  );
end;
$function$
;

grant delete on table "public"."activity_log" to "anon";

grant insert on table "public"."activity_log" to "anon";

grant references on table "public"."activity_log" to "anon";

grant select on table "public"."activity_log" to "anon";

grant trigger on table "public"."activity_log" to "anon";

grant truncate on table "public"."activity_log" to "anon";

grant update on table "public"."activity_log" to "anon";

grant delete on table "public"."activity_log" to "authenticated";

grant insert on table "public"."activity_log" to "authenticated";

grant references on table "public"."activity_log" to "authenticated";

grant select on table "public"."activity_log" to "authenticated";

grant trigger on table "public"."activity_log" to "authenticated";

grant truncate on table "public"."activity_log" to "authenticated";

grant update on table "public"."activity_log" to "authenticated";

grant delete on table "public"."activity_log" to "service_role";

grant insert on table "public"."activity_log" to "service_role";

grant references on table "public"."activity_log" to "service_role";

grant select on table "public"."activity_log" to "service_role";

grant trigger on table "public"."activity_log" to "service_role";

grant truncate on table "public"."activity_log" to "service_role";

grant update on table "public"."activity_log" to "service_role";

grant delete on table "public"."ditib_directory" to "anon";

grant insert on table "public"."ditib_directory" to "anon";

grant references on table "public"."ditib_directory" to "anon";

grant select on table "public"."ditib_directory" to "anon";

grant trigger on table "public"."ditib_directory" to "anon";

grant truncate on table "public"."ditib_directory" to "anon";

grant update on table "public"."ditib_directory" to "anon";

grant references on table "public"."ditib_directory" to "authenticated";

grant select on table "public"."ditib_directory" to "authenticated";

grant trigger on table "public"."ditib_directory" to "authenticated";

grant truncate on table "public"."ditib_directory" to "authenticated";

grant delete on table "public"."ditib_directory" to "service_role";

grant insert on table "public"."ditib_directory" to "service_role";

grant references on table "public"."ditib_directory" to "service_role";

grant select on table "public"."ditib_directory" to "service_role";

grant trigger on table "public"."ditib_directory" to "service_role";

grant truncate on table "public"."ditib_directory" to "service_role";

grant update on table "public"."ditib_directory" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."finance_accounts" to "anon";

grant insert on table "public"."finance_accounts" to "anon";

grant references on table "public"."finance_accounts" to "anon";

grant select on table "public"."finance_accounts" to "anon";

grant trigger on table "public"."finance_accounts" to "anon";

grant truncate on table "public"."finance_accounts" to "anon";

grant update on table "public"."finance_accounts" to "anon";

grant delete on table "public"."finance_accounts" to "authenticated";

grant insert on table "public"."finance_accounts" to "authenticated";

grant references on table "public"."finance_accounts" to "authenticated";

grant select on table "public"."finance_accounts" to "authenticated";

grant trigger on table "public"."finance_accounts" to "authenticated";

grant truncate on table "public"."finance_accounts" to "authenticated";

grant update on table "public"."finance_accounts" to "authenticated";

grant delete on table "public"."finance_accounts" to "service_role";

grant insert on table "public"."finance_accounts" to "service_role";

grant references on table "public"."finance_accounts" to "service_role";

grant select on table "public"."finance_accounts" to "service_role";

grant trigger on table "public"."finance_accounts" to "service_role";

grant truncate on table "public"."finance_accounts" to "service_role";

grant update on table "public"."finance_accounts" to "service_role";

grant delete on table "public"."finance_audit_log" to "anon";

grant insert on table "public"."finance_audit_log" to "anon";

grant references on table "public"."finance_audit_log" to "anon";

grant select on table "public"."finance_audit_log" to "anon";

grant trigger on table "public"."finance_audit_log" to "anon";

grant truncate on table "public"."finance_audit_log" to "anon";

grant update on table "public"."finance_audit_log" to "anon";

grant delete on table "public"."finance_audit_log" to "authenticated";

grant insert on table "public"."finance_audit_log" to "authenticated";

grant references on table "public"."finance_audit_log" to "authenticated";

grant select on table "public"."finance_audit_log" to "authenticated";

grant trigger on table "public"."finance_audit_log" to "authenticated";

grant truncate on table "public"."finance_audit_log" to "authenticated";

grant update on table "public"."finance_audit_log" to "authenticated";

grant delete on table "public"."finance_audit_log" to "service_role";

grant insert on table "public"."finance_audit_log" to "service_role";

grant references on table "public"."finance_audit_log" to "service_role";

grant select on table "public"."finance_audit_log" to "service_role";

grant trigger on table "public"."finance_audit_log" to "service_role";

grant truncate on table "public"."finance_audit_log" to "service_role";

grant update on table "public"."finance_audit_log" to "service_role";

grant delete on table "public"."finance_categories" to "anon";

grant insert on table "public"."finance_categories" to "anon";

grant references on table "public"."finance_categories" to "anon";

grant select on table "public"."finance_categories" to "anon";

grant trigger on table "public"."finance_categories" to "anon";

grant truncate on table "public"."finance_categories" to "anon";

grant update on table "public"."finance_categories" to "anon";

grant delete on table "public"."finance_categories" to "authenticated";

grant insert on table "public"."finance_categories" to "authenticated";

grant references on table "public"."finance_categories" to "authenticated";

grant select on table "public"."finance_categories" to "authenticated";

grant trigger on table "public"."finance_categories" to "authenticated";

grant truncate on table "public"."finance_categories" to "authenticated";

grant update on table "public"."finance_categories" to "authenticated";

grant delete on table "public"."finance_categories" to "service_role";

grant insert on table "public"."finance_categories" to "service_role";

grant references on table "public"."finance_categories" to "service_role";

grant select on table "public"."finance_categories" to "service_role";

grant trigger on table "public"."finance_categories" to "service_role";

grant truncate on table "public"."finance_categories" to "service_role";

grant update on table "public"."finance_categories" to "service_role";

grant delete on table "public"."finance_transactions" to "anon";

grant insert on table "public"."finance_transactions" to "anon";

grant references on table "public"."finance_transactions" to "anon";

grant select on table "public"."finance_transactions" to "anon";

grant trigger on table "public"."finance_transactions" to "anon";

grant truncate on table "public"."finance_transactions" to "anon";

grant update on table "public"."finance_transactions" to "anon";

grant delete on table "public"."finance_transactions" to "authenticated";

grant insert on table "public"."finance_transactions" to "authenticated";

grant references on table "public"."finance_transactions" to "authenticated";

grant select on table "public"."finance_transactions" to "authenticated";

grant trigger on table "public"."finance_transactions" to "authenticated";

grant truncate on table "public"."finance_transactions" to "authenticated";

grant update on table "public"."finance_transactions" to "authenticated";

grant delete on table "public"."finance_transactions" to "service_role";

grant insert on table "public"."finance_transactions" to "service_role";

grant references on table "public"."finance_transactions" to "service_role";

grant select on table "public"."finance_transactions" to "service_role";

grant trigger on table "public"."finance_transactions" to "service_role";

grant truncate on table "public"."finance_transactions" to "service_role";

grant update on table "public"."finance_transactions" to "service_role";

grant delete on table "public"."notification_jobs" to "anon";

grant insert on table "public"."notification_jobs" to "anon";

grant references on table "public"."notification_jobs" to "anon";

grant select on table "public"."notification_jobs" to "anon";

grant trigger on table "public"."notification_jobs" to "anon";

grant truncate on table "public"."notification_jobs" to "anon";

grant update on table "public"."notification_jobs" to "anon";

grant delete on table "public"."notification_jobs" to "authenticated";

grant insert on table "public"."notification_jobs" to "authenticated";

grant references on table "public"."notification_jobs" to "authenticated";

grant select on table "public"."notification_jobs" to "authenticated";

grant trigger on table "public"."notification_jobs" to "authenticated";

grant truncate on table "public"."notification_jobs" to "authenticated";

grant update on table "public"."notification_jobs" to "authenticated";

grant delete on table "public"."notification_jobs" to "service_role";

grant insert on table "public"."notification_jobs" to "service_role";

grant references on table "public"."notification_jobs" to "service_role";

grant select on table "public"."notification_jobs" to "service_role";

grant trigger on table "public"."notification_jobs" to "service_role";

grant truncate on table "public"."notification_jobs" to "service_role";

grant update on table "public"."notification_jobs" to "service_role";

grant delete on table "public"."notification_preferences" to "anon";

grant insert on table "public"."notification_preferences" to "anon";

grant references on table "public"."notification_preferences" to "anon";

grant select on table "public"."notification_preferences" to "anon";

grant trigger on table "public"."notification_preferences" to "anon";

grant truncate on table "public"."notification_preferences" to "anon";

grant update on table "public"."notification_preferences" to "anon";

grant delete on table "public"."notification_preferences" to "authenticated";

grant insert on table "public"."notification_preferences" to "authenticated";

grant references on table "public"."notification_preferences" to "authenticated";

grant select on table "public"."notification_preferences" to "authenticated";

grant trigger on table "public"."notification_preferences" to "authenticated";

grant truncate on table "public"."notification_preferences" to "authenticated";

grant update on table "public"."notification_preferences" to "authenticated";

grant delete on table "public"."notification_preferences" to "service_role";

grant insert on table "public"."notification_preferences" to "service_role";

grant references on table "public"."notification_preferences" to "service_role";

grant select on table "public"."notification_preferences" to "service_role";

grant trigger on table "public"."notification_preferences" to "service_role";

grant truncate on table "public"."notification_preferences" to "service_role";

grant update on table "public"."notification_preferences" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant select on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."public_push_subscriptions" to "anon";

grant insert on table "public"."public_push_subscriptions" to "anon";

grant references on table "public"."public_push_subscriptions" to "anon";

grant select on table "public"."public_push_subscriptions" to "anon";

grant trigger on table "public"."public_push_subscriptions" to "anon";

grant truncate on table "public"."public_push_subscriptions" to "anon";

grant update on table "public"."public_push_subscriptions" to "anon";

grant delete on table "public"."public_push_subscriptions" to "authenticated";

grant insert on table "public"."public_push_subscriptions" to "authenticated";

grant references on table "public"."public_push_subscriptions" to "authenticated";

grant select on table "public"."public_push_subscriptions" to "authenticated";

grant trigger on table "public"."public_push_subscriptions" to "authenticated";

grant truncate on table "public"."public_push_subscriptions" to "authenticated";

grant update on table "public"."public_push_subscriptions" to "authenticated";

grant delete on table "public"."public_push_subscriptions" to "service_role";

grant insert on table "public"."public_push_subscriptions" to "service_role";

grant references on table "public"."public_push_subscriptions" to "service_role";

grant select on table "public"."public_push_subscriptions" to "service_role";

grant trigger on table "public"."public_push_subscriptions" to "service_role";

grant truncate on table "public"."public_push_subscriptions" to "service_role";

grant update on table "public"."public_push_subscriptions" to "service_role";

grant delete on table "public"."public_subscribers" to "anon";

grant insert on table "public"."public_subscribers" to "anon";

grant references on table "public"."public_subscribers" to "anon";

grant select on table "public"."public_subscribers" to "anon";

grant trigger on table "public"."public_subscribers" to "anon";

grant truncate on table "public"."public_subscribers" to "anon";

grant update on table "public"."public_subscribers" to "anon";

grant delete on table "public"."public_subscribers" to "authenticated";

grant insert on table "public"."public_subscribers" to "authenticated";

grant references on table "public"."public_subscribers" to "authenticated";

grant select on table "public"."public_subscribers" to "authenticated";

grant trigger on table "public"."public_subscribers" to "authenticated";

grant truncate on table "public"."public_subscribers" to "authenticated";

grant update on table "public"."public_subscribers" to "authenticated";

grant delete on table "public"."public_subscribers" to "service_role";

grant insert on table "public"."public_subscribers" to "service_role";

grant references on table "public"."public_subscribers" to "service_role";

grant select on table "public"."public_subscribers" to "service_role";

grant trigger on table "public"."public_subscribers" to "service_role";

grant truncate on table "public"."public_subscribers" to "service_role";

grant update on table "public"."public_subscribers" to "service_role";

grant delete on table "public"."push_subscriptions" to "anon";

grant insert on table "public"."push_subscriptions" to "anon";

grant references on table "public"."push_subscriptions" to "anon";

grant select on table "public"."push_subscriptions" to "anon";

grant trigger on table "public"."push_subscriptions" to "anon";

grant truncate on table "public"."push_subscriptions" to "anon";

grant update on table "public"."push_subscriptions" to "anon";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant references on table "public"."push_subscriptions" to "authenticated";

grant select on table "public"."push_subscriptions" to "authenticated";

grant trigger on table "public"."push_subscriptions" to "authenticated";

grant truncate on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "service_role";

grant insert on table "public"."push_subscriptions" to "service_role";

grant references on table "public"."push_subscriptions" to "service_role";

grant select on table "public"."push_subscriptions" to "service_role";

grant trigger on table "public"."push_subscriptions" to "service_role";

grant truncate on table "public"."push_subscriptions" to "service_role";

grant update on table "public"."push_subscriptions" to "service_role";

grant delete on table "public"."tenant_categories" to "anon";

grant insert on table "public"."tenant_categories" to "anon";

grant references on table "public"."tenant_categories" to "anon";

grant select on table "public"."tenant_categories" to "anon";

grant trigger on table "public"."tenant_categories" to "anon";

grant truncate on table "public"."tenant_categories" to "anon";

grant update on table "public"."tenant_categories" to "anon";

grant delete on table "public"."tenant_categories" to "authenticated";

grant insert on table "public"."tenant_categories" to "authenticated";

grant references on table "public"."tenant_categories" to "authenticated";

grant select on table "public"."tenant_categories" to "authenticated";

grant trigger on table "public"."tenant_categories" to "authenticated";

grant truncate on table "public"."tenant_categories" to "authenticated";

grant update on table "public"."tenant_categories" to "authenticated";

grant delete on table "public"."tenant_categories" to "service_role";

grant insert on table "public"."tenant_categories" to "service_role";

grant references on table "public"."tenant_categories" to "service_role";

grant select on table "public"."tenant_categories" to "service_role";

grant trigger on table "public"."tenant_categories" to "service_role";

grant truncate on table "public"."tenant_categories" to "service_role";

grant update on table "public"."tenant_categories" to "service_role";

grant delete on table "public"."tenant_join_requests" to "anon";

grant insert on table "public"."tenant_join_requests" to "anon";

grant references on table "public"."tenant_join_requests" to "anon";

grant select on table "public"."tenant_join_requests" to "anon";

grant trigger on table "public"."tenant_join_requests" to "anon";

grant truncate on table "public"."tenant_join_requests" to "anon";

grant update on table "public"."tenant_join_requests" to "anon";

grant delete on table "public"."tenant_join_requests" to "authenticated";

grant insert on table "public"."tenant_join_requests" to "authenticated";

grant references on table "public"."tenant_join_requests" to "authenticated";

grant select on table "public"."tenant_join_requests" to "authenticated";

grant trigger on table "public"."tenant_join_requests" to "authenticated";

grant truncate on table "public"."tenant_join_requests" to "authenticated";

grant update on table "public"."tenant_join_requests" to "authenticated";

grant delete on table "public"."tenant_join_requests" to "service_role";

grant insert on table "public"."tenant_join_requests" to "service_role";

grant references on table "public"."tenant_join_requests" to "service_role";

grant select on table "public"."tenant_join_requests" to "service_role";

grant trigger on table "public"."tenant_join_requests" to "service_role";

grant truncate on table "public"."tenant_join_requests" to "service_role";

grant update on table "public"."tenant_join_requests" to "service_role";

grant delete on table "public"."tenants" to "anon";

grant insert on table "public"."tenants" to "anon";

grant references on table "public"."tenants" to "anon";

grant select on table "public"."tenants" to "anon";

grant trigger on table "public"."tenants" to "anon";

grant truncate on table "public"."tenants" to "anon";

grant update on table "public"."tenants" to "anon";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant references on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant trigger on table "public"."tenants" to "authenticated";

grant truncate on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."tenants" to "service_role";

grant insert on table "public"."tenants" to "service_role";

grant references on table "public"."tenants" to "service_role";

grant select on table "public"."tenants" to "service_role";

grant trigger on table "public"."tenants" to "service_role";

grant truncate on table "public"."tenants" to "service_role";

grant update on table "public"."tenants" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";


  create policy "activity_delete_none"
  on "public"."activity_log"
  as permissive
  for delete
  to authenticated
using (false);



  create policy "activity_insert_none"
  on "public"."activity_log"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "activity_log_insert_tenant"
  on "public"."activity_log"
  as permissive
  for insert
  to authenticated
with check ((tenant_id = public.current_tenant_id()));



  create policy "activity_log_select_tenant"
  on "public"."activity_log"
  as permissive
  for select
  to authenticated
using ((tenant_id = public.current_tenant_id()));



  create policy "activity_select_admin"
  on "public"."activity_log"
  as permissive
  for select
  to authenticated
using (public.is_admin_of_tenant(tenant_id));



  create policy "activity_update_none"
  on "public"."activity_log"
  as permissive
  for update
  to authenticated
using (false);



  create policy "directory_no_write"
  on "public"."ditib_directory"
  as permissive
  for all
  to authenticated
using (false)
with check (false);



  create policy "directory_select_auth"
  on "public"."ditib_directory"
  as permissive
  for select
  to authenticated
using (true);



  create policy "events_public_read"
  on "public"."events"
  as permissive
  for select
  to anon
using (((visibility = 'PUBLIC'::public.visibility) AND (published_at IS NOT NULL)));



  create policy "events_select_tenant_roles"
  on "public"."events"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))));



  create policy "events_write_tenant_roles"
  on "public"."events"
  as permissive
  for all
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))))
with check (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))));



  create policy "finance_accounts_delete"
  on "public"."finance_accounts"
  as permissive
  for delete
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_accounts_insert"
  on "public"."finance_accounts"
  as permissive
  for insert
  to authenticated
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_accounts_select"
  on "public"."finance_accounts"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_reader()));



  create policy "finance_accounts_update"
  on "public"."finance_accounts"
  as permissive
  for update
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()))
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_audit_no_delete"
  on "public"."finance_audit_log"
  as permissive
  for delete
  to authenticated
using (false);



  create policy "finance_audit_no_insert"
  on "public"."finance_audit_log"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "finance_audit_no_update"
  on "public"."finance_audit_log"
  as permissive
  for update
  to authenticated
using (false);



  create policy "finance_audit_select"
  on "public"."finance_audit_log"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_reader()));



  create policy "finance_categories_delete"
  on "public"."finance_categories"
  as permissive
  for delete
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_categories_insert"
  on "public"."finance_categories"
  as permissive
  for insert
  to authenticated
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_categories_select"
  on "public"."finance_categories"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_reader()));



  create policy "finance_categories_update"
  on "public"."finance_categories"
  as permissive
  for update
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()))
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_transactions_delete"
  on "public"."finance_transactions"
  as permissive
  for delete
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "finance_transactions_insert"
  on "public"."finance_transactions"
  as permissive
  for insert
  to authenticated
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer() AND (created_by = auth.uid())));



  create policy "finance_transactions_select"
  on "public"."finance_transactions"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_reader()));



  create policy "finance_transactions_update"
  on "public"."finance_transactions"
  as permissive
  for update
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()))
with check (((tenant_id = public.current_tenant_id()) AND public.is_finance_writer()));



  create policy "notification_jobs_admin_select"
  on "public"."notification_jobs"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = 'ADMIN'::text)));



  create policy "notification_preferences_own"
  on "public"."notification_preferences"
  as permissive
  for all
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (user_id = auth.uid())))
with check (((tenant_id = public.current_tenant_id()) AND (user_id = auth.uid())));



  create policy "posts_public_read"
  on "public"."posts"
  as permissive
  for select
  to anon
using (((visibility = 'PUBLIC'::public.visibility) AND (published_at IS NOT NULL)));



  create policy "posts_select_tenant_roles"
  on "public"."posts"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))));



  create policy "posts_write_tenant_roles"
  on "public"."posts"
  as permissive
  for all
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))))
with check (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = ANY (ARRAY['ADMIN'::text, 'KOMMUNIKATION'::text]))));



  create policy "profiles_insert_own"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND (tenant_id IS NULL) AND (role = 'MITARBEITER'::text)));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "public_push_admin_select"
  on "public"."public_push_subscriptions"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = 'ADMIN'::text)));



  create policy "public_subscribers_admin_select"
  on "public"."public_subscribers"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = 'ADMIN'::text)));



  create policy "push_subscriptions_select_own"
  on "public"."push_subscriptions"
  as permissive
  for select
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (user_id = auth.uid())));



  create policy "push_subscriptions_upsert_own"
  on "public"."push_subscriptions"
  as permissive
  for all
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (user_id = auth.uid())))
with check (((tenant_id = public.current_tenant_id()) AND (user_id = auth.uid())));



  create policy "tenant_categories_admin_write"
  on "public"."tenant_categories"
  as permissive
  for all
  to authenticated
using (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = 'ADMIN'::text)))
with check (((tenant_id = public.current_tenant_id()) AND (public."current_role"() = 'ADMIN'::text)));



  create policy "tenant_categories_select_tenant"
  on "public"."tenant_categories"
  as permissive
  for select
  to authenticated
using ((tenant_id = public.current_tenant_id()));



  create policy "tjr_insert_own"
  on "public"."tenant_join_requests"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "tjr_select_admin_tenant"
  on "public"."tenant_join_requests"
  as permissive
  for select
  to authenticated
using (((tenant_id IS NOT NULL) AND public.is_admin_of_tenant(tenant_id)));



  create policy "tjr_select_own"
  on "public"."tenant_join_requests"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "tjr_update_admin_tenant"
  on "public"."tenant_join_requests"
  as permissive
  for update
  to authenticated
using (((tenant_id IS NOT NULL) AND public.is_admin_of_tenant(tenant_id)))
with check (((tenant_id IS NOT NULL) AND public.is_admin_of_tenant(tenant_id)));



  create policy "tenants_insert_auth"
  on "public"."tenants"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "tenants_select_if_member"
  on "public"."tenants"
  as permissive
  for select
  to authenticated
using (public.is_member_of_tenant(id));



  create policy "tenants_select_joinable"
  on "public"."tenants"
  as permissive
  for select
  to authenticated
using ((directory_id IS NOT NULL));



  create policy "transactions_delete_own_tenant"
  on "public"."transactions"
  as permissive
  for delete
  to authenticated
using ((tenant_id = public.current_tenant_id()));



  create policy "transactions_insert_own_tenant"
  on "public"."transactions"
  as permissive
  for insert
  to authenticated
with check ((tenant_id = public.current_tenant_id()));



  create policy "transactions_select_own_tenant"
  on "public"."transactions"
  as permissive
  for select
  to authenticated
using ((tenant_id = public.current_tenant_id()));



  create policy "transactions_update_own_tenant"
  on "public"."transactions"
  as permissive
  for update
  to authenticated
using ((tenant_id = public.current_tenant_id()))
with check ((tenant_id = public.current_tenant_id()));


CREATE TRIGGER trg_finance_accounts_audit AFTER INSERT OR DELETE OR UPDATE ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.log_finance_audit();

CREATE TRIGGER trg_finance_accounts_set_created_by BEFORE INSERT ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_finance_accounts_set_updated_at BEFORE UPDATE ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_finance_accounts_set_updated_by BEFORE UPDATE ON public.finance_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trg_finance_categories_audit AFTER INSERT OR DELETE OR UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.log_finance_audit();

CREATE TRIGGER trg_finance_categories_set_created_by BEFORE INSERT ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_finance_categories_set_updated_at BEFORE UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_finance_categories_set_updated_by BEFORE UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trg_finance_transactions_audit AFTER INSERT OR DELETE OR UPDATE ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.log_finance_audit();

CREATE TRIGGER trg_prevent_profile_escalation BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

CREATE TRIGGER trg_tjr_approved AFTER INSERT OR UPDATE OF status ON public.tenant_join_requests FOR EACH ROW EXECUTE FUNCTION public.handle_join_request_approved();


