-- name: getPollDataList :many
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
GROUP BY "Poll".id, "User".identifier;

-- name: getPollDataListFromUserByIdentifier :many
SELECT "Poll".identifier AS identifier, "User".identifier AS creator_user_identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, ends_at, created_at, COUNT("Vote_and_rate".poll_id) AS vote_rate_count
FROM "Poll"
LEFT JOIN (
	SELECT poll_id, option_index FROM "Vote"
	UNION ALL
	SELECT poll_id, option_index FROM "Rate"
	) AS "Vote_and_rate"
ON "Poll".id = "Vote_and_rate".poll_id
INNER JOIN "User"
ON "Poll".creator_user_id = "User".id
WHERE "User".identifier = $1
GROUP BY "Poll".id, "User".identifier;

-- name: getPollListFromUserByIdentifier :many
SELECT identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, is_closed, ends_at created_at
FROM "Poll"
WHERE creator_user_id = $1;

-- name: getPollDataWithVoteCount :one
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
LIMIT 1;


-- x name: getPollWithVotes2 :one
-- SELECT identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label, COUNT(option_index) AS vote_count
-- FROM (
-- 	SELECT id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label
-- 	FROM "Poll"
-- 	INNER JOIN "PollOption"
-- 	ON "Poll".id = "PollOption".poll_id
-- 	WHERE identifier = $1
-- ) AS "poll_with_options"
-- INNER JOIN 
-- 	(CASE WHEN "poll_with_options".type = 'single' THEN "Vote"
-- 			WHEN "poll_with_options".type = 'multiple' THEN "Vote"
-- 			WHEN "poll_with_options".type = 'rate' THEN "Rate"
-- 			ELSE "Vote"
-- 	END)
-- ON (
-- 	CASE 	WHEN "poll_with_options".type = 'single'
-- 				THEN "poll_with_options".poll_id = "Vote".id AND "poll_with_options".option_index = "Vote".option_index
-- 			WHEN "poll_with_options".type = 'multiple'
-- 				THEN "poll_with_options".poll_id = "Vote".id AND "poll_with_options".option_index = "Vote".option_index
-- 			WHEN "poll_with_options".type = 'rate'
-- 				THEN "poll_with_options".poll_id = "Rate".id AND "poll_with_options".option_index = "Rate".option_index
-- 			ELSE "poll_with_options".poll_id = "Vote".id AND "poll_with_options".option_index = "Vote".option_index
-- 	END
-- ) AS "poll_with_votes"
-- ON "poll_with_options".id = "poll_with_votes".poll_id AND "poll_with_options".index = "poll_with_votes".option_index
-- GROUP BY  id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label, "poll_with_votes".option_index;

-- name: getPollDataWithVotes :many
WITH "Null_rating" AS (
	SELECT NULL::SMALLINT AS "rating"
),
"Poll_id_cte" AS (
	SELECT id FROM "Poll"
	WHERE identifier = $1
),
"User_id_cte" AS (
	SELECT id FROM "User"
	WHERE "User".identifier = @user_identifier
)
SELECT identifier, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at, (BOOL_OR(is_closed) OR ends_at < NOW())::BOOLEAN AS is_closed, "Poll_with_options".created_at, index, label, COUNT(option_index) AS vote_rate_count, has_created,
	CASE WHEN "Poll_with_options".type = 'rate' THEN AVG("Vote_rate_with_hascreated".rating) END AS rate_avg,
	CAST(BOOL_OR(CASE WHEN "Vote_rate_with_hascreated".user_id = (SELECT id FROM "User_id_cte") THEN TRUE ELSE FALSE END) AS BOOLEAN) AS is_voted
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
		SELECT * FROM "Vote"
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
GROUP BY  id, identifier, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at, "Poll_with_options".created_at, index, label, "Vote_rate_with_hascreated".option_index, "Has_created_row".has_created
ORDER BY "Poll_with_options".index ASC;

-- name: getPollVotes :many
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
GROUP BY  id, identifier, title, description, type, allow_new_options, required_providers, required_provider_subs, ends_at, is_closed, created_at, index, label, "Vote_rate".option_index;

-- name: createMultipleVotes :many
WITH "user_id_row" AS (
	SELECT @user_id::BIGINT AS "user_id"
),
"poll_user_id_row" AS (
	SELECT "id", "user_id" FROM "Poll"
	CROSS JOIN
	"user_id_row"
	WHERE "identifier" = @poll_identifier
),
"vote_rows" AS (
	SELECT "option_index", "user_id", "id" AS "poll_id"
	FROM (SELECT UNNEST(@vote_index_list::SMALLINT[]) AS "option_index") AS "voted_data"
	CROSS JOIN "poll_user_id_row"
)
INSERT INTO "Vote" (user_id, poll_id, option_index)
SELECT "user_id", "poll_id", "option_index"
FROM "vote_rows"
RETURNING *;

