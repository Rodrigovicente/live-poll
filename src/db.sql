;CREATE TABLE IF NOT EXISTS "User" (
	"id" BIGINT GENERATED ALWAYS AS IDENTITY,
	"identifier" VARCHAR(32) NOT NULL UNIQUE,
	"provider" TEXT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY ("id")
)

CREATE TABLE IF NOT EXISTS "Account" (
	"id" BIGINT GENERATED ALWAYS AS IDENTITY,
	"user_id" BIGINT NOT NULL,
	"provider" TEXT NOT NULL,
	"provider_account_id" TEXT NOT NULL,
	"email" VARCHAR(255) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY ("id"),
	CONSTRAINT "account_user_fk" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS "Poll" (
	"id" BIGINT GENERATED ALWAYS AS IDENTITY,
	"identifier" VARCHAR(32) NOT NULL UNIQUE,
	"title" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"is_multiple" BOOLEAN NOT NULL,
	"is_closed" BOOLEAN NOT NULL DEFAULT FALSE,
	"allow_new_options" BOOLEAN NOT NULL,
	"require_twitch_account" BOOLEAN NOT NULL,
	"require_twitch_sub" BOOLEAN NOT NULL,
	"require_google_account" BOOLEAN NOT NULL,
	"ends_at" TIMESTAMPTZ NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY ("id")
)

CREATE TABLE IF NOT EXISTS "PollOption" (
	"poll_id" BIGINT NOT NULL,
	"index" SMALLINT NOT NULL,
	"text" VARCHAR(512) NOT NULL,

	PRIMARY KEY ("poll_id", "index"),
	CONSTRAINT "polloption_poll_fk" FOREIGN KEY ("poll_id") REFERENCES "Poll" ("id") ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS "Vote" (
	"user_id" BIGINT NOT NULL,
	"poll_id" BIGINT NOT NULL,
	"option_index" SMALLINT NOT NULL,

	PRIMARY KEY ("user_id", "poll_id", "option_index"),
	CONSTRAINT "vote_user_fk" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE,
	CONSTRAINT "vote_poll_fk" FOREIGN KEY ("poll_id") REFERENCES "Poll" ("id") ON DELETE CASCADE
)