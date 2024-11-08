-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- pgModeler version: 1.1.4
-- PostgreSQL version: 16.0
-- Project Site: pgmodeler.io
-- Model Author: ---

-- Database creation must be performed outside a multi lined SQL file. 
-- These commands were put in this file only as a convenience.
-- 
-- object: live_poll | type: DATABASE --
-- DROP DATABASE IF EXISTS live_poll;
--CREATE DATABASE live_poll;
-- ddl-end --


-- object: public.poll_type | type: TYPE --
-- DROP TYPE IF EXISTS public.poll_type CASCADE;
CREATE TYPE poll_type AS
ENUM ('single','multiple','rate');
-- ddl-end --
-- ALTER TYPE poll_type OWNER TO postgres;
-- ddl-end --

-- object: provider | type: TYPE --
-- DROP TYPE IF EXISTS provider CASCADE;
CREATE TYPE provider AS
ENUM ('twitch','google','facebook');
-- ddl-end --
-- ALTER TYPE provider OWNER TO postgres;
-- ddl-end --

-- object: "Poll" | type: TABLE --
-- DROP TABLE IF EXISTS "Poll" CASCADE;
CREATE TABLE "Poll" (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	identifier varchar(32) NOT NULL,
	creator_user_id bigint NOT NULL,
	title varchar(255) NOT NULL,
	description text,
	type poll_type NOT NULL,
	allow_new_options boolean NOT NULL DEFAULT false,
	allow_vote_edit boolean NOT NULL DEFAULT false,
	ends_at timestamptz NOT NULL,
	required_providers provider[],
	required_provider_subs provider[],
	is_closed boolean NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT poll_identifier_unique UNIQUE (identifier),
	CONSTRAINT poll_pk PRIMARY KEY (id)
);
-- ddl-end --
-- ALTER TABLE "Poll" OWNER TO postgres;
-- ddl-end --

-- object: "User" | type: TABLE --
-- DROP TABLE IF EXISTS "User" CASCADE;
CREATE TABLE "User" (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	identifier varchar(32) NOT NULL,
	initial_provider provider NOT NULL,
	CONSTRAINT user_identifier_unique UNIQUE (identifier),
	CONSTRAINT user_pk PRIMARY KEY (id)
);
-- ddl-end --
-- ALTER TABLE "User" OWNER TO postgres;
-- ddl-end --

-- object: user_identifier_index | type: INDEX --
-- DROP INDEX IF EXISTS user_identifier_index CASCADE;
CREATE INDEX user_identifier_index ON "User"
USING btree
(
	identifier
);
-- ddl-end --

-- object: poll_identifier_index | type: INDEX --
-- DROP INDEX IF EXISTS poll_identifier_index CASCADE;
CREATE INDEX poll_identifier_index ON "Poll"
USING btree
(
	identifier
);
-- ddl-end --

-- object: "Account" | type: TABLE --
-- DROP TABLE IF EXISTS "Account" CASCADE;
CREATE TABLE "Account" (
	user_id bigint NOT NULL,
	provider provider NOT NULL,
	provider_account_id text NOT NULL,
	username varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "account_userId_provider_unique" UNIQUE (user_id,provider),
	CONSTRAINT "Account_pk" PRIMARY KEY (user_id,provider)
);
-- ddl-end --
-- ALTER TABLE "Account" OWNER TO postgres;
-- ddl-end --

-- object: "PollOption" | type: TABLE --
-- DROP TABLE IF EXISTS "PollOption" CASCADE;
CREATE TABLE "PollOption" (
	poll_id bigint NOT NULL,
	index smallint NOT NULL,
	label varchar(512),
	CONSTRAINT "pollOption_pk" PRIMARY KEY (poll_id,index)
);
-- ddl-end --
-- ALTER TABLE "PollOption" OWNER TO postgres;
-- ddl-end --

-- object: "Vote" | type: TABLE --
-- DROP TABLE IF EXISTS "Vote" CASCADE;
CREATE TABLE "Vote" (
	user_id bigint NOT NULL,
	poll_id bigint NOT NULL,
	option_index smallint NOT NULL,
	CONSTRAINT vote_pk PRIMARY KEY (user_id,poll_id,option_index)
);
-- ddl-end --
-- ALTER TABLE "Vote" OWNER TO postgres;
-- ddl-end --

