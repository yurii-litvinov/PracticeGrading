using PracticeGrading.API.Integrations;
using PracticeGrading.Data.Entities;
using FluentAssertions;

namespace PracticeGrading.Tests.IntegrationsTests;

public class ScheduleParserTests : TestBase
{
    [Test]
    public void ParseVkrTest()
    {
        var expectedMeetings = GetExpectedVkrMeetings();
        var file = new FileStream(Path.Combine("TestData", "vkr_test.xlsx"), FileMode.Open, FileAccess.Read);
        var headers = new List<string> { "studentName", "theme", "supervisor", "reviewer" };
        var separator = new List<List<string>> { new() { "date" }, new() { "time, auditorium", "info" } };
        const int membersColumn = 5;

        var parser = new ScheduleParser(file, headers, separator, membersColumn);
        var meetings = parser.Parse();

        meetings.Should().BeEquivalentTo(expectedMeetings, options => options.WithStrictOrdering());
    }

    [Test]
    public void ParsePracticeTest()
    {
        var expectedMeetings = GetExpectedPracticeMeetings();
        var file = new FileStream(Path.Combine("TestData", "practice_test.xlsx"), FileMode.Open, FileAccess.Read);
        var headers = new List<string> { string.Empty, string.Empty, "studentName", "info", "theme", "supervisor" };
        var separator = new List<List<string>>
        {
            new() { string.Empty, string.Empty, "date, time, auditorium", "callLink" },
            new() { string.Empty, string.Empty, "info" }
        };
        const int membersColumn = -1;

        var parser = new ScheduleParser(file, headers, separator, membersColumn);
        var meetings = parser.Parse();

        meetings.Should().BeEquivalentTo(expectedMeetings, options => options.WithStrictOrdering());
    }

    private static IEnumerable<Meeting> GetExpectedVkrMeetings() =>
    [
        new Meeting
        {
            DateAndTime = new DateTime(2025, 5, 20, 10, 0, 0).ToUniversalTime(),
            Auditorium = "ауд. 3381",
            Info = "СП, бакалавры ПИ, ГЭК 5080-01",
            CallLink = string.Empty,
            StudentWorks = new List<StudentWork>
            {
                new()
                {
                    StudentName = "Азарников Иван Евгеньевич",
                    Theme = "Оптимизация энергопотребления Android",
                    Supervisor = "Граничин Олег Николаевич",
                    Reviewer = "Иванский Юрий Владимирович",
                    AverageCriteriaMarks = [],
                    Info = string.Empty,
                    Consultant = string.Empty
                },
                new()
                {
                    StudentName = "Винцукевич Михаил Михайлович",
                    Theme = "Разработка Jenkins библиотеки для сборки дистрибутива",
                    Supervisor = "Куликов Егор Константинович",
                    Reviewer = "Нигматулин Юрий Александрович",
                    AverageCriteriaMarks = [],
                    Info = string.Empty,
                    Consultant = string.Empty
                },
                new()
                {
                    StudentName = "Карасев Виктор Алексеевич",
                    Theme = "Гибридная генерация модульных тестов",
                    Supervisor = "Мордвинов Дмитрий Александрович",
                    Reviewer = "Степанов Даниил Сергеевич",
                    AverageCriteriaMarks = [],
                    Info = string.Empty,
                    Consultant = string.Empty
                }
            },
            Members = new List<User>
            {
                new() { UserName = "Оносовский Валентин Вадимович", RoleId = 2 },
                new() { UserName = "Бондарев Антон Владимирович", RoleId = 2 },
                new() { UserName = "Далматов Николай Александрович", RoleId = 2 },
                new() { UserName = "Иванов Дмитрий Аркадьевич", RoleId = 2 },
            },
            CriteriaGroup = null
        },

        new Meeting
        {
            DateAndTime = new DateTime(2025, 5, 20, 12, 30, 0).ToUniversalTime(),
            Auditorium = "ауд. 3381",
            Info = "Информатика, магистры матобеса, ГЭК 5665-01",
            CallLink = string.Empty,
            StudentWorks = new List<StudentWork>
            {
                new()
                {
                    StudentName = "Ершов Александр Сергеевич",
                    Theme = "Анализ и визуализация данных МРТ головного мозга",
                    Supervisor = "Косовская Татьяна Матвеевна",
                    Reviewer = "Шичкина Юлия Александровна",
                    AverageCriteriaMarks = [],
                    Info = string.Empty,
                    Consultant = string.Empty
                },
                new()
                {
                    StudentName = "Курлов Дмитрий Николаевич",
                    Theme = "Энергетический критерий. Исследование и разработка прикладной библиотеки",
                    Supervisor = "Мелас Вячеслав Борисович",
                    Reviewer = "Тимохин Дмитрий Владимирович",
                    AverageCriteriaMarks = [],
                    Info = string.Empty,
                    Consultant = string.Empty
                }
            },
            Members = new List<User>
            {
                new() { UserName = "Оносовский Валентин Вадимович", RoleId = 2 },
                new() { UserName = "Бондарев Антон Владимирович", RoleId = 2 },
                new() { UserName = "Далматов Николай Александрович", RoleId = 2 },
                new() { UserName = "Иванов Дмитрий Аркадьевич", RoleId = 2 },
            },
            CriteriaGroup = null
        }
    ];

    private static IEnumerable<Meeting> GetExpectedPracticeMeetings() =>
    [
        new Meeting
        {
            DateAndTime = new DateTime(2024, 1, 6, 12, 0, 0).ToUniversalTime(),
            Auditorium = "Teams",
            Info = "День матстатистики и вычислительной математики",
            CallLink =
                "https://teams.microsoft.com/l/meetup-join/19%3a6ef65bc0a1e148cdb946bc500d0c308a%40thread.tacv2/1736" +
                "090049678?context=%7b%22Tid%22%3a%228681a15c-23d6-4921-b30e-393b84f79d2c%22%2c%22Oid%22%3a%228db40e" +
                "18-858f-429b-8d7d-a1a5ceb666c0%22%7d",
            StudentWorks = new List<StudentWork>
            {
                new()
                {
                    StudentName = "Татьяненко Алексей Дмитриевич",
                    Theme = "Байесовский подход к обнаружению разладки",
                    Supervisor = "Гориховский В.И.",
                    Reviewer = string.Empty,
                    AverageCriteriaMarks = [],
                    Info = "4 курс ТП",
                    Consultant = string.Empty
                },
                new()
                {
                    StudentName = "Князев Дмитрий Игоревич",
                    Theme = "Параметрическое оценивание для пакета NMVM Estimation",
                    Supervisor = "Гориховский В.И.",
                    Reviewer = string.Empty,
                    AverageCriteriaMarks = [],
                    Info = "2 курс ТП",
                    Consultant = string.Empty
                }
            },
            CriteriaGroup = null
        },

        new Meeting
        {
            DateAndTime = new DateTime(2024, 1, 8, 12, 00, 0).ToUniversalTime(),
            Auditorium = "Teams",
            Info = "День low level, околокомиляторных наук и хранения данных",
            CallLink = string.Empty,
            StudentWorks = new List<StudentWork>
            {
                new()
                {
                    StudentName = "Белянин Георгий Олегович",
                    Theme =
                        "Разработка алгоритма поиска путей в графе с регулярными ограничениями при помощи операций линейной алгебры",
                    Supervisor = "С.В. Григорьев",
                    Reviewer = string.Empty,
                    AverageCriteriaMarks = [],
                    Info = "3 курс техпрога",
                    Consultant = string.Empty
                }
            },
            CriteriaGroup = null
        }
    ];
}