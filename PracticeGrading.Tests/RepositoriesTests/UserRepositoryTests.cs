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
        var meeting = new Meeting { Id = 15, StudentWorks = [TestWork], CriteriaGroup = TestCriteriaGroup};

        await MeetingRepository.Create(meeting);

        var user = new User
        {
            UserName = "some_user",
            MeetingId = meeting.Id,
            RoleId = 1
        };

        await UserRepository.Create(user);

        var newUser = await UserRepository.GetByUserName(user.UserName, meeting.Id);

        newUser.Should().NotBeNull();
        newUser.Role.Should().NotBeNull();
        newUser.Meeting.Should().NotBeNull();

        newUser.Role.Id.Should().Be(user.RoleId);
        newUser.Meeting.Id.Should().Be(user.MeetingId);
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