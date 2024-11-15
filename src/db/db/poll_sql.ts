import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getPollDataListQuery = `-- name: getPollDataList :many
SELECT "Poll".identifier AS identifier, "User".identifier AS creator_user_identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, is_closed, ends_at, created_at, COUNT("Vote_and_rate".poll_id) AS vote_rate_count
FROM "Poll"
LEFT JOIN (
	SELECT poll_id, option_index FROM "Vote"
	UNION ALL
	SELECT poll_id, option_index FROM "Rate"
	) AS "Vote_and_rate"
ON "Poll".id = "Vote_and_rate".poll_id
INNER JOIN "User"
ON "Poll".creator_user_id = "User".id
GROUP BY "Poll".id, "User".identifier`;

export interface getPollDataListRow {
    identifier: string;
    creatorUserIdentifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    isClosed: boolean;
    endsAt: Date;
    createdAt: Date;
    voteRateCount: string;
}

export async function getPollDataList(client: Client): Promise<getPollDataListRow[]> {
    const result = await client.query({
        text: getPollDataListQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            creatorUserIdentifier: row[1],
            title: row[2],
            description: row[3],
            type: row[4],
            allowNewOptions: row[5],
            requiredProviders: row[6],
            requiredProviderSubs: row[7],
            isClosed: row[8],
            endsAt: row[9],
            createdAt: row[10],
            voteRateCount: row[11]
        };
    });
}

export const getPollDataListFromUserByIdentifierQuery = `-- name: getPollDataListFromUserByIdentifier :many
WITH "User_id_cte" AS (
	SELECT id FROM "User"
	WHERE identifier = $1
),
"Vote_rate_data_cte" AS (
	SELECT poll_id, user_id, option_index FROM "Vote"
	UNION ALL
	SELECT poll_id, user_id, option_index FROM "Rate"
)
SELECT "User_created_polls".identifier AS identifier, (SELECT $1::VARCHAR) AS creator_user_identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, ends_at, created_at, COUNT("Vote_and_rate".poll_id) AS vote_rate_count, ("Has_voted".has_voted IS NOT NULL) AS has_voted
FROM (
	SELECT id, identifier, creator_user_id, title, description, type, allow_new_options, allow_vote_edit, ends_at, required_providers, required_provider_subs, is_closed, created_at FROM "Poll"
	WHERE "Poll".creator_user_id = (SELECT id FROM "User_id_cte")
) AS "User_created_polls"
LEFT JOIN (
	SELECT poll_id, option_index FROM "Vote_rate_data_cte"
	) AS "Vote_and_rate"
ON "User_created_polls".id = "Vote_and_rate".poll_id
LEFT JOIN (
	SELECT TRUE AS has_voted, poll_id
	FROM "Vote_rate_data_cte"
	WHERE user_id = (SELECT id FROM "User_id_cte")
	GROUP BY has_voted, poll_id
) AS "Has_voted"
ON "User_created_polls".id = "Has_voted".poll_id
GROUP BY "Has_voted".has_voted, "User_created_polls".id, "User_created_polls".identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, created_at
ORDER BY created_at DESC`;

export interface getPollDataListFromUserByIdentifierArgs {
    identifier: string;
}

export interface getPollDataListFromUserByIdentifierRow {
    identifier: string;
    creatorUserIdentifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    isClosed: boolean;
    endsAt: Date;
    createdAt: Date;
    voteRateCount: string;
    hasVoted: string | null;
}

export async function getPollDataListFromUserByIdentifier(client: Client, args: getPollDataListFromUserByIdentifierArgs): Promise<getPollDataListFromUserByIdentifierRow[]> {
    const result = await client.query({
        text: getPollDataListFromUserByIdentifierQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            creatorUserIdentifier: row[1],
            title: row[2],
            description: row[3],
            type: row[4],
            allowNewOptions: row[5],
            requiredProviders: row[6],
            requiredProviderSubs: row[7],
            isClosed: row[8],
            endsAt: row[9],
            createdAt: row[10],
            voteRateCount: row[11],
            hasVoted: row[12]
        };
    });
}

