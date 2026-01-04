import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createHmac } from 'crypto';
import { config } from '../config/env.js';

// AWS Cognito Identity Provider Client
// this is the client for interacting with the Cognito User Pool (for auth, login, refresh, etc.)

const client = new CognitoIdentityProviderClient({
    region: config.cognito.region,
});

const verifier = CognitoJwtVerifier.create({
    userPoolId: config.cognito.userPoolId,
    tokenUse: 'access',
    clientId: config.cognito.clientId,
});

export interface CognitoTokens {
    accessToken: string;
    idToken: string;
    refreshToken: string;
}

export interface CognitoPayload {
    sub: string;
    email?: string;
    'cognito:username'?: string;
    token_use: string;
    exp: number;
    iat: number;
    [key: string]: unknown;
}

function createSecretHash(username: string): string {
    if (!config.cognito.clientSecret) {
        return '';
    }
    const message = username + config.cognito.clientId;
    const hmac = createHmac('sha256', config.cognito.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
}

export async function login(email: string, password: string): Promise<CognitoTokens> {
    // Debugging: Check if secret is loaded
    console.log('Client Secret exists:', !!config.cognito.clientSecret);
    console.log('Client ID:', config.cognito.clientId);

    const authParams: Record<string, string> = {
        USERNAME: email,
        PASSWORD: password,
    };

    if (config.cognito.clientSecret) {
        authParams.SECRET_HASH = createSecretHash(email);
        console.log('SECRET_HASH generated:', !!authParams.SECRET_HASH);
    } else {
        console.log('WARNING: Client secret not found in config!');
    }

    const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: config.cognito.clientId,
        AuthParameters: authParams,
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
        throw new Error('Authentication failed');
    }

    return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
    };
}

export async function refreshAccessToken(refreshToken: string): Promise<Omit<CognitoTokens, 'refreshToken'>> {
    const authParams: Record<string, string> = {
        REFRESH_TOKEN: refreshToken,
    };

    if (config.cognito.clientSecret) {
        authParams.SECRET_HASH = createSecretHash(config.cognito.clientId);
    }

    const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: config.cognito.clientId,
        AuthParameters: authParams,
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
        throw new Error('Token refresh failed');
    }

    return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
    };
}

export async function verifyToken(token: string): Promise<CognitoPayload> {
    try {
        const payload = await verifier.verify(token);
        return payload as unknown as CognitoPayload;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
        throw new Error('Token verification failed');
    }
}

