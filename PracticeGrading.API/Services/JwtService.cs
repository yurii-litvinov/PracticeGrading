// <copyright file="JwtService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PracticeGrading.API.Auth;
using PracticeGrading.Data.Entities;

/// <summary>
/// Service for generating JWT tokens.
/// </summary>
/// <param name="options">JWT options.</param>
public class JwtService(IOptions<JwtOptions> options)
{
    /// <summary>
    /// Generates a signed JWT for a user and optionally associates it
    /// with a meeting and the access record used for authentication.
    /// </summary>
    /// <param name="user">User for whom the token is generated.</param>
    /// <param name="meetingId">
    /// Identifier of the meeting to which the token grants access.
    /// </param>
    /// <param name="meetingAccessId">
    /// Identifier of the approved ordinary meeting access request.
    /// </param>
    /// <param name="trustedAccessId">
    /// Identifier of the trusted member access record.
    /// </param>
    /// <returns>The generated JWT as a string.</returns>
    public string GenerateToken(
        User user,
        int? meetingId = null,
        int? meetingAccessId = null,
        int? trustedAccessId = null)
    {
        var claims = new List<Claim>
    {
        new(
            ClaimTypes.Name,
            user.UserName),

        new(
            ClaimTypes.NameIdentifier,
            user.Id.ToString()),

        new(
            ClaimTypes.Role,
            user.Role!.RoleName.ToLowerInvariant()),
    };

        if (meetingId.HasValue)
        {
            claims.Add(
                new Claim(
                    CustomClaimTypes.MeetingId,
                    meetingId.Value.ToString()));
        }

        if (meetingAccessId.HasValue)
        {
            claims.Add(
                new Claim(
                    CustomClaimTypes.MeetingAccessId,
                    meetingAccessId.Value.ToString()));
        }

        if (trustedAccessId.HasValue)
        {
            claims.Add(
                new Claim(
                    CustomClaimTypes.TrustedAccessId,
                    trustedAccessId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: options.Value.Issuer,
            audience: options.Value.Audience,
            expires: DateTime.UtcNow.Add(options.Value.Expires),
            claims: claims,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        options.Value.SecretKey ?? string.Empty)),
                SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}