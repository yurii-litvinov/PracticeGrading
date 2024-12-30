// <copyright file="MarkEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

/// <summary>
/// Class for mark endpoints.
/// </summary>
public static class MarkEndpoints
{
    /// <summary>
    /// Registers mark endpoints.
    /// </summary>
    public static void MapMarkEndpoints(this IEndpointRouteBuilder app)
    {
        var markGroup = app.MapGroup("/marks").RequireAuthorization("RequireAdminOrMemberRole");

        markGroup.MapPost("/new", CreateMemberMark);
        markGroup.MapGet(string.Empty, GetMemberMark);
        markGroup.MapPut("/update", UpdateMemberMark);
        markGroup.MapDelete("/delete", DeleteMemberMark).RequireAuthorization("RequireAdminRole");
    }

    private static async Task<IResult> CreateMemberMark(MemberMarkRequest request, MarkService markService)
    {
        await markService.AddMemberMark(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetMemberMark(int workId, int? memberId, MarkService markService)
    {
        var marks = await markService.GetMemberMarks(workId, memberId);
        return Results.Ok(marks);
    }

    private static async Task<IResult> UpdateMemberMark(MemberMarkRequest request, MarkService markService)
    {
        await markService.UpdateMemberMark(request);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteMemberMark(int workId, int memberId, MarkService markService)
    {
        await markService.DeleteMemberMark(workId, memberId);
        return Results.Ok();
    }
}