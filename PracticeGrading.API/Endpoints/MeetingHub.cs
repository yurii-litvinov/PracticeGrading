// <copyright file="MeetingHub.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Class for meeting hub.
/// </summary>
public class MeetingHub : Hub
{
    /// <summary>
    /// Notifies commission members of a certain meeting.
    /// </summary>
    /// <param name="meetingId"> Meeting Id.</param>
    /// <param name="action">Admin action.</param>
    public async Task NotifyMembers(string meetingId, string action)
    {
        // Сообщаем всем участникам с указанным meetingId
        await this.Clients.Group(meetingId).SendAsync("ReceiveNotification", action);
    }

    /// <summary>
    /// Adds a client to the group by meeting Id.
    /// </summary>
    /// <param name="meetingId"> Meeting Id.</param>
    public async Task JoinMeetingGroup(string meetingId)
    {
        await this.Groups.AddToGroupAsync(this.Context.ConnectionId, meetingId);
    }

    /// <summary>
    /// Removes a client from the group by meeting Id.
    /// </summary>
    /// <param name="meetingId"> Meeting Id.</param>
    public async Task LeaveMeetingGroup(string meetingId)
    {
        await this.Groups.RemoveFromGroupAsync(this.Context.ConnectionId, meetingId);
    }
}