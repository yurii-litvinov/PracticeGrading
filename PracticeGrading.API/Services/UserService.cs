// <copyright file="UserService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with users.
/// </summary>
/// <param name="userRepository">Repository for users.</param>
/// <param name="jwtService">Service for generating JWT tokens.</param>
public class UserService(UserRepository userRepository, JwtService jwtService)
{
    /// <summary>
    /// Logins admin.
    /// </summary>
    /// <param name="request">Admin login request.</param>
    /// <returns>JWT token.</returns>
    public async Task<string> LoginAdmin(LoginAdminRequest request)
    {
        var user = await userRepository.GetByUserName(request.UserName) ??
                   throw new InvalidOperationException($"User with UserName {request.UserName} was not found.");

        if (user.RoleId == (int)RolesEnum.Admin && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return jwtService.GenerateToken(user);
        }

        return string.Empty;
    }

    /// <summary>
    /// Logins member.
    /// </summary>
    /// <param name="request">Member login request.</param>
    /// <returns>JWT token.</returns>
    public async Task<string> LoginMember(LoginMemberRequest request)
    {
        var user = await userRepository.GetByUserName(request.UserName, request.MeetingId);

        if (user == null)
        {
            await userRepository.Create(
                new User
                    { UserName = request.UserName, MeetingId = request.MeetingId, RoleId = (int)RolesEnum.Member });
            user = await userRepository.GetByUserName(request.UserName, request.MeetingId) ??
                   throw new InvalidOperationException($"User with UserName {request.UserName} was not found.");
        }

        return jwtService.GenerateToken(user);
    }
}