-- name: createSingleVote :one
WITH "user_id_row" AS (
	SELECT @user_id::BIGINT AS "user_id"
),
"poll_user_id_row" AS (
	SELECT "id", "user_id" FROM "Poll"
	CROSS JOIN
	"user_id_row"
	WHERE "identifier" = @poll_identifier
)
INSERT INTO "Vote" (user_id, poll_id, option_index)
SELECT "user_id", "poll_id", "option_index"
FROM (
	SELECT "option_index", "user_id", "id" AS "poll_id"
	FROM (SELECT @vote_index::SMALLINT AS "option_index") AS "voted_data"
	CROSS JOIN "poll_user_id_row"
) AS "insert_values" RETURNING *;

-- name: registerMultipleVotes :many
WITH "user_id_row" AS (
	SELECT id AS "user_id" FROM "User" WHERE "User".identifier = @user_identifier
),
"poll_id_row" AS (
	SELECT id AS "poll_id" FROM "Poll" WHERE "Poll".identifier = @poll_identifier
),
"poll_user_id_row" AS (
	SELECT "poll_id", "user_id" FROM "poll_id_row"
	CROSS JOIN "user_id_row"
),
"unnested_votes_array" AS (
	SELECT UNNEST(@option_index_list::SMALLINT[]) AS "option_index"
),
"old_votes" AS (
	SELECT option_index FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
),
"to_insert_votes" AS (
	SELECT * FROM "unnested_votes_array"
	WHERE option_index NOT IN (SELECT * FROM "old_votes")
),
"to_delete_votes" AS (
	SELECT option_index FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index NOT IN (SELECT * FROM "unnested_votes_array")
),
"deleted_votes" AS (
	DELETE FROM "Vote"
	WHERE poll_id = (SELECT poll_id FROM "poll_id_row")
	AND user_id = (SELECT user_id FROM "user_id_row")
	AND option_index IN (SELECT * FROM "to_delete_votes")
	RETURNING *
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
	RETURNING *
)
SELECT "option_index", "user_id", "poll_id"
FROM "unnested_votes_array"
CROSS JOIN "poll_user_id_row";

-- name: registerSingleVote :one
WITH "poll_userid_cte" AS (
	SELECT "poll_id", "user_id"
	FROM (
		SELECT id AS "poll_id" FROM "Poll" WHERE "Poll".identifier = @poll_identifier
		AND type = 'single'
	) AS "poll_id_subq"
	CROSS JOIN (
		SELECT id AS "user_id" FROM "User" WHERE "User".identifier = @user_identifier
	) AS "user_id_subq"
),
"new_vote" AS (
	SELECT "option_index", "user_id", "poll_id"
	FROM (SELECT @option_index::SMALLINT AS option_index) AS "new_vote_subq" --VOTE
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
	WHERE option_index NOT IN (SELECT * FROM "poll_user_vote")
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
	RETURNING *
),
"inserted_votes" AS (
	INSERT INTO "Vote" (user_id, poll_id, option_index)
	SELECT user_id, poll_id, option_index
	FROM "new_vote"
	WHERE option_index = (SELECT option_index FROM "to_insert_votes")
	RETURNING *
)
SELECT * FROM "new_vote"
LIMIT 1;

