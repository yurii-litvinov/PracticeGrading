namespace PracticeGrading.Tests.IntegrationsTests;

using FluentAssertions;
using PracticeGrading.API.Integrations;
using PracticeGrading.API.Models.DTOs;
using PracticeGrading.Data.Entities;

public class DocumentsGeneratorTests : TestBase
{
    private static readonly object lockObject = new();

    private static volatile bool initialized = false;
    private MeetingDto meeting = null!;
    private MemberDto chairman = null!;
    private DocumentsGenerator generator = null!;
    private string templatesPath = null!;

    [SetUp]
    public async Task OneTimeSetUp()
    {
        lock (lockObject)
        {
            if (initialized)
            {
                return;
            }
            initialized = true;
        }

        await CreateDocumentTestMeeting();
        this.meeting = (await this.MeetingService.GetMeeting(1))!.FirstOrDefault()!;
        this.chairman = await this.UserService.GetMemberById(2);
        this.generator = new DocumentsGenerator(this.meeting, this.chairman, "17.12.2025 1234/1", "Георгиев Георгий Георгиевич");
        templatesPath = Path.GetFullPath(Path.Combine(
             "..", "PracticeGrading.API", "Integrations", "Templates"
        ));
    }

    [Test]
    public async Task StatementGenerateTest()
    {
        using var template = File.OpenRead(Path.Combine(templatesPath, "statement_template.docx"));
        using var expectedDocument = File.OpenRead(Path.Combine("TestData", "expected_statement.docx"));
        var (actualDocument, _) = generator.GenerateStatement("Александров Александр Александрович", template);
        actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
    }

    [Test]
    public async Task GenerateChairmanReport()
    {
        using var template = File.OpenRead(Path.Combine(templatesPath, "report_template.docx"));
        using var expectedDocument = File.OpenRead(Path.Combine("TestData", "expected_report.docx"));
        var (actualDocument, _) = generator.GenerateChairmanReport(template);
        actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
    }

    [Test]
    public async Task GenerateFinalProtocolTest()
    {
        using var template = File.OpenRead(Path.Combine(templatesPath, "final_protocol_template.docx"));
        using var expectedDocument = File.OpenRead(Path.Combine("TestData", "expected_protocol.docx"));
        var (actualDocument, _) = generator.GenerateFinalProtocol(template);
        actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
    }
    

    [Test]  
    public async Task GradingSheetGenerateTest()
    {
        var templateBytes = await File.ReadAllBytesAsync(Path.Combine(templatesPath, "grading_sheet_template.docx"));
        foreach (var member in this.meeting.Members)
        {
            var template = new MemoryStream(templateBytes);
            using var expectedDocument = File.OpenRead(Path.Combine("TestData", $"{member.Name} оценочный лист ГЭК 5080-61.docx"));
            var (actualDocument, _) = generator.GenerateGradingSheet(member, template);
            actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
        }
    }

    [Test]
    public async Task AgreementGenerateTest()
    {
        var templateBytes = await File.ReadAllBytesAsync(Path.Combine(templatesPath, "agreement_template.docx"));
        foreach (var member in this.meeting.Members)
        {
            var template = new MemoryStream(templateBytes);
            using var expectedDocument = File.OpenRead(Path.Combine("TestData", $"{member.Name} Согласие на обработку персональных данных.docx"));
            var (actualDocument, _) = generator.GenerateAgreement(member, template);
            actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
        }
    }

    [Test]
    public async Task DefenseProtocolGenerateTest()
    {
        var templateBytes = await File.ReadAllBytesAsync(Path.Combine(templatesPath, "defense_protocol_template.docx"));
        foreach (var studentWork in this.meeting.StudentWorks)
        {
            var template = new MemoryStream(templateBytes);
            using var expectedDocument = File.OpenRead(Path.Combine("TestData", $"Протокол защиты {studentWork.StudentName}.docx"));
            var (actualDocument, _) = generator.GenerateDefenseProtocol(studentWork, template);
            actualDocument.Should().BeEquivalentToDocxFile(expectedDocument);
        }
    }
    public async Task CreateDocumentTestMeeting()
    {
        List<StudentWork> studentWorks = [];
        studentWorks.Add
        (
            new StudentWork
            {
                StudentName = "Иванов Иван Иванович",
                Info = "2",
                Theme = "Практика Иванова",
                Supervisor = "Научный Руководитель Иванов",
                SupervisorInfo = "Учёная степень, учёное звание и должность научного руководителя Иванова",
                Consultant = "Консультант Иванов",
                Reviewer = "Рецензент Иванов",
                ReviewerInfo = "Учёная степень, учёное звание и должность рецензента Иванова",
                SupervisorMark = "5",
                ReviewerMark = "5",
                CodeLink = "https://github.com",
                ReportLink = "https://report.com",
                SupervisorReviewLink = "https://supervisorreview.com",
                ConsultantReviewLink = "https://consultantreview.com",
                ReviewerReviewLink = "https://reviewerreview.com",
                AdditionalLink = "https://additionalmaterials.com",
                MeetingId = 0,
                MemberMarks = new List<MemberMark>(),
                AverageCriteriaMarks = new List<AverageCriteriaMark>()
            }
        );

        studentWorks.Add
        (
            new StudentWork
            {
                StudentName = "Владимиров Владимир Владимирович",
                Info = "2",
                Theme = "Практика Владимирова",
                Supervisor = "Научный руководитель Владимиров",
                SupervisorInfo = "Учёная степень, учёное звание, должность научного руководителя Владимирова",
                Consultant = "Консультант Владимиров",
                Reviewer = "Рецензент Владимиров",
                ReviewerInfo = "Учёная степень, учёное звание, должность рецензента Владимирова",
                SupervisorMark = "5",
                ReviewerMark = "5",
                CodeLink = "https://github.com",
                ReportLink = "https://report.com",
                SupervisorReviewLink = "https://supervisorreview.com",
                ConsultantReviewLink = "https://consultantreview.com",
                ReviewerReviewLink = "https://reviewerreview.com",
                AdditionalLink = "https://additionalmaterials.com",
                MeetingId = 0,
                MemberMarks = new List<MemberMark>(),
                AverageCriteriaMarks = new List<AverageCriteriaMark>()
            }
        );


        List<User> members = [];

        members.Add
        (
            new User
            {
                UserName = "Алексеев Алексей Алексеевич",
                Email = "alekseev@gmail.com",
                Phone = "+72222222222",
                InformationRu = "информация о Алексееве Алексее Алексеевиче",
                InformationEn = "information about Alekseev Alexey Alexeyevich",
                RoleId = 2,
            }
        );

        members.Add
        (
            new User
            {
                UserName = "Романов Роман Романович",
                Email = "romanov@gmail.com",
                Phone = "+71111111111",
                InformationRu = "информация о Романове Романе Романовиче",
                InformationEn = "information about Romanov Roman Romanovich",
                RoleId = 2,
            }
        );


        var criteryGroup = (await this.CriteriaGroupRepository.GetAll())[0];



        var meeting = new Meeting
        {
            Id = 1,
            DateAndTime = new DateTime(2025, 12, 17, 14, 30, 0, DateTimeKind.Local),
            Auditorium = "3381",
            Info = "ГЭК 5080-61, 2023",
            CallLink = "https://meeting.com",
            MaterialsLink = "https://materials.com",
            StudentWorks = studentWorks,
            Members = members,
            CriteriaGroup = criteryGroup
        };

        await this.MeetingRepository.Create(meeting);
    }
}