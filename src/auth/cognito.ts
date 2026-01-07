import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    AuthFlowType,
    ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createHmac } from 'crypto';
import { config } from '../config/env.js';

// AWS Cognito Identity Provider Client
// this is the client for interacting with the Cognito User Pool (for auth, login, refresh, etc.)

const client = new CognitoIdentityProviderClient({
    region: config.cognito.region,
});

const accessTokenVerifier = CognitoJwtVerifier.create({
    userPoolId: config.cognito.userPoolId,
    tokenUse: "access",
    clientId: config.cognito.clientId,
});

export type CognitoTokens = {
    accessToken: string;
    idToken: string;
    refreshToken: string;
}

export type CognitoPayload = {
    sub: string;
    email?: string;
    "cognito:username"?: string;
    token_use: string;
    exp: number;
    iat: number;
    [key: string]: unknown;
}

class AuthError extends Error {
    constructor(message = "Authentication failed") {
        super(message);
        this.name = "AuthError";
    }
}

function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createSecretHash(username: string): string | undefined {
    const { clientId, clientSecret } = config.cognito;
    if (!clientSecret) return undefined;

    const message = username + clientId;
    return createHmac("sha256", clientSecret).update(message).digest("base64");
}

async function findUsernameByEmail(email: string): Promise<string | null> {
    try {
        const command = new ListUsersCommand({
            UserPoolId: config.cognito.userPoolId,
            Filter: `email = "${email}"`,
            Limit: 1,
        });

        const response = await client.send(command);
        return response.Users?.[0]?.Username ?? null;
    } catch {
        return null;
    }
}

async function resolveUsername(usernameOrEmail: string): Promise<string> {
    if (!isEmail(usernameOrEmail)) return usernameOrEmail;

    const found = await findUsernameByEmail(usernameOrEmail);

    return found ?? usernameOrEmail;
}

function assertAuthResult(
    result: { AccessToken?: string; IdToken?: string; RefreshToken?: string } | undefined,
    requireRefreshToken: boolean
) {
    if (!result?.AccessToken || !result?.IdToken) throw new AuthError();
    if (requireRefreshToken && !result.RefreshToken) throw new AuthError();
}

export async function login(usernameOrEmail: string, password: string): Promise<CognitoTokens> {
    const username = await resolveUsername(usernameOrEmail);

    const authParams: Record<string, string> = {
        USERNAME: username,
        PASSWORD: password,
    };

    const secretHash = createSecretHash(username);
    if (secretHash) authParams.SECRET_HASH = secretHash;

    try {
        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: config.cognito.clientId,
            AuthParameters: authParams,
        });

        const response = await client.send(command);
        assertAuthResult(response.AuthenticationResult, true);

        return {
            accessToken: response.AuthenticationResult!.AccessToken!,
            idToken: response.AuthenticationResult!.IdToken!,
            refreshToken: response.AuthenticationResult!.RefreshToken!,
        };
    } catch {
        throw new AuthError();
    }
}

export async function refreshAccessToken(
    usernameOrEmail: string,
    refreshToken: string
): Promise<Omit<CognitoTokens, "refreshToken">> {
    const username = await resolveUsername(usernameOrEmail);

    const authParams: Record<string, string> = {
        REFRESH_TOKEN: refreshToken,
    };

    const secretHash = createSecretHash(username);
    if (secretHash) authParams.SECRET_HASH = secretHash;

    try {
        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            ClientId: config.cognito.clientId,
            AuthParameters: authParams,
        });

        const response = await client.send(command);
        assertAuthResult(response.AuthenticationResult, false);

        return {
            accessToken: response.AuthenticationResult!.AccessToken!,
            idToken: response.AuthenticationResult!.IdToken!,
        };
    } catch {
        throw new AuthError("Token refresh failed");
    }
}

export async function verifyToken(token: string): Promise<CognitoPayload> {
    try {
        const payload = await accessTokenVerifier.verify(token);
        return payload as unknown as CognitoPayload;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        throw new Error(`Token verification failed: ${msg}`);
    }
}