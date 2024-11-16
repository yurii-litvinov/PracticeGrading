// <copyright file="UserService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using Models.Requests;
using Models;
using System.Diagnostics.CodeAnalysis;
using Data.Repositories;

/// <summary>
/// Service for working with users.
/// </summary>
/// <param name="userRepository">Repository for users.</param>
/// <param name="jwtService">Service for generating JWT tokens.</param>
[SuppressMessage(
    "StyleCop.CSharp.SpacingRules",
    "SA1010:Opening square brackets should be spaced correctly",
    Justification = "Causes another problem with spaces")]
public class UserService(UserRepository userRepository, JwtService jwtService)
{
    /// <summary>
    /// Logins admin.
    /// </summary>
    /// <param name="request">Admin login request.</param>
    /// <returns>JWT token.</returns>
    public async Task<string> LoginAdmin(LoginAdminRequest request)
    {
        var user = await userRepository.GetByUserName(request.UserName);

        if (user == null)
        {
            throw new Exception();
        }

        if (user.RoleId == (int)RolesEnum.Admin && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return jwtService.GenerateToken(user);
        }

        return string.Empty;
    }
}