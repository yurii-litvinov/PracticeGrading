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
        var criteriaGroup = app.MapGroup("/marks").RequireAuthorization("RequireAdminOrMemberRole");

        criteriaGroup.MapPost("/new", CreateMemberMark);
        criteriaGroup.MapGet(string.Empty, GetMemberMark);
        criteriaGroup.MapPut("/update", UpdateMemberMark);
    }

    private static async Task<IResult> CreateMemberMark(MemberMarkRequest request, MarkService markService)
    {
        await markService.AddMemberMark(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetMemberMark(int? memberId, int? workId, MarkService markService)
    {
        var marks = await markService.GetMemberMarks(memberId, workId);
        return Results.Ok(marks);
    }

    private static async Task<IResult> UpdateMemberMark(MemberMarkRequest request, MarkService markService)
    {
        await markService.UpdateMemberMark(request);
        return Results.Ok();
    }
}