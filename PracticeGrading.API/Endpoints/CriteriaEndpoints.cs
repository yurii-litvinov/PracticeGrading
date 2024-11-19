// <copyright file="CriteriaEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

/// <summary>
/// Class for criteria endpoints.
/// </summary>
public static class CriteriaEndpoints
{
    /// <summary>
    /// Registers criteria endpoints.
    /// </summary>
    public static void MapCriteriaEndpoints(this IEndpointRouteBuilder app)
    {
        var meetingGroup = app.MapGroup("/criteria").RequireAuthorization("RequireAdminRole");

        meetingGroup.MapPost("/new", CreateCriteria);
        meetingGroup.MapGet(string.Empty, GetCriteria);
        meetingGroup.MapPut("/update", UpdateCriteria);
        meetingGroup.MapDelete("/delete", DeleteCriteria);
    }

    private static async Task<IResult> CreateCriteria(CriteriaRequest request, CriteriaService criteriaService)
    {
        await criteriaService.AddCriteria(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetCriteria(int? id, CriteriaService criteriaService)
    {
        var criteria = await criteriaService.GetCriteria(id);
        return Results.Ok(criteria);
    }

    private static async Task<IResult> UpdateCriteria(CriteriaRequest request, CriteriaService criteriaService)
    {
        await criteriaService.UpdateCriteria(request);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteCriteria(int id, CriteriaService criteriaService)
    {
        await criteriaService.DeleteCriteria(id);
        return Results.Ok();
    }
}