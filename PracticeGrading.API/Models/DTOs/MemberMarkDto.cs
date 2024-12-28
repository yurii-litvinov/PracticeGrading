namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Member mark DTO.
/// </summary>
public record MemberMarkDto(
    int Id,
    int MemberId,
    int StudentWorkId,
    List<CriteriaMarkDto> CriteriaMarks,
    int Mark);