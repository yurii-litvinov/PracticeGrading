// <copyright file="MeetingMemberAccessEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PracticeGrading.API.Auth;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data.Entities;

/// <summary>
/// Contains endpoints for meeting member access requests.
/// </summary>
public static class MeetingMemberAccessEndpoints
{
    private const string MeetingAccessTokenHeader = "X-Meeting-Access-Token";

    /// <summary>
    /// Registers meeting member access endpoints.
    /// </summary>
    /// <param name="app">Web application.</param>
    public static void MapMeetingMemberAccessEndpoints(
        this WebApplication app)
    {
        app.MapPost(
            "/meetings/{meetingId:int}/access-requests",
            CreateAccessRequest);

        app.MapGet(
            "/meetings/{meetingId:int}/read-only",
            GetReadOnlyMeeting);

        app.MapGet(
            "/meetings/{meetingId:int}/access-requests/status",
            GetAccessRequestStatus);

        app.MapPost(
            "/meetings/{meetingId:int}/member-login",
            LoginApprovedMember);

        app.MapGet(
                "/meetings/{meetingId:int}/access-requests/pending",
                GetPendingRequests)
            .RequireAuthorization("RequireAdminOrMemberRole");

        app.MapPost(
                "/meetings/{meetingId:int}/access-requests/{accessId:int}/approve",
                ApproveRequest)
            .RequireAuthorization("RequireAdminOrMemberRole");

        app.MapPost(
                "/meetings/{meetingId:int}/access-requests/{accessId:int}/reject",
                RejectRequest)
            .RequireAuthorization("RequireAdminOrMemberRole");

        app.MapGet(
                "/meetings/{meetingId:int}/access-requests/approved",
                GetApprovedAccesses)
            .RequireAuthorization("RequireAdminRole");

        app.MapPost(
                "/meetings/{meetingId:int}/access-requests/{accessId:int}/revoke",
                RevokeRequest)
            .RequireAuthorization("RequireAdminRole");
    }

    /// <summary>
    /// Creates a pending meeting access request.
    /// </summary>
    private static async Task<IResult> CreateAccessRequest(
        int meetingId,
        CreateMeetingMemberAccessRequest request,
        MeetingMemberAccessService accessService)
    {
        var (result, token) = await accessService.CreateRequest(
            meetingId,
            request.MemberId,
            request.UserName);

        return result switch
        {
            CreateMeetingMemberAccessResult.Success =>
                Results.Ok(new { Token = token }),

            CreateMeetingMemberAccessResult.MeetingNotFound =>
                Results.NotFound("Meeting was not found."),

            CreateMeetingMemberAccessResult.MemberNotFound =>
                Results.NotFound("Member was not found."),

            CreateMeetingMemberAccessResult.InvalidMember =>
                Results.BadRequest(
                    "The specified user is not a commission member."),

            CreateMeetingMemberAccessResult.InvalidMemberName =>
                Results.BadRequest(
                    "An existing member or a new member name must be specified."),

            _ => Results.StatusCode(
                StatusCodes.Status500InternalServerError),
        };
    }

    /// <summary>
    /// Returns meeting information available to a participant
    /// whose access request is pending or approved.
    /// </summary>
    private static async Task<IResult> GetReadOnlyMeeting(
        int meetingId,
        [FromHeader(Name = MeetingAccessTokenHeader)]
        string? accessToken,
        MeetingMemberAccessService accessService,
        MeetingService meetingService)
    {
        var accessStatus = await accessService.GetStatus(
            meetingId,
            accessToken);

        if (accessStatus is null)
        {
            return Results.Unauthorized();
        }

        if (accessStatus.Status is
            MeetingMemberAccessStatus.Rejected or
            MeetingMemberAccessStatus.Revoked)
        {
            return Results.Forbid();
        }

        var meetings = await meetingService.GetMeeting(
            meetingId,
            isMemberRequest: true);

        return Results.Ok(meetings.First());
    }

    /// <summary>
    /// Returns the current meeting access request status.
    /// </summary>
    private static async Task<IResult> GetAccessRequestStatus(
        int meetingId,
        [FromHeader(Name = MeetingAccessTokenHeader)]
        string? accessToken,
        MeetingMemberAccessService accessService)
    {
        var status = await accessService.GetStatus(
            meetingId,
            accessToken);

        return status is null
            ? Results.Unauthorized()
            : Results.Ok(status);
    }

