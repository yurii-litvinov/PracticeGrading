const TRUSTED_ACCESS_TOKEN_KEY =
    'trusted-member-access-token';

export const saveTrustedAccessToken = (
    token: string,
): void => {
    localStorage.setItem(
        TRUSTED_ACCESS_TOKEN_KEY,
        token,
    );
};

export const getTrustedAccessToken = ():
    string | null => {
    return localStorage.getItem(
        TRUSTED_ACCESS_TOKEN_KEY,
    );
};

export const removeTrustedAccessToken = (): void => {
    localStorage.removeItem(
        TRUSTED_ACCESS_TOKEN_KEY,
    );
};