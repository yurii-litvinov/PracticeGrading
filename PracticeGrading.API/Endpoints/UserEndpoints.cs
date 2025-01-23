// <copyright file="UserEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

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
}