-- object: "Rate" | type: TABLE --
-- DROP TABLE IF EXISTS "Rate" CASCADE;
CREATE TABLE "Rate" (
	user_id bigint NOT NULL,
	poll_id bigint NOT NULL,
	option_index smallint NOT NULL,
	rating smallint NOT NULL,
	CONSTRAINT rate_pk PRIMARY KEY (user_id,poll_id,option_index),
	CONSTRAINT rate_rating_check CHECK (rating <= 5 AND rating >= 1)
);
-- ddl-end --
-- ALTER TABLE "Rate" OWNER TO postgres;
-- ddl-end --

-- object: "OptionCreator" | type: TABLE --
-- DROP TABLE IF EXISTS "OptionCreator" CASCADE;
CREATE TABLE "OptionCreator" (
	user_id bigint NOT NULL,
	poll_id bigint NOT NULL,
	option_index smallint NOT NULL,
	created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "optionCreator_pk" PRIMARY KEY (user_id,poll_id,option_index)
);
-- ddl-end --
-- ALTER TABLE "OptionCreator" OWNER TO postgres;
-- ddl-end --

-- object: "Request" | type: TABLE --
-- DROP TABLE IF EXISTS "Request" CASCADE;
CREATE TABLE "Request" (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	identifier varchar(32) NOT NULL,
	title varchar(128) NOT NULL,
	description varchar(8192),
	url varchar(2048),
	created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	creator_user_id bigint NOT NULL,
	resquested_to_user_id bigint NOT NULL,
	is_seen boolean NOT NULL DEFAULT FALSE,
	CONSTRAINT request_pk PRIMARY KEY (id),
	CONSTRAINT request_identifier_unique UNIQUE (identifier)
);
-- ddl-end --
-- ALTER TABLE "Request" OWNER TO postgres;
-- ddl-end --

-- object: request_identifier_index | type: INDEX --
-- DROP INDEX IF EXISTS request_identifier_index CASCADE;
CREATE INDEX request_identifier_index ON "Request"
USING btree
(
	identifier
);
-- ddl-end --

-- object: request_vote | type: TYPE --
-- DROP TYPE IF EXISTS request_vote CASCADE;
CREATE TYPE request_vote AS
ENUM ('up_vote','mid_vote','down_vote');
-- ddl-end --
-- ALTER TYPE request_vote OWNER TO postgres;
-- ddl-end --

-- object: "RequestVote" | type: TABLE --
-- DROP TABLE IF EXISTS "RequestVote" CASCADE;
CREATE TABLE "RequestVote" (
	request_id bigint NOT NULL,
	user_id bigint NOT NULL,
	vote request_vote NOT NULL,
	CONSTRAINT "requestVote_pk" PRIMARY KEY (request_id,user_id)
);
-- ddl-end --
-- ALTER TABLE "RequestVote" OWNER TO postgres;
-- ddl-end --

-- object: theme | type: TYPE --
-- DROP TYPE IF EXISTS theme CASCADE;
CREATE TYPE theme AS
ENUM ('dark','light','system');
-- ddl-end --
-- ALTER TYPE theme OWNER TO postgres;
-- ddl-end --

-- object: language | type: TYPE --
-- DROP TYPE IF EXISTS language CASCADE;
CREATE TYPE language AS
ENUM ('en-US','pt-BR','es-ES');
-- ddl-end --
-- ALTER TYPE language OWNER TO postgres;
-- ddl-end --

-- object: "UserPreferences" | type: TABLE --
-- DROP TABLE IF EXISTS "UserPreferences" CASCADE;
CREATE TABLE "UserPreferences" (
	user_id bigint NOT NULL,
	requests_min_votes smallint,
	theme theme NOT NULL DEFAULT CAST ('system' AS theme),
	language language NOT NULL DEFAULT CAST ('en-US' AS language),
	CONSTRAINT "userPreferences_pk" PRIMARY KEY (user_id),
	CONSTRAINT "userPreferences_requestsMinVotes_check" CHECK (rating <= 5 AND rating >= 1)
);
-- ddl-end --
-- ALTER TABLE "UserPreferences" OWNER TO postgres;
-- ddl-end --