export const getOpenPollDataListFromUserByIdentifierQuery = `-- name: getOpenPollDataListFromUserByIdentifier :many
WITH "User_id_cte" AS (
	SELECT id FROM "User"
	WHERE identifier = $1
),
"Vote_rate_data_cte" AS (
	SELECT poll_id, user_id, option_index FROM "Vote"
	UNION ALL
	SELECT poll_id, user_id, option_index FROM "Rate"
)
SELECT "User_created_polls".identifier AS identifier, (SELECT $1::VARCHAR) AS creator_user_identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, ends_at, created_at, COUNT("Vote_and_rate".poll_id) AS vote_rate_count, ("Has_voted".has_voted IS NOT NULL) AS has_voted
FROM (
	SELECT id, identifier, creator_user_id, title, description, type, allow_new_options, allow_vote_edit, ends_at, required_providers, required_provider_subs, is_closed, created_at FROM "Poll"
	WHERE "Poll".creator_user_id = (SELECT id FROM "User_id_cte")
	AND "Poll".is_closed = FALSE
	AND "Poll".ends_at > NOW()
) AS "User_created_polls"
LEFT JOIN (
	SELECT poll_id, option_index FROM "Vote_rate_data_cte"
	) AS "Vote_and_rate"
ON "User_created_polls".id = "Vote_and_rate".poll_id
LEFT JOIN (
	SELECT TRUE AS has_voted, poll_id
	FROM "Vote_rate_data_cte"
	WHERE user_id = (SELECT id FROM "User_id_cte")
	GROUP BY has_voted, poll_id
) AS "Has_voted"
ON "User_created_polls".id = "Has_voted".poll_id
GROUP BY "Has_voted".has_voted, "User_created_polls".id, "User_created_polls".identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, created_at
ORDER BY created_at DESC`;

export interface getOpenPollDataListFromUserByIdentifierArgs {
    identifier: string;
}

export interface getOpenPollDataListFromUserByIdentifierRow {
    identifier: string;
    creatorUserIdentifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    isClosed: boolean;
    endsAt: Date;
    createdAt: Date;
    voteRateCount: string;
    hasVoted: string | null;
}

export async function getOpenPollDataListFromUserByIdentifier(client: Client, args: getOpenPollDataListFromUserByIdentifierArgs): Promise<getOpenPollDataListFromUserByIdentifierRow[]> {
    const result = await client.query({
        text: getOpenPollDataListFromUserByIdentifierQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            creatorUserIdentifier: row[1],
            title: row[2],
            description: row[3],
            type: row[4],
            allowNewOptions: row[5],
            requiredProviders: row[6],
            requiredProviderSubs: row[7],
            isClosed: row[8],
            endsAt: row[9],
            createdAt: row[10],
            voteRateCount: row[11],
            hasVoted: row[12]
        };
    });
}

export const getClosedPollDataListFromUserByIdentifierQuery = `-- name: getClosedPollDataListFromUserByIdentifier :many
WITH "User_id_cte" AS (
	SELECT id FROM "User"
	WHERE identifier = $1
),
"Vote_rate_data_cte" AS (
	SELECT poll_id, user_id, option_index FROM "Vote"
	UNION ALL
	SELECT poll_id, user_id, option_index FROM "Rate"
)
SELECT "User_created_polls".identifier AS identifier, (SELECT $1::VARCHAR) AS creator_user_identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, ends_at, created_at, COUNT("Vote_and_rate".poll_id) AS vote_rate_count, ("Has_voted".has_voted IS NOT NULL) AS has_voted
FROM (
	SELECT id, identifier, creator_user_id, title, description, type, allow_new_options, allow_vote_edit, ends_at, required_providers, required_provider_subs, is_closed, created_at FROM "Poll"
	WHERE "Poll".creator_user_id = (SELECT id FROM "User_id_cte")
	AND ("Poll".is_closed = TRUE OR "Poll".ends_at < NOW())
) AS "User_created_polls"
LEFT JOIN (
	SELECT poll_id, option_index FROM "Vote_rate_data_cte"
	) AS "Vote_and_rate"
ON "User_created_polls".id = "Vote_and_rate".poll_id
LEFT JOIN (
	SELECT TRUE AS has_voted, poll_id
	FROM "Vote_rate_data_cte"
	WHERE user_id = (SELECT id FROM "User_id_cte")
	GROUP BY has_voted, poll_id
) AS "Has_voted"
ON "User_created_polls".id = "Has_voted".poll_id
GROUP BY "Has_voted".has_voted, "User_created_polls".id, "User_created_polls".identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, created_at
ORDER BY created_at DESC`;

