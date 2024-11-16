// <copyright file="MeetingEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using Models.Requests;
using Services;

/// <summary>
/// Class for meeting endpoints.
/// </summary>
public static class MeetingEndpoints
{
    /// <summary>
    /// Registers meeting endpoints.
    /// </summary>
    public static void MapMeetingEndpoints(this IEndpointRouteBuilder app)
    {
        var meetingGroup = app.MapGroup("/meetings").RequireAuthorization("RequireAdminRole");

        meetingGroup.MapPost("/new", CreateMeeting);
        meetingGroup.MapGet(string.Empty, GetMeeting);
        meetingGroup.MapPut("/update", UpdateMeeting);
        meetingGroup.MapDelete("/delete", DeleteMeeting);
    }

    private static async Task<IResult> CreateMeeting(MeetingRequest request, MeetingService meetingService)
    {
        await meetingService.AddMeeting(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetMeeting(int? id, MeetingService meetingService)
    {
        var meetings = await meetingService.GetMeeting(id);
        return Results.Ok(meetings);
    }

    private static async Task<IResult> UpdateMeeting(MeetingRequest request, MeetingService meetingService)
    {
        await meetingService.UpdateMeeting(request);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteMeeting(int id, MeetingService meetingService)
    {
        await meetingService.DeleteMeeting(id);
        return Results.Ok();
    }
}