-- object: "poll_creatorUserId_fk" | type: CONSTRAINT --
-- ALTER TABLE "Poll" DROP CONSTRAINT IF EXISTS "poll_creatorUserId_fk" CASCADE;
ALTER TABLE "Poll" ADD CONSTRAINT "poll_creatorUserId_fk" FOREIGN KEY (creator_user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "account_userId_fk" | type: CONSTRAINT --
-- ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "account_userId_fk" CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "account_userId_fk" FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "pollOption_poll_fk" | type: CONSTRAINT --
-- ALTER TABLE "PollOption" DROP CONSTRAINT IF EXISTS "pollOption_poll_fk" CASCADE;
ALTER TABLE "PollOption" ADD CONSTRAINT "pollOption_poll_fk" FOREIGN KEY (poll_id)
REFERENCES "Poll" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: vote_user_fk | type: CONSTRAINT --
-- ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS vote_user_fk CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT vote_user_fk FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: vote_option_fk | type: CONSTRAINT --
-- ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS vote_option_fk CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT vote_option_fk FOREIGN KEY (poll_id,option_index)
REFERENCES "PollOption" (poll_id,index) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: rate_user_fk | type: CONSTRAINT --
-- ALTER TABLE "Rate" DROP CONSTRAINT IF EXISTS rate_user_fk CASCADE;
ALTER TABLE "Rate" ADD CONSTRAINT rate_user_fk FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: rate_option_fk | type: CONSTRAINT --
-- ALTER TABLE "Rate" DROP CONSTRAINT IF EXISTS rate_option_fk CASCADE;
ALTER TABLE "Rate" ADD CONSTRAINT rate_option_fk FOREIGN KEY (poll_id,option_index)
REFERENCES "PollOption" (poll_id,index) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "optionCreator_user_fk" | type: CONSTRAINT --
-- ALTER TABLE "OptionCreator" DROP CONSTRAINT IF EXISTS "optionCreator_user_fk" CASCADE;
ALTER TABLE "OptionCreator" ADD CONSTRAINT "optionCreator_user_fk" FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "optionCreator_option_fk" | type: CONSTRAINT --
-- ALTER TABLE "OptionCreator" DROP CONSTRAINT IF EXISTS "optionCreator_option_fk" CASCADE;
ALTER TABLE "OptionCreator" ADD CONSTRAINT "optionCreator_option_fk" FOREIGN KEY (poll_id,option_index)
REFERENCES "PollOption" (poll_id,index) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "request_creatorUserId_fk" | type: CONSTRAINT --
-- ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "request_creatorUserId_fk" CASCADE;
ALTER TABLE "Request" ADD CONSTRAINT "request_creatorUserId_fk" FOREIGN KEY (creator_user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE CASCADE;
-- ddl-end --

-- object: "request_requestedToUserId_fk" | type: CONSTRAINT --
-- ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "request_requestedToUserId_fk" CASCADE;
ALTER TABLE "Request" ADD CONSTRAINT "request_requestedToUserId_fk" FOREIGN KEY (resquested_to_user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "requestVote_requestId_fk" | type: CONSTRAINT --
-- ALTER TABLE "RequestVote" DROP CONSTRAINT IF EXISTS "requestVote_requestId_fk" CASCADE;
ALTER TABLE "RequestVote" ADD CONSTRAINT "requestVote_requestId_fk" FOREIGN KEY (request_id)
REFERENCES "Request" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "requestVote_userId_fk" | type: CONSTRAINT --
-- ALTER TABLE "RequestVote" DROP CONSTRAINT IF EXISTS "requestVote_userId_fk" CASCADE;
ALTER TABLE "RequestVote" ADD CONSTRAINT "requestVote_userId_fk" FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --

-- object: "userPreferences_user_fk" | type: CONSTRAINT --
-- ALTER TABLE "UserPreferences" DROP CONSTRAINT IF EXISTS "userPreferences_user_fk" CASCADE;
ALTER TABLE "UserPreferences" ADD CONSTRAINT "userPreferences_user_fk" FOREIGN KEY (user_id)
REFERENCES "User" (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --


