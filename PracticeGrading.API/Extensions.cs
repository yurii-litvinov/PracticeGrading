// <copyright file="Extensions.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using PracticeGrading.API.Auth;
using PracticeGrading.API.Models;
using PracticeGrading.API.Repositories;
using PracticeGrading.API.Services;
using PracticeGrading.Data.Repositories;
using System.Security.Claims;
using System.Text;

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
                        RoleClaimType = ClaimTypes.Role,
                        IssuerSigningKey =
                            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey ?? string.Empty)),
                        ClockSkew = TimeSpan.Zero,
                    });


        services.AddScoped<
            IAuthorizationHandler,
            ActiveMemberAccessHandler>();

        services.AddAuthorizationBuilder()
            .AddPolicy(
                "RequireAdminRole",
                policy => policy.RequireClaim(
                    ClaimTypes.Role,
                    RolesEnum.Admin.ToString().ToLowerInvariant()))
            .AddPolicy(
                "RequireMemberRole",
                policy =>
                {
                    policy.RequireClaim(
                        ClaimTypes.Role,
                        RolesEnum.Member.ToString().ToLowerInvariant());

                    policy.AddRequirements(
                        new ActiveMemberAccessRequirement());
                })
            .AddPolicy(
                "RequireAdminOrMemberRole",
                policy =>
                {
                    policy.RequireClaim(
                        ClaimTypes.Role,
                        RolesEnum.Admin.ToString().ToLowerInvariant(),
                        RolesEnum.Member.ToString().ToLowerInvariant());

                    policy.AddRequirements(
                        new ActiveMemberAccessRequirement());
                });
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
        services.AddScoped<CriteriaGroupService>();
        services.AddScoped<CriteriaGroupRepository>();
        services.AddScoped<CriteriaService>();
        services.AddScoped<CriteriaRepository>();
        services.AddScoped<MarkService>();
        services.AddScoped<MarkRepository>();
        services.AddScoped<AccessTokenService>();
        services.AddScoped<TrustedMemberAccessRepository>();
        services.AddScoped<TrustedMemberAccessService>();
        services.AddScoped<MeetingMemberAccessRepository>();
        services.AddScoped<MeetingMemberAccessService>();
    }
}