export interface getClosedPollDataListFromUserByIdentifierArgs {
    identifier: string;
}

export interface getClosedPollDataListFromUserByIdentifierRow {
    identifier: string;
    creatorUserIdentifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    isClosed: boolean;
    endsAt: Date;
    createdAt: Date;
    voteRateCount: string;
    hasVoted: string | null;
}

export async function getClosedPollDataListFromUserByIdentifier(client: Client, args: getClosedPollDataListFromUserByIdentifierArgs): Promise<getClosedPollDataListFromUserByIdentifierRow[]> {
    const result = await client.query({
        text: getClosedPollDataListFromUserByIdentifierQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            creatorUserIdentifier: row[1],
            title: row[2],
            description: row[3],
            type: row[4],
            allowNewOptions: row[5],
            requiredProviders: row[6],
            requiredProviderSubs: row[7],
            isClosed: row[8],
            endsAt: row[9],
            createdAt: row[10],
            voteRateCount: row[11],
            hasVoted: row[12]
        };
    });
}

export const getPollListFromUserByIdentifierQuery = `-- name: getPollListFromUserByIdentifier :many
SELECT identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, is_closed, ends_at created_at
FROM "Poll"
WHERE creator_user_id = $1`;

export interface getPollListFromUserByIdentifierArgs {
    creatorUserId: string;
}

export interface getPollListFromUserByIdentifierRow {
    identifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    isClosed: boolean;
    createdAt: Date;
}

export async function getPollListFromUserByIdentifier(client: Client, args: getPollListFromUserByIdentifierArgs): Promise<getPollListFromUserByIdentifierRow[]> {
    const result = await client.query({
        text: getPollListFromUserByIdentifierQuery,
        values: [args.creatorUserId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            title: row[1],
            description: row[2],
            type: row[3],
            allowNewOptions: row[4],
            requiredProviders: row[5],
            requiredProviderSubs: row[6],
            isClosed: row[7],
            createdAt: row[8]
        };
    });
}

export const getPollDataWithVoteCountQuery = `-- name: getPollDataWithVoteCount :one
SELECT identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, created_at, index, label, COUNT(option_index) AS vote_count
FROM (
	SELECT id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label FROM "Poll"
	INNER JOIN "PollOption"
	ON "Poll".id = "PollOption".poll_id
	WHERE identifier = $1
) AS "poll_with_options"
INNER JOIN "Vote"
ON "poll_with_options".id = "Vote".poll_id AND "poll_with_options".index = "Vote".option_index
GROUP BY  id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label, "Vote".option_index
LIMIT 1`;

export interface getPollDataWithVoteCountArgs {
    identifier: string;
}

export interface getPollDataWithVoteCountRow {
    identifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    endsAt: Date;
    isClosed: boolean;
    createdAt: Date;
    index: number;
    label: string | null;
    voteCount: string;
}

