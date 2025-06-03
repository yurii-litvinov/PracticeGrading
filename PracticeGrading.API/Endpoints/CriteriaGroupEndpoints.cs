// <copyright file="CriteriaGroupEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

/// <summary>
/// Class for criteria group endpoints.
/// </summary>
public static class CriteriaGroupEndpoints
{
    /// <summary>
    /// Registers criteria group endpoints.
    /// </summary>
    public static void MapCriteriaGroupEndpoints(this IEndpointRouteBuilder app)
    {
        var criteriaGroup = app.MapGroup("/criteriaGroup");

        criteriaGroup.MapPost("/new", CreateCriteriaGroup).RequireAuthorization("RequireAdminRole");
        criteriaGroup.MapGet(string.Empty, GetCriteriaGroup).RequireAuthorization("RequireAdminOrMemberRole");
        criteriaGroup.MapPut("/update", UpdateCriteriaGroup).RequireAuthorization("RequireAdminRole");
        criteriaGroup.MapDelete("/delete", DeleteCriteriaGroup).RequireAuthorization("RequireAdminRole");
    }

    private static async Task<IResult> CreateCriteriaGroup(CriteriaGroupRequest request, CriteriaGroupService criteriaGroupService)
    {
        await criteriaGroupService.AddCriteriaGroup(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetCriteriaGroup(int? id, CriteriaGroupService criteriaGroupService)
    {
        var group = await criteriaGroupService.GetCriteriaGroup(id);
        return Results.Ok(group);
    }

    private static async Task<IResult> UpdateCriteriaGroup(CriteriaGroupRequest request, CriteriaGroupService criteriaGroupService)
    {
        await criteriaGroupService.UpdateCriteriaGroup(request);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteCriteriaGroup(int id, CriteriaGroupService criteriaGroupService)
    {
        await criteriaGroupService.DeleteCriteriaGroup(id);
        return Results.Ok();
    }
}