-- -- name: registerNewOption :one
-- WITH "user_id_cte" AS (
-- 	SELECT id FROM "User" WHERE "User".identifier = @user_identifier
-- ),
-- "poll_id_type_cte" AS (
-- 	SELECT id, type FROM "Poll" WHERE "Poll".identifier = @poll_identifier
-- ),
-- "highest_option_index_cte" AS (
-- 	SELECT index FROM "PollOption"
-- 	WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
-- 	ORDER BY index DESC LIMIT 1
-- ),
-- "new_option" AS (
-- 	INSERT INTO "PollOption" (poll_id, index, label)
-- 	SELECT * FROM (
-- 		SELECT (SELECT id FROM "poll_id_type_cte"), (SELECT index FROM "highest_option_index_cte") + 1, @option_label::TEXT
-- 	) AS "insert_values"
-- 	WHERE (
-- 		SELECT COUNT(index) AS options_count FROM "PollOption"
-- 		WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
-- 		GROUP BY poll_id
-- 	) < 100
-- 	RETURNING *
-- ),
-- "new_option_creator" AS (
-- 	INSERT INTO "OptionCreator" (user_id, poll_id, option_index)
-- 	VALUES ((SELECT id FROM "user_id_cte"),
-- 			(SELECT id FROM "poll_id_type_cte"),
-- 			(SELECT index FROM "new_option")
-- 		)
-- ),
-- "old_vote_delete" AS (
-- 	DELETE FROM "Vote"
-- 	USING "Poll"
-- 	WHERE "Poll".type = 'single'
-- 	AND "Vote".user_id = (SELECT id FROM "user_id_cte")
-- ),
-- "new_vote" AS (
-- 	INSERT INTO "Vote" (user_id, poll_id, option_index)
-- 	SELECT * FROM (
-- 		SELECT
-- 			(SELECT id FROM "user_id_cte"),
-- 			(SELECT id FROM "poll_id_type_cte"),
-- 			(SELECT index FROM "new_option")
-- 	) AS "vote_insert_values"
-- 	WHERE
-- 		(SELECT type FROM "poll_id_type_cte") IN ('single', 'multiple')
-- 	RETURNING *
-- ),
-- "new_rate" AS (
-- 	INSERT INTO "Rate" (user_id, poll_id, option_index, rating)
-- 	SELECT * FROM (
-- 		SELECT
-- 			(SELECT id FROM "user_id_cte"),
-- 			(SELECT id FROM "poll_id_type_cte"),
-- 			(SELECT index FROM "new_option"),
-- 			(SELECT @option_rating::SMALLINT AS "rating") --rating
-- 	) AS "rate_insert_values"
-- 	WHERE
-- 		(SELECT type FROM "poll_id_type_cte") = 'rate'
-- 	RETURNING *
-- )
-- SELECT * FROM (
-- 	SELECT * FROM "new_vote"
-- 	CROSS JOIN
-- 	(SELECT NULL::SMALLINT AS "rating")
-- )
-- UNION ALL
-- SELECT * FROM "new_rate"
-- LIMIT 1;


-- name: registerNewOption :one
WITH "user_id_cte" AS (
	SELECT id FROM "User" WHERE "User".identifier = @user_identifier
),
"poll_id_type_cte" AS (
	SELECT id, type FROM "Poll" WHERE "Poll".identifier = @poll_identifier
),
"highest_option_index_cte" AS (
	SELECT index FROM "PollOption"
	WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
	ORDER BY index DESC LIMIT 1
),
"new_option" AS (
	INSERT INTO "PollOption" (poll_id, index, label)
	-- SELECT * FROM (
		SELECT (SELECT id FROM "poll_id_type_cte"), (SELECT index FROM "highest_option_index_cte") + 1, @option_label::TEXT
	-- ) AS "insert_values"
	WHERE (
		SELECT COUNT(index) AS options_count FROM "PollOption"
		WHERE poll_id = (SELECT id FROM "poll_id_type_cte")
		GROUP BY poll_id
	) < 100
	RETURNING *
),
"new_option_creator" AS (
	INSERT INTO "OptionCreator" (user_id, poll_id, option_index)
	VALUES ((SELECT id FROM "user_id_cte"),
			(SELECT id FROM "poll_id_type_cte"),
			(SELECT index FROM "new_option")
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
	SELECT * FROM (
		SELECT
			(SELECT id FROM "user_id_cte") AS "user_id",
			(SELECT id FROM "poll_id_type_cte") AS "poll_id",
			(SELECT index FROM "new_option") AS "option_index"
	) AS "vote_insert_values"
	WHERE
		(SELECT type FROM "poll_id_type_cte") IN ('single', 'multiple')
	RETURNING *
),
"new_rate" AS (
	INSERT INTO "Rate" (user_id, poll_id, option_index, rating)
	SELECT * FROM (
		SELECT
			(SELECT id FROM "user_id_cte"),
			(SELECT id FROM "poll_id_type_cte"),
			(SELECT index FROM "new_option"),
			(SELECT @option_rating::SMALLINT AS "rating") --rating
	) AS "rate_insert_values"
	WHERE
		(SELECT type FROM "poll_id_type_cte") = 'rate'
	RETURNING *
)
(
	SELECT * FROM "new_vote"
	CROSS JOIN
	(SELECT NULL::SMALLINT AS "rating") AS "null_rating"
)
UNION ALL
SELECT * FROM "new_rate"
LIMIT 1;