export async function getPollDataWithVoteCount(client: Client, args: getPollDataWithVoteCountArgs): Promise<getPollDataWithVoteCountRow | null> {
    const result = await client.query({
        text: getPollDataWithVoteCountQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        identifier: row[0],
        title: row[1],
        description: row[2],
        type: row[3],
        allowNewOptions: row[4],
        requiredProviders: row[5],
        requiredProviderSubs: row[6],
        endsAt: row[7],
        isClosed: row[8],
        createdAt: row[9],
        index: row[10],
        label: row[11],
        voteCount: row[12]
    };
}

export const getPollDataWithVotesQuery = `-- name: getPollDataWithVotes :many

WITH "Null_rating" AS (
	SELECT NULL::SMALLINT AS "rating"
),
"Poll_id_cte" AS (
	SELECT id FROM "Poll"
	WHERE identifier = $1
),
"User_id_cte" AS (
	SELECT id FROM "User"
	WHERE "User".identifier = $2
)
SELECT identifier, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, "Poll_with_options".created_at, index, label, COUNT("Vote_rate_with_hascreated".option_index) AS vote_rate_count, has_created,
	CASE WHEN "Poll_with_options".type = 'rate' THEN AVG("Vote_rate_with_hascreated".rating) END AS rate_avg,
	CAST(BOOL_OR(CASE WHEN "Vote_rate_with_hascreated".user_id = (SELECT id FROM "User_id_cte") THEN TRUE ELSE FALSE END) AS BOOLEAN) AS is_voted,
	"User_ratings".rating
FROM (
	SELECT id, identifier, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label
	FROM "Poll"
	INNER JOIN "PollOption"
	ON "Poll".id = "PollOption".poll_id
	WHERE "Poll".identifier = $1
) AS "Poll_with_options"
LEFT JOIN (
	SELECT user_id, poll_id, option_index, rating
	FROM (
		SELECT user_id, poll_id, option_index FROM "Vote"
		WHERE poll_id = (SELECT id FROM "Poll_id_cte")
	) AS "Poll_votes"
	CROSS JOIN "Null_rating"
	UNION ALL
	SELECT user_id, poll_id, option_index, rating
	FROM "Rate"
	WHERE poll_id = (SELECT id FROM "Poll_id_cte")
) AS "Vote_rate_with_hascreated"
ON "Poll_with_options".id = "Vote_rate_with_hascreated".poll_id AND "Poll_with_options".index = "Vote_rate_with_hascreated".option_index
CROSS JOIN
(
	SELECT EXISTS(
		SELECT created_at FROM "OptionCreator"
		WHERE "OptionCreator".poll_id = (SELECT id FROM "Poll_id_cte")
		AND "OptionCreator".user_id = (SELECT id FROM "User_id_cte")
		LIMIT 1
	) AS has_created
) AS "Has_created_row"
LEFT JOIN (
	SELECT poll_id, user_id, option_index, rating
	FROM "Rate"
	WHERE poll_id = (SELECT id FROM "Poll_id_cte")	
	AND user_id = (SELECT id FROM "User_id_cte")
) AS "User_ratings"
ON "Vote_rate_with_hascreated".option_index = "User_ratings".option_index
GROUP BY  id, identifier, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at, "Poll_with_options".created_at, index, label, "Vote_rate_with_hascreated".option_index, "Has_created_row".has_created, "User_ratings".rating
ORDER BY "Poll_with_options".index ASC`;

export interface getPollDataWithVotesArgs {
    identifier: string;
    userIdentifier: string;
}

export interface getPollDataWithVotesRow {
    identifier: string;
    title: string;
    description: string | null;
    type: string;
    allowNewOptions: boolean;
    allowVoteEdit: boolean;
    requiredProviders: string[] | null;
    requiredProviderSubs: string[] | null;
    endsAt: Date;
    isClosed: boolean;
    createdAt: Date;
    index: number;
    label: string | null;
    voteRateCount: string;
    hasCreated: boolean;
    rateAvg: string | null;
    isVoted: boolean;
    rating: number;
}

export async function getPollDataWithVotes(client: Client, args: getPollDataWithVotesArgs): Promise<getPollDataWithVotesRow[]> {
    const result = await client.query({
        text: getPollDataWithVotesQuery,
        values: [args.identifier, args.userIdentifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            title: row[1],
            description: row[2],
            type: row[3],
            allowNewOptions: row[4],
            allowVoteEdit: row[5],
            requiredProviders: row[6],
            requiredProviderSubs: row[7],
            endsAt: row[8],
            isClosed: row[9],
            createdAt: row[10],
            index: row[11],
            label: row[12],
            voteRateCount: row[13],
            hasCreated: row[14],
            rateAvg: row[15],
            isVoted: row[16],
            rating: row[17]
        };
    });
}

export const getPollVotesQuery = `-- name: getPollVotes :many
WITH "Vote_with_rating" AS (
	SELECT -1 AS "rating"
)
SELECT identifier, index, label, COUNT(option_index) AS vote_rate_count,
	CASE WHEN "Poll_with_options".type = 'rate' THEN AVG("Vote_rate".rating) END AS rate_avg
FROM (
	SELECT id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label FROM "Poll"
	INNER JOIN "PollOption"
	ON "Poll".id = "PollOption".poll_id
	WHERE "Poll".identifier = $1
) AS "Poll_with_options"
LEFT JOIN (
	SELECT poll_id, option_index, rating
	FROM "Vote"
	CROSS JOIN "Vote_with_rating"
	WHERE poll_id = (SELECT id FROM "Poll" WHERE identifier = $1 AND type IN ('single', 'multiple'))
	UNION ALL
	SELECT poll_id, option_index, rating
	FROM "Rate"
	WHERE poll_id = (SELECT id FROM "Poll" WHERE identifier = $1 AND type = 'rate')
) AS "Vote_rate"
ON "Poll_with_options".id = "Vote_rate".poll_id AND "Poll_with_options".index = "Vote_rate".option_index
GROUP BY  id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label, "Vote_rate".option_index`;

export interface getPollVotesArgs {
    identifier: string;
}

export interface getPollVotesRow {
    identifier: string;
    index: number;
    label: string | null;
    voteRateCount: string;
    rateAvg: string | null;
}

export async function getPollVotes(client: Client, args: getPollVotesArgs): Promise<getPollVotesRow[]> {
    const result = await client.query({
        text: getPollVotesQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            index: row[1],
            label: row[2],
            voteRateCount: row[3],
            rateAvg: row[4]
        };
    });
}

