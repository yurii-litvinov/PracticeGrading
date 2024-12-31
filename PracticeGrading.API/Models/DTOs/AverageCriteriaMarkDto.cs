namespace PracticeGrading.API.Models.DTOs;

/// <summary>
/// Average criteria mark DTO.
/// </summary>
public record AverageCriteriaMarkDto(
    int CriteriaId,
    double? AverageMark);