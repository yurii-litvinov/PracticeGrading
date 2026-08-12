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
        app.MapPost(
            "/members/{memberId:int}/trusted-access",
            IssueTrustedAccess)
            .RequireAuthorization("RequireAdminRole");
        app.MapDelete(
            "/members/{memberId:int}/trusted-access",
            RevokeTrustedAccess)
            .RequireAuthorization("RequireAdminRole");
        app.MapGet(
            "/members/{memberId:int}/trusted-access",
            GetTrustedAccessStatus)
            .RequireAuthorization("RequireAdminRole");
    }

    private static async Task<IResult> SearchMembers(UserService service, string searchName, int offset = 0, int limit = 0)
    {
        var members = await service.SearchMembersByNameAsync(searchName, offset, limit + 1);
        var hasMore = members.Length > limit;
        var result = members.Take(limit).ToArray();
        return Results.Ok(
        new
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

    private static async Task<IResult> UpdateMember(UserService service, MemberRequest member)
    {
        await service.UpdateMember(member);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteMember(UserService service, int id)
    {
        await service.DeleteMember(id);
        return Results.Ok();
    }

    private static async Task<IResult> IssueTrustedAccess(
        int memberId,
        TrustedMemberAccessService service)
    {
        try
        {
            var token = await service.IssueAccess(memberId);

            return Results.Ok(
                new
                {
                    Token = token,
                });
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(
                new
                {
                    Error = ex.Message,
                });
        }
    }

    private static async Task<IResult> RevokeTrustedAccess(
        int memberId,
        TrustedMemberAccessService service)
    {
        var revoked = await service.RevokeAccess(memberId);

        return revoked
            ? Results.NoContent()
            : Results.NotFound();
    }

    private static async Task<IResult> GetTrustedAccessStatus(
        int memberId,
        TrustedMemberAccessService service)
    {
        var status = await service.GetAccessStatus(memberId);

        return Results.Ok(status);
    }
}