export const createMultipleVotesQuery = `-- name: createMultipleVotes :many
WITH "user_id_row" AS (
	SELECT $1::BIGINT AS "user_id"
),
"poll_user_id_row" AS (
	SELECT "id", "user_id" FROM "Poll"
	CROSS JOIN
	"user_id_row"
	WHERE "identifier" = $2
),
"vote_rows" AS (
	SELECT "option_index", "user_id", "id" AS "poll_id"
	FROM (SELECT UNNEST($3::SMALLINT[]) AS "option_index") AS "voted_data"
	CROSS JOIN "poll_user_id_row"
)
INSERT INTO "Vote" (user_id, poll_id, option_index)
SELECT "user_id", "poll_id", "option_index"
FROM "vote_rows"
RETURNING user_id, poll_id, option_index`;

export interface createMultipleVotesArgs {
    userId: string;
    pollIdentifier: string;
    voteIndexList: number[];
}

export interface createMultipleVotesRow {
    userId: string;
    pollId: string;
    optionIndex: number;
}

export async function createMultipleVotes(client: Client, args: createMultipleVotesArgs): Promise<createMultipleVotesRow[]> {
    const result = await client.query({
        text: createMultipleVotesQuery,
        values: [args.userId, args.pollIdentifier, args.voteIndexList],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            userId: row[0],
            pollId: row[1],
            optionIndex: row[2]
        };
    });
}

export const createSingleVoteQuery = `-- name: createSingleVote :one
WITH "user_id_row" AS (
	SELECT $2::BIGINT AS "user_id"
),
"poll_user_id_row" AS (
	SELECT "id", "user_id" FROM "Poll"
	CROSS JOIN
	"user_id_row"
	WHERE "identifier" = $3
)
INSERT INTO "Vote" (user_id, poll_id, option_index)
SELECT "user_id", "poll_id", "option_index"
FROM (
	SELECT "option_index", "user_id", "id" AS "poll_id"
	FROM (SELECT $1::SMALLINT AS "option_index") AS "voted_data"
	CROSS JOIN "poll_user_id_row"
) AS "insert_values" RETURNING user_id, poll_id, option_index`;

