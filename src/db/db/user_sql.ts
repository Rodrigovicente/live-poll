import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getUserDataQuery = `-- name: getUserData :many
SELECT identifier, username, initial_provider, provider, provider_account_id, email, created_at, requests_min_votes, theme FROM "User"
INNER JOIN "Account" ON "User".id = "Account".user_id
AND "User".initial_provider = "Account".provider
LEFT JOIN "UserPreferences" ON "User".id = "UserPreferences".user_id
WHERE "User".id = $1`;

export interface getUserDataArgs {
    id: string;
}

export interface getUserDataRow {
    identifier: string;
    username: string;
    initialProvider: string;
    provider: string;
    providerAccountId: string;
    email: string;
    createdAt: Date;
    requestsMinVotes: number | null;
    theme: string | null;
}

export async function getUserData(client: Client, args: getUserDataArgs): Promise<getUserDataRow[]> {
    const result = await client.query({
        text: getUserDataQuery,
        values: [args.id],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            identifier: row[0],
            username: row[1],
            initialProvider: row[2],
            provider: row[3],
            providerAccountId: row[4],
            email: row[5],
            createdAt: row[6],
            requestsMinVotes: row[7],
            theme: row[8]
        };
    });
}

export const getUserDataByIdentifierQuery = `-- name: getUserDataByIdentifier :many
SELECT id, identifier, username, initial_provider, provider, provider_account_id, email, created_at, requests_min_votes, theme FROM "User"
INNER JOIN "Account" ON "User".id = "Account".user_id
AND "User".initial_provider = "Account".provider
LEFT JOIN "UserPreferences" ON "User".id = "UserPreferences".user_id
WHERE "User".identifier = $1`;

export interface getUserDataByIdentifierArgs {
    identifier: string;
}

export interface getUserDataByIdentifierRow {
    id: string;
    identifier: string;
    username: string;
    initialProvider: string;
    provider: string;
    providerAccountId: string;
    email: string;
    createdAt: Date;
    requestsMinVotes: number | null;
    theme: string | null;
}

export async function getUserDataByIdentifier(client: Client, args: getUserDataByIdentifierArgs): Promise<getUserDataByIdentifierRow[]> {
    const result = await client.query({
        text: getUserDataByIdentifierQuery,
        values: [args.identifier],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            identifier: row[1],
            username: row[2],
            initialProvider: row[3],
            provider: row[4],
            providerAccountId: row[5],
            email: row[6],
            createdAt: row[7],
            requestsMinVotes: row[8],
            theme: row[9]
        };
    });
}

export const findAccountByProviderAccountIdQuery = `-- name: findAccountByProviderAccountId :one
SELECT identifier, provider, provider_account_id, username, email, created_at FROM "Account"
INNER JOIN "User" ON "Account".user_id = "User".id
WHERE provider = $1 AND provider_account_id = $2`;

export interface findAccountByProviderAccountIdArgs {
    provider: string;
    providerAccountId: string;
}

export interface findAccountByProviderAccountIdRow {
    identifier: string;
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
    createdAt: Date;
}

export async function findAccountByProviderAccountId(client: Client, args: findAccountByProviderAccountIdArgs): Promise<findAccountByProviderAccountIdRow | null> {
    const result = await client.query({
        text: findAccountByProviderAccountIdQuery,
        values: [args.provider, args.providerAccountId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        identifier: row[0],
        provider: row[1],
        providerAccountId: row[2],
        username: row[3],
        email: row[4],
        createdAt: row[5]
    };
}

export const createUserQuery = `-- name: createUser :one
INSERT INTO "User" (identifier, initial_provider) VALUES ($1, $2) RETURNING id, identifier, initial_provider`;

export interface createUserArgs {
    identifier: string;
    initialProvider: string;
}

export interface createUserRow {
    id: string;
    identifier: string;
    initialProvider: string;
}

export async function createUser(client: Client, args: createUserArgs): Promise<createUserRow | null> {
    const result = await client.query({
        text: createUserQuery,
        values: [args.identifier, args.initialProvider],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        identifier: row[1],
        initialProvider: row[2]
    };
}

export const createAccountQuery = `-- name: createAccount :one
WITH NewAccount AS (
	INSERT INTO "Account" (user_id, provider, provider_account_id, username, email)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING user_id, provider, provider_account_id, username, email, created_at
)
SELECT identifier, user_id, provider, provider_account_id, username, email FROM "User"
RIGHT JOIN NewAccount
ON "User".id = NewAccount.user_id`;

export interface createAccountArgs {
    userId: string;
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
}

export interface createAccountRow {
    identifier: string | null;
    userId: string;
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
}

export async function createAccount(client: Client, args: createAccountArgs): Promise<createAccountRow | null> {
    const result = await client.query({
        text: createAccountQuery,
        values: [args.userId, args.provider, args.providerAccountId, args.username, args.email],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        identifier: row[0],
        userId: row[1],
        provider: row[2],
        providerAccountId: row[3],
        username: row[4],
        email: row[5]
    };
}

export const createAccountWithUserIdentifierQuery = `-- name: createAccountWithUserIdentifier :one
WITH NewAccount AS (
	INSERT INTO "Account" (user_id, provider, provider_account_id, username, email)
	VALUES ((SELECT id FROM "User" WHERE "User".identifier = $5), $1, $2, $3, $4)
	RETURNING user_id, provider, provider_account_id, username, email, created_at
)
SELECT identifier, user_id, provider, provider_account_id, username, email FROM "User"
RIGHT JOIN NewAccount
ON "User".id = NewAccount.user_id`;

export interface createAccountWithUserIdentifierArgs {
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
    userIdentifier: string;
}

export interface createAccountWithUserIdentifierRow {
    identifier: string | null;
    userId: string;
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
}

export async function createAccountWithUserIdentifier(client: Client, args: createAccountWithUserIdentifierArgs): Promise<createAccountWithUserIdentifierRow | null> {
    const result = await client.query({
        text: createAccountWithUserIdentifierQuery,
        values: [args.provider, args.providerAccountId, args.username, args.email, args.userIdentifier],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        identifier: row[0],
        userId: row[1],
        provider: row[2],
        providerAccountId: row[3],
        username: row[4],
        email: row[5]
    };
}

export const getAccountsByUserIdQuery = `-- name: getAccountsByUserId :many
SELECT "Account".provider AS provider, provider_account_id, username, email, "Account".created_at AS created_at
FROM "Account"
INNER JOIN "User" ON "Account".user_id = "User".id
WHERE "User".id = $1`;

export interface getAccountsByUserIdArgs {
    id: string;
}

export interface getAccountsByUserIdRow {
    provider: string;
    providerAccountId: string;
    username: string;
    email: string;
    createdAt: Date;
}

export async function getAccountsByUserId(client: Client, args: getAccountsByUserIdArgs): Promise<getAccountsByUserIdRow[]> {
    const result = await client.query({
        text: getAccountsByUserIdQuery,
        values: [args.id],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            provider: row[0],
            providerAccountId: row[1],
            username: row[2],
            email: row[3],
            createdAt: row[4]
        };
    });
}

