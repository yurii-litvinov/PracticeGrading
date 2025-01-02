// <copyright file="Program.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

#pragma warning disable SA1200
using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PracticeGrading.API;
using PracticeGrading.API.Endpoints;
using PracticeGrading.API.Services;
using PracticeGrading.Data;

#pragma warning restore SA1200

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(
    options =>
    {
        options.AddSecurityDefinition(
            "Bearer",
            new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
            });

        options.AddSecurityRequirement(
            new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer",
                        },
                    },
                    Array.Empty<string>()
                },
            });
    });

builder.Services.AddDbContext<AppDbContext>(
    options => options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddAppServices();

builder.Services.AddScoped<JwtService>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));

builder.Services.AddCustomAuth(builder.Configuration.GetSection("JwtOptions").Bind);

Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));

var host = Environment.GetEnvironmentVariable("HOST");

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "CorsPolicy",
            policyBuilder => policyBuilder
                .WithOrigins($"http://{host}:3000")
                .AllowAnyMethod()
                .AllowCredentials()
                .AllowAnyHeader());
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();

app.UseAuthorization();

app.MapHub<MeetingHub>("/meetingHub");

app.MapMeetingEndpoints();

app.MapCriteriaEndpoints();

app.MapUserEndpoints();

app.MapMarkEndpoints();

app.Run();

public partial class Program;