export interface createSingleVoteArgs {
    voteIndex: number;
    userId: string;
    pollIdentifier: string;
}

export interface createSingleVoteRow {
    userId: string;
    pollId: string;
    optionIndex: number;
}

export async function createSingleVote(client: Client, args: createSingleVoteArgs): Promise<createSingleVoteRow | null> {
    const result = await client.query({
        text: createSingleVoteQuery,
        values: [args.voteIndex, args.userId, args.pollIdentifier],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        pollId: row[1],
        optionIndex: row[2]
    };
}

export const registerMultipleVotesQuery = `-- name: registerMultipleVotes :many
WITH "user_id_row" AS (
	SELECT id AS "user_id" FROM "User" WHERE "User".identifier = $1
),
"poll_id_row" AS (
	SELECT id AS "poll_id" FROM "Poll" WHERE "Poll".identifier = $2
),
"poll_user_id_row" AS (
	SELECT "poll_id", "user_id" FROM "poll_id_row"
	CROSS JOIN "user_id_row"
),
"unnested_votes_array" AS (
	SELECT UNNEST($3::SMALLINT[]) AS "option_index"
),
"old_votes" AS (
	SELECT option_index FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
),
"to_insert_votes" AS (
	SELECT option_index FROM "unnested_votes_array"
	WHERE option_index NOT IN (SELECT option_index FROM "old_votes")
),
"to_delete_votes" AS (
	SELECT option_index FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index NOT IN (SELECT option_index FROM "unnested_votes_array")
),
"deleted_votes" AS (
	DELETE FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index IN (SELECT option_index FROM "to_delete_votes")
	RETURNING user_id, poll_id, option_index
),
"new_votes" AS (
	SELECT "option_index", "user_id", "poll_id"
	FROM "to_insert_votes"
	CROSS JOIN "poll_user_id_row"
),
"inserted_votes" AS (
	INSERT INTO "Vote" (user_id, poll_id, option_index)
	SELECT user_id, poll_id, option_index
	FROM "new_votes"
	RETURNING user_id, poll_id, option_index
)
SELECT "option_index", "user_id", "poll_id"
FROM "unnested_votes_array"
CROSS JOIN "poll_user_id_row"`;

export interface registerMultipleVotesArgs {
    userIdentifier: string;
    pollIdentifier: string;
    optionIndexList: number[];
}

export interface registerMultipleVotesRow {
    optionIndex: string;
    userId: string;
    pollId: string;
}

export async function registerMultipleVotes(client: Client, args: registerMultipleVotesArgs): Promise<registerMultipleVotesRow[]> {
    const result = await client.query({
        text: registerMultipleVotesQuery,
        values: [args.userIdentifier, args.pollIdentifier, args.optionIndexList],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            optionIndex: row[0],
            userId: row[1],
            pollId: row[2]
        };
    });
}

export const registerSingleVoteQuery = `-- name: registerSingleVote :one
WITH "poll_userid_cte" AS (
	SELECT "poll_id", "user_id"
	FROM (
		SELECT id AS "poll_id" FROM "Poll" WHERE "Poll".identifier = $1
		AND type = 'single'
	) AS "poll_id_subq"
	CROSS JOIN (
		SELECT id AS "user_id" FROM "User" WHERE "User".identifier = $2
	) AS "user_id_subq"
),
"new_vote" AS (
	SELECT "option_index", "user_id", "poll_id"
	FROM (SELECT $3::SMALLINT AS option_index) AS "new_vote_subq" --VOTE
	CROSS JOIN "poll_userid_cte"
	LIMIT 1
),
"poll_user_vote" AS (
	SELECT option_index FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_userid_cte")
	AND user_id = (SELECT user_id FROM "poll_userid_cte")
	--LIMIT 1
),
"to_insert_votes" AS (
	SELECT option_index FROM "new_vote"
	WHERE option_index NOT IN (SELECT option_index FROM "poll_user_vote")
	LIMIT 1
),
"to_delete_votes" AS (
	SELECT option_index FROM "poll_user_vote"
	WHERE option_index != (SELECT option_index FROM "new_vote")
	LIMIT 1
),
"deleted_votes" AS (
	DELETE FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_userid_cte")
	AND user_id = (SELECT user_id FROM "poll_userid_cte")
	AND option_index = (SELECT option_index FROM "to_delete_votes")
	RETURNING user_id, poll_id, option_index
),
"inserted_votes" AS (
	INSERT INTO "Vote" (user_id, poll_id, option_index)
	SELECT user_id, poll_id, option_index
	FROM "new_vote"
	WHERE option_index = (SELECT option_index FROM "to_insert_votes")
	RETURNING user_id, poll_id, option_index
)
SELECT option_index, user_id, poll_id FROM "new_vote"
LIMIT 1`;

