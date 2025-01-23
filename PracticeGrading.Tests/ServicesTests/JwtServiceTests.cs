using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class JwtServiceTests : TestBase
{
    [Test]
    public void TestGenerateToken()
    {
        var user = new User
        {
            UserName = "username",
            Role = new Role { RoleName = "role" }
        };

        var token = JwtService.GenerateToken(user);

        token.Should().NotBeNullOrEmpty();

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = JwtOptions.Value.Issuer,
            ValidAudience = JwtOptions.Value.Audience,
            IssuerSigningKey =
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtOptions.Value.SecretKey ?? string.Empty)),
            ClockSkew = TimeSpan.Zero,
        };

        tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

        validatedToken.Should().NotBeNull();

        var jwtToken = (JwtSecurityToken)validatedToken;
        jwtToken.Claims.First(c => c.Type == ClaimTypes.Name).Value.Should().Be(user.UserName);
        jwtToken.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value.Should().Be(user.Id.ToString());
        jwtToken.Claims.First(c => c.Type == ClaimTypes.Role).Value.Should().Be(user.Role.RoleName);
    }
}