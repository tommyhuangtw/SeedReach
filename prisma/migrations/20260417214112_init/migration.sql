-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kols" (
    "id" UUID NOT NULL,
    "ig_handle" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "followers_count" INTEGER,
    "engagement_rate" DECIMAL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_email" TEXT,
    "contact_line" TEXT,
    "contact_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT '潛在',
    "notes" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_activities" (
    "id" UUID NOT NULL,
    "kol_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_searches" (
    "id" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "search_type" TEXT,
    "results_count" INTEGER,
    "apify_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_results" (
    "id" UUID NOT NULL,
    "search_id" UUID NOT NULL,
    "ig_handle" TEXT,
    "name" TEXT,
    "followers_count" INTEGER,
    "engagement_rate" DECIMAL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "is_added" BOOLEAN NOT NULL DEFAULT false,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_emails" (
    "id" UUID NOT NULL,
    "kol_id" UUID,
    "template_id" UUID,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '草稿',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kols_ig_handle_key" ON "kols"("ig_handle");

-- AddForeignKey
ALTER TABLE "kol_activities" ADD CONSTRAINT "kol_activities_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_results" ADD CONSTRAINT "discovery_results_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "discovery_searches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_emails" ADD CONSTRAINT "outreach_emails_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_emails" ADD CONSTRAINT "outreach_emails_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
