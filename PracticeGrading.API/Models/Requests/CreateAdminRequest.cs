// <copyright file="CreateAdminRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models.Requests;

/// <summary>
/// Request for creating a new administrator.
/// </summary>
/// <param name="UserName">The username of the new administrator.</param>
/// <param name="Password">The password of the new administrator.</param>
/// <param name="CurrentPassword">
/// The current password of the administrator performing the operation.
/// </param>
public record CreateAdminRequest(
    string UserName,
    string Password,
    string CurrentPassword);