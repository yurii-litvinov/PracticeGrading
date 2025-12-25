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

    /// <summary>
    /// Creates a new member user.
    /// </summary>
    /// <param name="member">Member data for the new user.</param>
    /// <returns>The ID of the newly created member user.</returns>
    public async Task<int> AddNewMember(MemberRequest member)
    {
        var user = GetUserFromMemberRequest(member, true);
        return await userRepository.Create(user);
    }

    /// <summary>
    /// Updates an existing member user.
    /// </summary>
    /// <param name="member">Updated member data.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task UpdateMember(MemberRequest member)
    {
        var user = GetUserFromMemberRequest(member);
        await userRepository.Update(user);
    }

    /// <summary>
    /// Deletes a member user by ID.
    /// </summary>
    /// <param name="id">The ID of the member to delete.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    public async Task DeleteMember(int id)
    {
        var user = await userRepository.GetUserById(id);
        if (user != null)
        {
            await userRepository.Delete(user);
        }
    }

    /// <summary>
    /// Searches for members by name with pagination support.
    /// </summary>
    /// <param name="searchName">The name to search for (case-insensitive).</param>
    /// <param name="offset">The number of records to skip.</param>
    /// <param name="limit">The maximum number of records to return.</param>
    /// <returns>An array of member DTOs matching the search criteria.</returns>
    public async Task<MemberDto[]> SearchMembersByNameAsync(string searchName, int offset, int limit)
    {
        var users = await userRepository.SearchMembersByNameAsync(searchName, offset, limit);
        return users.Select(GetMemberDtoFromUser).ToArray();
    }

    /// <summary>
    /// Retrieves a member by their unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the user.</param>
    /// <returns>A <see cref="MemberDto"/> representing the member details.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when a user with the specified <paramref name="id"/> is not found.
    /// or when the user exists but does not have the "Member" role.
    /// </exception>
    public async Task<MemberDto> GetMemberById(int id)
    {
        var user = await userRepository.GetUserById(id);

        if (user == null)
        {
            throw new InvalidOperationException("Member with such id was not found");
        }

        if (user.RoleId != (int)RolesEnum.Member)
        {
            throw new InvalidOperationException("User with such id is not a member");
        }

        return GetMemberDtoFromUser(user);
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

    /// <summary>
    /// Converts a User entity to a MemberDto.
    /// </summary>
    /// <param name="user">The user entity to convert.</param>
    /// <returns>A MemberDto containing the user's data.</returns>
    internal static MemberDto GetMemberDtoFromUser(User user)
    {
        return new MemberDto(
            Id: user.Id,
            Name: user.UserName,
            Email: user.Email,
            Phone: user.Phone,
            InformationRu: user.InformationRu,
            InformationEn: user.InformationEn);
    }

    /// <summary>
    /// Converts a MemberRequest to a User entity.
    /// </summary>
    /// <param name="member">The member request data.</param>
    /// <param name="isNew">Indicates whether this is a new user (ID will be reset to 0).</param>
    /// <returns>A User entity populated with the member data.</returns>
    private static User GetUserFromMemberRequest(MemberRequest member, bool isNew = false)
    {
        return new User
        {
            Id = isNew ? 0 : member.Id,
            UserName = member.Name,
            RoleId = (int)RolesEnum.Member,
            Email = member.Email,
            Phone = member.Phone,
            InformationRu = member.InformationRu,
            InformationEn = member.InformationEn,
        };
    }
}