using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NPOI.Util.ArrayExtensions;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class UserServiceTests : TestBase
{
    [Test]
    public async Task TestLoginAdmin()
    {
        var request = new LoginAdminRequest("admin", "admin");
        var token = await UserService.LoginAdmin(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestLoginMemberAsAdmin()
    {
        var member = new User
        {
            UserName = "member",
            RoleId = 2
        };

        await UserRepository.Create(member);

        var request = new LoginAdminRequest(member.UserName, "password");
        var token = await UserService.LoginAdmin(request);

        token.Should().BeEmpty();
    }

    [Test]
    public async Task TestLoginAdminWithWrongPassword()
    {
        var request = new LoginAdminRequest("admin", "wrong");
        var token = await UserService.LoginAdmin(request);

        token.Should().BeEmpty();
    }

    [Test]
    public async Task TestLoginNonexistentUserAsAdmin()
    {
        var request = new LoginAdminRequest("non-existent", "password");

        var action = async () => await UserService.LoginAdmin(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with UserName {request.UserName} was not found.");
    }

    [Test]
    public async Task TestLoginMember()
    {
        await CreateTestMeeting();

        var request = new LoginMemberRequest(MemberId, null!, 1);
        var token = await UserService.LoginMember(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestLoginNonexistentMember()
    {
        await CreateTestMeeting();

        var request = new LoginMemberRequest(0, "nonexistent", 1);
        var token = await UserService.LoginMember(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestCreateMember()
    {
        var member = new MemberRequest(0, "member");
        int id = await UserService.AddNewMember(member);
        var addedMember = await UserRepository.GetUserById(id);

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        await UserRepository.Delete(addedMember);
    }

    [Test]
    public async Task TestDeleteMember()
    {
        var member = new MemberRequest(0, "member");
        int id = await UserService.AddNewMember(member);
        var addedMember = await UserRepository.GetUserById(id);

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        await UserService.DeleteMember(addedMember.Id);

        var afterDeleteMember = await UserRepository.GetUserById(id);

        afterDeleteMember.Should().BeNull();
    }

    [Test]
    public async Task TestUpdateMember()
    {
        User user = new User { Id = 0, UserName = "member", RoleId = (int)RolesEnum.Member };
        int id = await UserRepository.Create(user);
        var addedMember = await UserRepository.GetUserById(id);
        dbContext.Entry(user).State = EntityState.Detached;

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        var updatedMember = new MemberRequest(
            Id: addedMember.Id,
            Name: "updated member");

        await UserService.UpdateMember(updatedMember);
    }

    [Test]
    public async Task SearchMembersByNameAsyncTest()
    {
        int count = 10;
        var memberIds = new int[count];
        var users = new User[count];

        for (int i = 0; i < count; i++)
        {
            users[i] = new User { UserName = $"member{i}", RoleId = 2 };
        }

        await Task.WhenAll(memberIds.Select((_, index) =>
            UserRepository.Create(users[index])
        ));

        var firstHalfMembers = await UserService.SearchMembersByNameAsync("member", 0, count / 2);

        firstHalfMembers.Should().NotBeNull();
        firstHalfMembers.Length.Should().Be(count / 2);

        firstHalfMembers.Select((member, index) => (member, index))
            .All(pair => pair.member.Name == $"member{pair.index}").Should().BeTrue();

        var secondHalfMembers = await UserService.SearchMembersByNameAsync("member", count / 2, count);

        secondHalfMembers.Should().NotBeNull();
        secondHalfMembers.Length.Should().Be(count % 2 == 0 ? count / 2 : (count / 2) + 1);

        secondHalfMembers.Select((member, index) => (member, index))
            .All(pair => pair.member.Name == $"member{pair.index + (count / 2)}").Should().BeTrue();

        await Task.WhenAll(memberIds.Select((_, index) =>
            UserRepository.Delete(users[index])));
        
    }

    [Test]
    public async Task TestChangePasswordSuccessfully()
    {
        var request = new ChangePasswordRequest(
            CurrentPassword: "admin",
            NewPassword: "new-admin-password");

        var result = await UserService.ChangePassword(
            userId: 1,
            request);

        result.Should().Be(ChangePasswordResult.Success);

        dbContext.ChangeTracker.Clear();

        var user = await UserRepository.GetUserById(1);

        user.Should().NotBeNull();
        user.PasswordHash.Should().NotBeNullOrEmpty();

        BCrypt.Net.BCrypt.Verify(
            request.NewPassword,
            user.PasswordHash)
        .Should()
        .BeTrue();

        BCrypt.Net.BCrypt.Verify(
            request.CurrentPassword,
            user.PasswordHash)
        .Should()
        .BeFalse();
    }

    [Test]
    public async Task TestChangePasswordWithInvalidCurrentPassword()
    {
        var userBefore = await UserRepository.GetUserById(1);

        userBefore.Should().NotBeNull();

        var passwordHashBefore = userBefore!.PasswordHash;

        var request = new ChangePasswordRequest(
            CurrentPassword: "wrong-password",
            NewPassword: "new-admin-password");

        var result = await UserService.ChangePassword(
            userId: 1,
            request);

        result.Should().Be(
            ChangePasswordResult.InvalidCurrentPassword);

        var userAfter = await UserRepository.GetUserById(1);

        userAfter.Should().NotBeNull();
        userAfter!.PasswordHash.Should().Be(passwordHashBefore);

        BCrypt.Net.BCrypt.Verify(
                "admin",
                userAfter.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestChangePasswordWithTooShortNewPassword()
    {
        var userBefore = await UserRepository.GetUserById(1);

        userBefore.Should().NotBeNull();

        var passwordHashBefore = userBefore!.PasswordHash;

        var request = new ChangePasswordRequest(
            CurrentPassword: "admin",
            NewPassword: "short");

        var result = await UserService.ChangePassword(
            userId: 1,
            request);

        result.Should().Be(
            ChangePasswordResult.InvalidNewPassword);

        dbContext.ChangeTracker.Clear();

        var userAfter = await UserRepository.GetUserById(1);

        userAfter.Should().NotBeNull();
        userAfter!.PasswordHash.Should().Be(passwordHashBefore);

        BCrypt.Net.BCrypt.Verify(
                "admin",
                userAfter.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestChangePasswordWithSamePassword()
    {
        const string currentPassword = "current-password-123";

        var user = new User
        {
            UserName = "second-admin",
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(currentPassword),
            RoleId = (int)RolesEnum.Admin,
        };

        var userId = await UserRepository.Create(user);
        var passwordHashBefore = user.PasswordHash;

        dbContext.ChangeTracker.Clear();

        var request = new ChangePasswordRequest(
            CurrentPassword: currentPassword,
            NewPassword: currentPassword);

        var result = await UserService.ChangePassword(
            userId,
            request);

        result.Should().Be(
            ChangePasswordResult.InvalidNewPassword);

        dbContext.ChangeTracker.Clear();

        var userAfter = await UserRepository.GetUserById(userId);

        userAfter.Should().NotBeNull();
        userAfter!.PasswordHash.Should().Be(passwordHashBefore);

        BCrypt.Net.BCrypt.Verify(
                currentPassword,
                userAfter.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestChangePasswordForNonexistentUser()
    {
        var request = new ChangePasswordRequest(
            CurrentPassword: "current-password",
            NewPassword: "new-valid-password");

        var result = await UserService.ChangePassword(
            userId: int.MaxValue,
            request);

        result.Should().Be(
            ChangePasswordResult.UserNotFound);
    }

    [Test]
    public async Task TestCreateAdminSuccessfully()
    {
        var request = new CreateAdminRequest(
            UserName: "  new-admin  ",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var result = await UserService.CreateAdmin(
            currentAdminId: 1,
            request);

        result.Should().Be(CreateAdminResult.Success);

        dbContext.ChangeTracker.Clear();

        var newAdmin =
            await UserRepository.GetByUserName("new-admin");

        newAdmin.Should().NotBeNull();
        newAdmin!.RoleId.Should().Be((int)RolesEnum.Admin);

        BCrypt.Net.BCrypt.Verify(
                request.Password,
                newAdmin.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestCreateAdminWithInvalidCurrentPassword()
    {
        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "wrong-password");

        var result = await UserService.CreateAdmin(1, request);

        result.Should().Be(
            CreateAdminResult.InvalidCurrentPassword);

        dbContext.ChangeTracker.Clear();

        var newAdmin =
            await UserRepository.GetByUserName("new-admin");

        newAdmin.Should().BeNull();
    }

    [Test]
    public async Task TestCreateAdminWithInvalidUserName()
    {
        var request = new CreateAdminRequest(
            UserName: "   ",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var result = await UserService.CreateAdmin(1, request);

        result.Should().Be(
            CreateAdminResult.InvalidUserName);
    }

    [Test]
    public async Task TestCreateAdminWithInvalidPassword()
    {
        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "short",
            CurrentPassword: "admin");

        var result = await UserService.CreateAdmin(1, request);

        result.Should().Be(
            CreateAdminResult.InvalidNewAdminPassword);

        dbContext.ChangeTracker.Clear();

        var newAdmin =
            await UserRepository.GetByUserName("new-admin");

        newAdmin.Should().BeNull();
    }

    [Test]
    public async Task TestCreateAdminWithExistingUserName()
    {
        var request = new CreateAdminRequest(
            UserName: "admin",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var result = await UserService.CreateAdmin(1, request);

        result.Should().Be(
            CreateAdminResult.UserNameAlreadyExists);
    }

    [Test]
    public async Task TestCreateAdminByNonexistentAdmin()
    {
        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "some-password");

        var result = await UserService.CreateAdmin(
            int.MaxValue,
            request);

        result.Should().Be(
            CreateAdminResult.CurrentAdminNotFound);
    }
}