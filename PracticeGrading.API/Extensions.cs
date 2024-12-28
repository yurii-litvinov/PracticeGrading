// <copyright file="Extensions.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

using PracticeGrading.API.Endpoints;
using PracticeGrading.API.Models;

namespace PracticeGrading.API;

using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PracticeGrading.API.Services;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Class for extensions.
/// </summary>
public static class Extensions
{
    /// <summary>
    /// Adds custom authentication and authorization.
    /// </summary>
    public static void AddCustomAuth(this IServiceCollection services, Action<JwtOptions> configureSettings)
    {
        var jwtOptions = new JwtOptions();
        configureSettings(jwtOptions);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(
                JwtBearerDefaults.AuthenticationScheme,
                options =>
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidAudience = jwtOptions.Audience,
                        RoleClaimType = "role",
                        IssuerSigningKey =
                            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey ?? string.Empty)),
                        ClockSkew = TimeSpan.Zero,
                    });

        services.AddAuthorizationBuilder()
            .AddPolicy(
                "RequireAdminRole",
                policy => policy.RequireClaim(
                    ClaimTypes.Role,
                    RolesEnum.Admin.ToString().ToLower()));
        services.AddAuthorizationBuilder()
            .AddPolicy(
                "RequireMemberRole",
                policy => policy.RequireClaim(
                    ClaimTypes.Role,
                    RolesEnum.Member.ToString().ToLower()));
        services.AddAuthorizationBuilder()
            .AddPolicy(
                "RequireAdminOrMemberRole",
                policy => policy.RequireClaim(
                    ClaimTypes.Role,
                    RolesEnum.Admin.ToString().ToLower(),
                    RolesEnum.Member.ToString().ToLower()));
    }

    /// <summary>
    /// Adds app services.
    /// </summary>
    public static void AddAppServices(this IServiceCollection services)
    {
        services.AddScoped<UserService>();
        services.AddScoped<UserRepository>();
        services.AddScoped<MeetingService>();
        services.AddScoped<MeetingRepository>();
        services.AddScoped<CriteriaService>();
        services.AddScoped<CriteriaRepository>();
        services.AddScoped<MarkService>();
        services.AddScoped<MarkRepository>();
    }
}