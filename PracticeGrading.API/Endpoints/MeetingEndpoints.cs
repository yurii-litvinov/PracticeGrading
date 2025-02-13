// <copyright file="MeetingEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;

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
        var meetingGroup = app.MapGroup("/meetings");

        meetingGroup.MapPost("/new", CreateMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapPut("/update", UpdateMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapDelete("/delete", DeleteMeeting).RequireAuthorization("RequireAdminRole");
        meetingGroup.MapPost("/fromFile", CreateMeetingsFromFile).RequireAuthorization("RequireAdminRole");

        meetingGroup.MapGet(string.Empty, GetMeeting).RequireAuthorization("RequireAdminOrMemberRole");
        meetingGroup.MapPut("/setMark", SetFinalMark).RequireAuthorization("RequireAdminOrMemberRole");

        meetingGroup.MapGet("/members", GetMembers).AllowAnonymous();
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

    private static async Task<IResult> GetMembers(int id, MeetingService meetingService)
    {
        var members = await meetingService.GetMembers(id);
        return Results.Ok(members);
    }

    private static async Task<IResult> SetFinalMark(int meetingId, int workId, string mark, MeetingService meetingService)
    {
        await meetingService.SetFinalMark(meetingId, workId, mark);
        return Results.Ok();
    }

    private static async Task<IResult> CreateMeetingsFromFile(
        ParseScheduleRequest request,
        MeetingService meetingService)
    {
        await meetingService.CreateMeetingsFromFile(request);
        return Results.Ok();
    }
}