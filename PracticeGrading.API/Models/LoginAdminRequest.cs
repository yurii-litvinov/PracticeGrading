// <copyright file="LoginAdminRequest.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Models;

using System.Diagnostics.CodeAnalysis;

/// <param name="UserName">Gets or sets username.</param>
/// <param name="Password">Gets or sets password.</param>
[SuppressMessage(
    "StyleCop.CSharp.NamingRules",
    "SA1313:Parameter names should begin with lower-case letter",
    Justification = "Causes another problem with names")]
public record LoginAdminRequest(string UserName, string Password);