// <copyright file="AccessTokenService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

/// <summary>
/// Generates secure access tokens and calculates their hashes.
/// </summary>
public class AccessTokenService
{
    private const int TokenSizeInBytes = 32;

    /// <summary>
    /// Generates a cryptographically secure access token.
    /// </summary>
    /// <returns>A newly generated access token.</returns>
    public string GenerateToken()
    {
        var randomBytes =
            RandomNumberGenerator.GetBytes(TokenSizeInBytes);

        return WebEncoders.Base64UrlEncode(randomBytes);
    }

    /// <summary>
    /// Calculates a SHA-256 hash of an access token.
    /// </summary>
    /// <param name="token">Access token to hash.</param>
    /// <returns>The token hash represented as a hexadecimal string.</returns>
    public string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
    }
}