    /// <summary>
    /// Issues a JWT for an approved meeting member.
    /// </summary>
    private static async Task<IResult> LoginApprovedMember(
        int meetingId,
        [FromHeader(Name = MeetingAccessTokenHeader)]
        string? accessToken,
        MeetingMemberAccessService accessService)
    {
        var jwt = await accessService.LoginApprovedMember(
            meetingId,
            accessToken);

        return jwt is null
            ? Results.Unauthorized()
            : Results.Ok(new { Token = jwt });
    }

    /// <summary>
    /// Returns pending access requests for a meeting.
    /// </summary>
    private static async Task<IResult> GetPendingRequests(
        int meetingId,
        ClaimsPrincipal user,
        MeetingMemberAccessService accessService)
    {
        if (!CanManageMeeting(user, meetingId))
        {
            return Results.Forbid();
        }

        var requests =
            await accessService.GetPendingRequests(meetingId);

        return Results.Ok(requests);
    }

    private static async Task<IResult> ApproveRequest(
        int meetingId,
        int accessId,
        ClaimsPrincipal user,
        MeetingMemberAccessService accessService)
    {
        if (!CanManageMeeting(user, meetingId) ||
            !TryGetUserId(user, out var userId))
        {
            return Results.Forbid();
        }

        var result = await accessService.ApproveRequest(
            meetingId,
            accessId,
            userId);

        return ConvertProcessingResult(result);
    }

    /// <summary>
    /// Rejects a pending meeting access request.
    /// </summary>
    private static async Task<IResult> RejectRequest(
        int meetingId,
        int accessId,
        ClaimsPrincipal user,
        MeetingMemberAccessService accessService)
    {
        if (!CanManageMeeting(user, meetingId) ||
            !TryGetUserId(user, out var userId))
        {
            return Results.Forbid();
        }

        var result = await accessService.RejectRequest(
            meetingId,
            accessId,
            userId);

        return ConvertProcessingResult(result);
    }

    /// <summary>
    /// Returns approved accesses for a meeting.
    /// </summary>
    private static async Task<IResult> GetApprovedAccesses(
        int meetingId,
        MeetingMemberAccessService accessService)
    {
        var accesses =
            await accessService.GetApprovedAccesses(
                meetingId);

        return Results.Ok(accesses);
    }

    /// <summary>
    /// Revokes an approved meeting access.
    /// </summary>
    private static async Task<IResult> RevokeRequest(
        int meetingId,
        int accessId,
        ClaimsPrincipal user,
        MeetingMemberAccessService accessService)
    {
        if (!TryGetUserId(user, out var userId))
        {
            return Results.Forbid();
        }

        var result =
            await accessService.RevokeRequest(
                meetingId,
                accessId,
                userId);

        return ConvertProcessingResult(result);
    }

    /// <summary>
    /// Determines whether the user can manage access requests for a meeting.
    /// </summary>
    private static bool CanManageMeeting(
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
            int.TryParse(meetingIdClaim, out var authorizedMeetingId) &&
            authorizedMeetingId == meetingId;
    }

    /// <summary>
    /// Attempts to read the user identifier from JWT claims.
    /// </summary>
    private static bool TryGetUserId(
        ClaimsPrincipal user,
        out int userId)
    {
        var userIdClaim =
            user.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(userIdClaim, out userId);
    }

    /// <summary>
    /// Converts an access request processing result into an HTTP result.
    /// </summary>
    private static IResult ConvertProcessingResult(
        ProcessMeetingMemberAccessResult result)
    {
        return result switch
        {
            ProcessMeetingMemberAccessResult.Success =>
                Results.Ok(),

            ProcessMeetingMemberAccessResult.AccessNotFound =>
                Results.NotFound(),

            ProcessMeetingMemberAccessResult.AlreadyProcessed =>
                Results.Conflict(
                    "The access request has already been processed."),

            _ => Results.StatusCode(
                StatusCodes.Status500InternalServerError),
        };
    }
}