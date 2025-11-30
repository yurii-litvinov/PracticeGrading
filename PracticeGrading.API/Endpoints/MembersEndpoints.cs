// <copyright file="MembersEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using Microsoft.AspNetCore.Http;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

/// <summary>
/// Provides endpoints for member management operations.
/// </summary>
public static class MembersEndpoints
{
    /// <summary>
    /// Maps all member-related endpoints to the application route builder.
    /// </summary>
    /// <param name="app">The endpoint route builder to map routes to.</param>
    public static void MapMemberEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/members", SearchMembers).RequireAuthorization("RequireAdminRole");
        app.MapPost("/members", AddNewMember).RequireAuthorization("RequireAdminRole");
        app.MapPut("/members", UpdateMember).RequireAuthorization("RequireAdminRole");
        app.MapDelete("/members", DeleteMember).RequireAuthorization("RequireAdminRole");
    }

    private static async Task<IResult> SearchMembers(UserService service, string searchName, int offset = 0, int limit = 0)
    {
        var members = await service.SearchMembersByNameAsync(searchName, offset, limit + 1);
        var hasMore = members.Length > limit;
        var result = members.Take(limit).ToArray();
        return Results.Ok(new
        {
            members = result,
            hasMore,
        });
    }

    private static async Task<IResult> AddNewMember(UserService service, MemberRequest member)
    {
        var memberId = await service.AddNewMember(member);
        return Results.Ok(new { Id = memberId });
    }

    private static async Task UpdateMember(UserService service, MemberRequest member)
    {
        await service.UpdateMember(member);
    }

    private static async Task DeleteMember(UserService service, int id)
    {
        await service.DeleteMember(id);
    }
}
