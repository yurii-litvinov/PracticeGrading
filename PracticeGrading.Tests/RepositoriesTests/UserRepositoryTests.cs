using FluentAssertions;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.RepositoriesTests;

public class UserRepositoryTests : TestBase
{
    [Test]
    public async Task TestUserCreation()
    {
        var user = new User
        {
            UserName = "new_user",
            RoleId = 2
        };

        await UserRepository.Create(user);

        var newUser = await UserRepository.GetByUserName(user.UserName);

        newUser.Should().NotBeNull();
        newUser.UserName.Should().Be(user.UserName);
    }

    [Test]
    public async Task TestUserGetting()
    {
        var user = new User
        {
            UserName = "some_user",
            RoleId = 2
        };

        int userId = await UserRepository.Create(user);

        var newUser = await UserRepository.GetUserById(userId);
        var meeting = new Meeting { Id = 15, StudentWorks = [TestWork], CriteriaGroup = TestCriteriaGroup, Members = [newUser!] };
        await MeetingRepository.Create(meeting);


        newUser.Should().NotBeNull();
        newUser.Role.Should().NotBeNull();
        newUser.Meetings.Should().NotBeNull();

        newUser.Role.Id.Should().Be(user.RoleId);
        newUser.Meetings.Should().ContainSingle(meeting => meeting.Id == 15);
    }

    [Test]
    public async Task TestUserUpdate()
    {
        var user = new User
        {
            Id = 10,
            UserName = "username",
            PasswordHash = "password",
            RoleId = 2
        };

        await UserRepository.Create(user);

        user.UserName = "new_username";
        user.PasswordHash = "new_password";
        await UserRepository.Update(user);

        var updatedUser = await UserRepository.GetByUserName(user.UserName);

        updatedUser.Should().NotBeNull();
        updatedUser.UserName.Should().Be(user.UserName);
        updatedUser.PasswordHash.Should().Be(user.PasswordHash);
    }

    [Test]
    public async Task TestUserDeletion()
    {
        var user = new User { UserName = "user_to_delete" };

        await UserRepository.Create(user);
        await UserRepository.Delete(user);

        var deletedUser = await UserRepository.GetByUserName(user.UserName);

        deletedUser.Should().BeNull();
    }
}