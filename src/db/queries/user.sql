-- name: getUserData :many
SELECT identifier, username, initial_provider, provider, provider_account_id, email, created_at, requests_min_votes, theme FROM "User"
INNER JOIN "Account" ON "User".id = "Account".user_id
AND "User".initial_provider = "Account".provider
LEFT JOIN "UserPreferences" ON "User".id = "UserPreferences".user_id
WHERE "User".id = $1;

-- name: getUserDataByIdentifier :many
SELECT id, identifier, username, initial_provider, provider, provider_account_id, email, created_at, requests_min_votes, theme FROM "User"
INNER JOIN "Account" ON "User".id = "Account".user_id
AND "User".initial_provider = "Account".provider
LEFT JOIN "UserPreferences" ON "User".id = "UserPreferences".user_id
WHERE "User".identifier = $1;

-- name: findAccountByProviderAccountId :one
SELECT identifier, provider, provider_account_id, username, email, created_at FROM "Account"
INNER JOIN "User" ON "Account".user_id = "User".id
WHERE provider = $1 AND provider_account_id = $2;

-- name: createUser :one
INSERT INTO "User" (identifier, initial_provider) VALUES ($1, $2) RETURNING *;

-- name: createAccount :one
WITH NewAccount AS (
	INSERT INTO "Account" (user_id, provider, provider_account_id, username, email)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING *
)
SELECT identifier, user_id, provider, provider_account_id, username, email FROM "User"
RIGHT JOIN NewAccount
ON "User".id = NewAccount.user_id;

-- name: createAccountWithUserIdentifier :one
WITH NewAccount AS (
	INSERT INTO "Account" (user_id, provider, provider_account_id, username, email)
	VALUES ((SELECT id FROM "User" WHERE "User".identifier = @user_identifier), $1, $2, $3, $4)
	RETURNING *
)
SELECT identifier, user_id, provider, provider_account_id, username, email FROM "User"
RIGHT JOIN NewAccount
ON "User".id = NewAccount.user_id;

-- name: getAccountsByUserId :many
SELECT "Account".provider AS provider, provider_account_id, username, email, "Account".created_at AS created_at
FROM "Account"
INNER JOIN "User" ON "Account".user_id = "User".id
WHERE "User".id = $1;