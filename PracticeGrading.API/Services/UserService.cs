// <copyright file="UserService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models;
using PracticeGrading.API.Models.DTOs;
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

    public async Task AddNewMember(MemberDto member)
    {
        var user = GetUserFromMemberDto(member);
        await userRepository.Create(user);
    }

    public async Task UpdateMember(MemberDto member)
    {
        var user = GetUserFromMemberDto(member);
        await userRepository.Update(user);
    }

    public async Task DeleteMember(int id)
    {
        var user = await userRepository.GetUserById(id);
        if (user != null)
        {
            await userRepository.Delete(user);
        }
    }

    public async Task<MemberDto[]> SearchMembersByNameAsync(string searchName, int offset, int limit)
    {
        var users = await userRepository.SearchMembersByNameAsync(searchName, offset, limit);
        return users.Select(GetMemberDtoFromUser).ToArray();
    }

    internal static MemberDto GetMemberDtoFromUser(User user)
    {
        return new MemberDto(
            Id: user.Id,
            Name: user.UserName,
            Email: user.Email,
            Phone: user.Phone,
            InformationRu: user.InformationRu,
            InformationEn: user.InformationEn
        );
    }

    internal static User GetUserFromMemberDto(MemberDto member)
    {
        return new User
        {
            Id = member.Id,
            UserName = member.Name,
            RoleId = (int)RolesEnum.Member,
            Email = member.Email,
            Phone = member.Phone,
            InformationRu = member.InformationRu,
            InformationEn = member.InformationEn,
        };
    }

    /// <summary>
    /// Logins member.
    /// </summary>
    /// <param name="request">Member login request.</param>
    /// <returns>JWT token.</returns> 
    public async Task<string> LoginMember(LoginMemberRequest request)
    {
        User? member = null;

        if (request.MemberId != 0)
        {
            member = await userRepository.GetUserById(request.MemberId);

            if (member == null)
            {
                throw new InvalidOperationException($"User with ID {request.MemberId} not found.");
            }

            if (member.Meetings?.Any(m => m.Id == request.MeetingId) == false)
            {
                throw new InvalidOperationException($"User with ID {request.MemberId} is not a member of meeting {request.MeetingId}.");
            }
        }

        if (member == null)
        {
            if (string.IsNullOrWhiteSpace(request.UserName))
            {
                throw new InvalidOperationException("Neither an existing user id nor a username for adding a new one are specified.");
            }

            int memberId = await userRepository.Create(new User { UserName = request.UserName, RoleId = (int)RolesEnum.Member });
            member = await userRepository.GetUserById(memberId);

            if (member == null)
            {
                throw new InvalidOperationException("Failed to create new user.");
            }

            await userRepository.AddUserToMeeting(memberId, request.MeetingId);
        }

        return jwtService.GenerateToken(member);
    }
}