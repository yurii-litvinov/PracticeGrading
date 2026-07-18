// <copyright file="UserEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using System.Security.Claims;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

/// <summary>
/// Class for user endpoints.
/// </summary>
public static class UserEndpoints
{
    /// <summary>
    /// Registers user endpoints.
    /// </summary>
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var userGroup = app.MapGroup(string.Empty);

        userGroup.MapPost("/login", LoginAdmin);
        userGroup.MapPost("/member/login", LoginMember);
        userGroup.MapPut("/users/me/password", ChangePassword)
            .RequireAuthorization("RequireAdminRole");
        userGroup.MapPost("/admins", CreateAdmin)
            .RequireAuthorization("RequireAdminRole");
    }

    private static async Task<IResult> LoginAdmin(LoginAdminRequest request, UserService userService)
    {
        var token = await userService.LoginAdmin(request);
        return token == string.Empty ? Results.Unauthorized() : Results.Ok(new { Token = token });
    }

    private static async Task<IResult> LoginMember(LoginMemberRequest request, UserService userService)
    {
        var token = await userService.LoginMember(request);
        return Results.Ok(new { Token = token });
    }

    private static async Task<IResult> CreateAdmin(
        CreateAdminRequest request,
        HttpContext context,
        UserService userService)
    {
        var userIdClaim = context.User
            .FindFirst(ClaimTypes.NameIdentifier)
            ?.Value;

        if (userIdClaim is null ||
            !int.TryParse(userIdClaim, out var currentAdminId))
        {
            return Results.Unauthorized();
        }

        var result = await userService.CreateAdmin(
            currentAdminId,
            request);

        return result switch
        {
            CreateAdminResult.Success =>
                Results.StatusCode(StatusCodes.Status201Created),

            CreateAdminResult.CurrentAdminNotFound =>
                Results.Unauthorized(),

            CreateAdminResult.InvalidCurrentPassword =>
                Results.BadRequest(new
                {
                    Error = "Current administrator password is incorrect.",
                }),
            CreateAdminResult.InvalidUserName =>
                Results.BadRequest(new
                {
                    Error = "Administrator username is invalid.",
                }),

            CreateAdminResult.InvalidNewAdminPassword =>
                Results.BadRequest(new
                {
                    Error = "Administrator password must contain at least 12 characters.",
                }),

            CreateAdminResult.UserNameAlreadyExists =>
                Results.Conflict(new
                {
                    Error = "A user with this username already exists.",
                }),

            _ => Results.StatusCode(
                StatusCodes.Status500InternalServerError),
        };
    }

    private static async Task<IResult> ChangePassword(
        ChangePasswordRequest request,
        HttpContext context,
        UserService userService)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim is null ||
            !int.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var result = await userService.ChangePassword(userId, request);

        return result switch
        {
            ChangePasswordResult.Success =>
                Results.NoContent(),

            ChangePasswordResult.UserNotFound =>
                Results.Unauthorized(),

            ChangePasswordResult.InvalidCurrentPassword =>
                Results.BadRequest(
                    new
                    {
                        Error = "Current password is incorrent",
                    }),

            ChangePasswordResult.InvalidNewPassword =>
                Results.BadRequest(
                    new
                    {
                        Error = "The new password must contain at least 12 characters and differ from the current password.",
                    }),

            _ => Results.StatusCode(StatusCodes.Status500InternalServerError),
        };
    }
}