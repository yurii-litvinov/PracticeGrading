// <copyright file="MarkEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using System.Security.Claims;
using PracticeGrading.API.Auth;
using PracticeGrading.API.Models;
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

    private static async Task<IResult> CreateMemberMark(
        MemberMarkRequest request,
        ClaimsPrincipal user,
        MarkService markService)
    {
        var workMeetingId =
            await markService.GetMeetingIdByStudentWorkId(
                request.StudentWorkId);

        if (!workMeetingId.HasValue)
        {
            return Results.NotFound("Student work was not found.");
        }

        var authorizedRequest = BindMemberToRequest(
            request,
            user,
            workMeetingId.Value);

        if (authorizedRequest is null)
        {
            return Results.Forbid();
        }

        await markService.AddMemberMark(authorizedRequest);

        return Results.Ok();
    }

    private static async Task<IResult> GetMemberMark(
        int workId,
        int? memberId,
        ClaimsPrincipal user,
        MarkService markService)
    {
        var workMeetingId =
            await markService.GetMeetingIdByStudentWorkId(workId);

        if (!workMeetingId.HasValue)
        {
            return Results.NotFound("Student work was not found.");
        }

        if (!CanAccessMeeting(
            user,
            workMeetingId.Value))
        {
            return Results.Forbid();
        }

        var marks = await markService.GetMemberMarks(
            workId,
            memberId);

        return Results.Ok(marks);
    }

    private static async Task<IResult> UpdateMemberMark(
        MemberMarkRequest request,
        ClaimsPrincipal user,
        MarkService markService)
    {
        var workMeetingId =
            await markService.GetMeetingIdByStudentWorkId(
                request.StudentWorkId);

        if (!workMeetingId.HasValue)
        {
            return Results.NotFound("Student work was not found.");
        }

        var authorizedRequest = BindMemberToRequest(
            request,
            user,
            workMeetingId.Value);

        if (authorizedRequest is null)
        {
            return Results.Forbid();
        }

        await markService.UpdateMemberMark(authorizedRequest);

        return Results.Ok();
    }

    private static async Task<IResult> DeleteMemberMark(int workId, int memberId, MarkService markService)
    {
        await markService.DeleteMemberMark(workId, memberId);
        return Results.Ok();
    }

    private static MemberMarkRequest? BindMemberToRequest(
        MemberMarkRequest request,
        ClaimsPrincipal user,
        int workMeetingId)
    {
        if (user.IsInRole(
            RolesEnum.Admin.ToString().ToLowerInvariant()))
        {
            return request;
        }

        if (!CanAccessMeeting(user, workMeetingId))
        {
            return null;
        }

        var userIdClaim =
            user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return request with
        {
            MemberId = userId,
        };
    }

    /// <summary>
    /// Determines whether the authenticated user can access a meeting.
    /// </summary>
    /// <param name="user">Authenticated user.</param>
    /// <param name="meetingId">Meeting identifier.</param>
    /// <returns>
    /// <see langword="true"/> if access is allowed;
    /// otherwise, <see langword="false"/>.
    /// </returns>
    private static bool CanAccessMeeting(
        ClaimsPrincipal user,
        int meetingId)
    {
        if (user.IsInRole(
            RolesEnum.Admin.ToString().ToLowerInvariant()))
        {
            return true;
        }

        var meetingIdClaim =
            user.FindFirstValue(CustomClaimTypes.MeetingId);

        return user.IsInRole(
                RolesEnum.Member.ToString().ToLowerInvariant()) &&
            int.TryParse(
                meetingIdClaim,
                out var authorizedMeetingId) &&
            authorizedMeetingId == meetingId;
    }
}