export interface registerSingleVoteArgs {
    pollIdentifier: string;
    userIdentifier: string;
    optionIndex: number;
}

export interface registerSingleVoteRow {
    optionIndex: number;
    userId: string;
    pollId: string;
}

export async function registerSingleVote(client: Client, args: registerSingleVoteArgs): Promise<registerSingleVoteRow | null> {
    const result = await client.query({
        text: registerSingleVoteQuery,
        values: [args.pollIdentifier, args.userIdentifier, args.optionIndex],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        optionIndex: row[0],
        userId: row[1],
        pollId: row[2]
    };
}

export const registerMultipleRatesQuery = `-- name: registerMultipleRates :many
WITH "user_id_row" AS (
	SELECT id AS "user_id" FROM "User" WHERE "User".identifier = $1
),
"poll_id_row" AS (
	SELECT id AS "poll_id" FROM "Poll" WHERE "Poll".identifier = $2
),
"poll_user_id_row" AS (
	SELECT "poll_id", "user_id" FROM "poll_id_row"
	CROSS JOIN "user_id_row"
),
"unnested_ratings_array" AS (
	SELECT 
   	CAST(data ->> 0 AS SMALLINT) AS option_index,
   	CAST(data ->> 1 AS SMALLINT) AS rating
	FROM jsonb_array_elements(to_jsonb($3::SMALLINT[][])) AS x(data)
),
"old_rates" AS (
	SELECT option_index FROM "Rate"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
),
"to_insert_rates" AS (
	SELECT option_index, rating FROM "unnested_ratings_array"
	WHERE option_index NOT IN (SELECT option_index FROM "old_rates")
),
"to_delete_rates" AS (
	SELECT option_index FROM "Rate"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index NOT IN (SELECT option_index FROM "unnested_ratings_array")
),
"deleted_rates" AS (
	DELETE FROM "Rate"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index IN (SELECT option_index FROM "to_delete_rates")
	RETURNING user_id, poll_id, option_index, rating
),
"new_rates" AS (
	SELECT "option_index", "user_id", "poll_id", "rating"
	FROM "to_insert_rates"
	CROSS JOIN "poll_user_id_row"
),
"inserted_rates" AS (
	INSERT INTO "Rate" (user_id, poll_id, option_index, rating)
	SELECT user_id, poll_id, option_index, rating
	FROM "new_rates"
	RETURNING user_id, poll_id, option_index, rating
),
"updated_rates" AS (
	UPDATE "Rate" 
	SET rating = "unnested_ratings_array".rating
	FROM "unnested_ratings_array"
	WHERE "unnested_ratings_array".option_index = "Rate".option_index
	AND "Rate".poll_id = (SELECT poll_id FROM "poll_id_row")
	AND "Rate".user_id = (SELECT user_id FROM "user_id_row")
	RETURNING unnested_ratings_array.option_index, unnested_ratings_array.rating, user_id, poll_id, "Rate".option_index, "Rate".rating
)
SELECT "option_index", "user_id", "poll_id", "rating"
FROM "unnested_ratings_array"
CROSS JOIN "poll_user_id_row"`;

export interface registerMultipleRatesArgs {
    userIdentifier: string;
    pollIdentifier: string;
    indexRatingPairList: number[][];
}

export interface registerMultipleRatesRow {
    optionIndex: number;
    userId: string;
    pollId: string;
    rating: number;
}

export async function registerMultipleRates(client: Client, args: registerMultipleRatesArgs): Promise<registerMultipleRatesRow[]> {
    const result = await client.query({
        text: registerMultipleRatesQuery,
        values: [args.userIdentifier, args.pollIdentifier, args.indexRatingPairList],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            optionIndex: row[0],
            userId: row[1],
            pollId: row[2],
            rating: row[3]
        };
    });
}

