// <copyright file="Program.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

#pragma warning disable SA1200
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PracticeGrading.API;
using PracticeGrading.API.Models;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
using PracticeGrading.Data.Repositories;

#pragma warning restore SA1200

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddScoped<UserService>();

builder.Services.AddScoped<UserRepository>();

builder.Services.AddScoped<MeetingService>();

builder.Services.AddScoped<MeetingRepository>();

builder.Services.AddScoped<JwtService>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("JwtOptions"));

builder.Services.AddCustomAuth(builder.Configuration.GetSection("JwtOptions").Bind);

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "CorsPolicy",
            policyBuilder => policyBuilder
                .AllowAnyOrigin()
                .AllowAnyMethod()
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

app.MapPost("/login", Login);

app.MapPost("/meetings/new", CreateMeeting).RequireAuthorization("RequireAdminRole");

app.MapGet("/meetings", GetMeeting).RequireAuthorization("RequireAdminRole");

app.MapDelete("/meetings/delete", DeleteMeeting).RequireAuthorization("RequireAdminRole");

async Task<IResult> Login(LoginAdminRequest request, UserService userService)
{
    var k = await userService.LoginAdmin(request);
    return k == string.Empty ? Results.Unauthorized() : Results.Ok(new { Token = k });
}

async Task<IResult> CreateMeeting(CreateMeetingRequest request, MeetingService meetingService)
{
    await meetingService.AddMeeting(request);
    return Results.Ok();
}

async Task<IResult> GetMeeting(int? id, MeetingService meetingService)
{
    var meetings = await meetingService.GetMeeting(id);
    return Results.Ok(meetings);
}

async Task<IResult> DeleteMeeting(int id, MeetingService meetingService)
{
    await meetingService.DeleteMeeting(id);
    return Results.Ok();
}

app.Run();