// <copyright file="HealthEndpoints.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Endpoints;

/// <summary>
/// Class for health check endpoints.
/// </summary>
public static class HealthEndpoints
{
    /// <summary>
    /// Registers health check endpoints.
    /// </summary>
    /// <param name="app">The endpoint route builder to which health check endpoints will be mapped.</param>
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet(
                "/health/live",
                static () => Results.NoContent())
            .AllowAnonymous();
    }
}