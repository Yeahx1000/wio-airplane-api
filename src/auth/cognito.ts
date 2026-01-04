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

async function findUsernameByEmail(email: string): Promise<string | null> {
    try {
        const command = new ListUsersCommand({
            UserPoolId: config.cognito.userPoolId,
            Filter: `email = "${email}"`,
            Limit: 1,
        });

        const response = await client.send(command);
        
        if (response.Users && response.Users.length > 0) {
            return response.Users[0].Username || null;
        }
        return null;
    } catch (error) {
        console.error('Error looking up user by email:', error);
        return null;
    }
}

export async function login(usernameOrEmail: string, password: string): Promise<CognitoTokens> {
    let username = usernameOrEmail;
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail);
    if (isEmail) {
        const foundUsername = await findUsernameByEmail(usernameOrEmail);
        if (foundUsername) {
            username = foundUsername;
        }
    }

    const authParams: Record<string, string> = {
        USERNAME: username,
        PASSWORD: password,
    };

    if (config.cognito.clientSecret) {
        authParams.SECRET_HASH = createSecretHash(username);
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