export const registerNewOptionQuery = `-- name: registerNewOption :one


WITH "user_id_cte" AS (
	SELECT id FROM "User" WHERE "User".identifier = $1
),
"poll_id_type_cte" AS (
	SELECT id, type FROM "Poll" WHERE "Poll".identifier = $2
),
"highest_option_index_cte" AS (
	SELECT index FROM "PollOption"
	WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
	ORDER BY index DESC LIMIT 1
),
"new_option" AS (
	INSERT INTO "PollOption" (poll_id, index, label)
	-- SELECT * FROM (
		SELECT (SELECT id FROM "poll_id_type_cte"), (SELECT index FROM "highest_option_index_cte") + 1, $3::TEXT
	-- ) AS "insert_values"
	WHERE (
		SELECT COUNT(index) AS options_count FROM "PollOption"
		WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
		GROUP BY poll_id
	) < 100
	RETURNING poll_id, index, label
),
"new_option_creator" AS (
	INSERT INTO "OptionCreator" (user_id, poll_id, option_index)
	VALUES ((SELECT id AS user_id FROM "user_id_cte"),
			(SELECT id AS poll_id FROM "poll_id_type_cte"),
			(SELECT index AS option_index FROM "new_option")
		)
),
"old_vote_delete" AS (
	DELETE FROM "Vote"
	USING "Poll"
	WHERE "Poll".type = 'single'
	AND "Vote".user_id = (SELECT id FROM "user_id_cte")
),
"new_vote" AS (
	INSERT INTO "Vote" (user_id, poll_id, option_index)
	SELECT user_id, poll_id, option_index FROM (
		SELECT
			(SELECT id FROM "user_id_cte") AS "user_id",
			(SELECT id FROM "poll_id_type_cte") AS "poll_id",
			(SELECT index FROM "new_option") AS "option_index"
	) AS "vote_insert_values"
	WHERE
		(SELECT type FROM "poll_id_type_cte") IN ('single', 'multiple')
	RETURNING user_id, poll_id, option_index
),
"new_rate" AS (
	INSERT INTO "Rate" (user_id, poll_id, option_index, rating)
	SELECT user_id, poll_id, option_index, rating FROM (
		SELECT
			(SELECT id FROM "user_id_cte") AS "user_id",
			(SELECT id FROM "poll_id_type_cte") AS "poll_id",
			(SELECT index FROM "new_option") AS "option_index",
			(SELECT $4::SMALLINT AS "rating") --rating
	) AS "rate_insert_values"
	WHERE
		(SELECT type FROM "poll_id_type_cte") = 'rate'
	RETURNING user_id, poll_id, option_index, rating
)
(
	SELECT user_id, poll_id, option_index, rating FROM "new_vote"
	CROSS JOIN
	(SELECT NULL::SMALLINT AS "rating") AS "null_rating"
)
UNION ALL
SELECT user_id, poll_id, option_index, rating FROM "new_rate"
LIMIT 1`;

export interface registerNewOptionArgs {
    userIdentifier: string;
    pollIdentifier: string;
    optionLabel: string;
    optionRating: number;
}

export interface registerNewOptionRow {
    userId: string;
    pollId: string;
    optionIndex: number;
    rating: number | null;
}

export async function registerNewOption(client: Client, args: registerNewOptionArgs): Promise<registerNewOptionRow | null> {
    const result = await client.query({
        text: registerNewOptionQuery,
        values: [args.userIdentifier, args.pollIdentifier, args.optionLabel, args.optionRating],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        pollId: row[1],
        optionIndex: row[2],
        rating: row[3]
    };
}

