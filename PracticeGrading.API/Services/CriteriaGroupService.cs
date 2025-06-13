// <copyright file="CriteriaGroupService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with criteria group.
/// </summary>
/// <param name="criteriaGroupRepository">Repository for criteria group.</param>
public class CriteriaGroupService(
    CriteriaGroupRepository criteriaGroupRepository,
    CriteriaRepository criteriaRepository)
{
    /// <summary>
    /// Adds new criteria group.
    /// </summary>
    /// <param name="request">Criteria group creation request.</param>
    public async Task AddCriteriaGroup(CriteriaGroupRequest request)
    {
        var group = new CriteriaGroup
        {
            Name = request.Name,
            MetricType = request.MetricType,
            Criteria = await this.GetCriteria(request.CriteriaId),
            MarkScales = request.MarkScales.Select(
                scaleRequest => new MarkScale
                {
                    Min = scaleRequest.Min,
                    Max = scaleRequest.Max,
                    Mark = scaleRequest.Mark,
                }).ToList(),
        };

        await criteriaGroupRepository.Create(group);
    }

    /// <summary>
    /// Gets criteria group by id or all criteria groups.
    /// </summary>
    /// <param name="id">Criteria group id.</param>
    /// <returns>List of criteria groups.</returns>
    public async Task<List<CriteriaGroupDto>> GetCriteriaGroup(int? id = null)
    {
        List<CriteriaGroup> groups;
        if (id == null)
        {
            groups = await criteriaGroupRepository.GetAll();
        }
        else
        {
            groups =
            [
                await criteriaGroupRepository.GetById(id.Value) ??
                throw new InvalidOperationException($"Criteria group with ID {id.Value} was not found.")
            ];
        }

        var dtoList = groups.Select(
                group => new CriteriaGroupDto(
                    group.Id,
                    group.Name,
                    group.MetricType,
                    group.Criteria.Select(
                        criteria => new CriteriaDto(
                            criteria.Id,
                            criteria.Name,
                            criteria.Comment,
                            (criteria.Rules ?? []).Where(rule => rule.IsScaleRule).Select(
                                rule => new RuleDto(rule.Id, rule.Type, rule.Description, rule.Value, rule.IsScaleRule))
                            .ToList(),
                            (criteria.Rules ?? []).Where(rule => !rule.IsScaleRule).Select(
                                rule => new RuleDto(rule.Id, rule.Type, rule.Description, rule.Value, rule.IsScaleRule))
                            .ToList(),
                            (criteria.CriteriaGroups ?? []).Select(criteriaGroup => criteriaGroup.Id).ToList()))
                    .ToList(),
                    (group.MarkScales ?? [])
                    .Select(scale => new MarkScaleDto(scale.Id, scale.Min, scale.Max, scale.Mark))
                    .ToList()))
            .ToList();

        return dtoList;
    }

    /// <summary>
    /// Updates criteria group.
    /// </summary>
    /// <param name="request">Criteria group updating request.</param>
    public async Task UpdateCriteriaGroup(CriteriaGroupRequest request)
    {
        if (request.Id != null)
        {
            var group = await criteriaGroupRepository.GetById((int)request.Id) ??
                        throw new InvalidOperationException($"Criteria group with ID {request.Id} was not found.");

            group.Name = request.Name;
            group.MetricType = request.MetricType;
            group.Criteria = await this.GetCriteria(request.CriteriaId);

            foreach (var scaleRequest in request.MarkScales)
            {
                var existingScale =
                    (group.MarkScales ?? []).FirstOrDefault(scale => scale.Id == scaleRequest.Id);

                if (existingScale != null)
                {
                    existingScale.Min = scaleRequest.Min;
                    existingScale.Max = scaleRequest.Max;
                    existingScale.Mark = scaleRequest.Mark;
                }
                else
                {
                    group.MarkScales?.Add(
                        new MarkScale
                        {
                            Min = scaleRequest.Min,
                            Max = scaleRequest.Max,
                            Mark = scaleRequest.Mark,
                        });
                }
            }

            var scalesToRemove = (group.MarkScales ?? [])
                .Where(
                    scale => request.MarkScales.All(
                        scaleRequest => scaleRequest.Id != null && scaleRequest.Id != scale.Id))
                .ToList();

            foreach (var scale in scalesToRemove)
            {
                group.MarkScales?.Remove(scale);
            }

            await criteriaGroupRepository.Update(group);
        }
    }

    /// <summary>
    /// Deletes criteria group.
    /// </summary>
    /// <param name="id">Criteria group id.</param>
    public async Task DeleteCriteriaGroup(int id)
    {
        var group = await criteriaGroupRepository.GetById(id) ??
                    throw new InvalidOperationException($"Criteria group with ID {id} was not found.");

        await criteriaGroupRepository.Delete(group);
    }

    private async Task<List<Criteria>> GetCriteria(List<int>? idList)
    {
        var criteria = new List<Criteria>();

        if (idList != null)
        {
            foreach (var id in idList)
            {
                criteria.Add(
                    await criteriaRepository.GetById(id) ??
                    throw new InvalidOperationException($"Criteria with ID {id} was not found."));
            }
        }

        return criteria;
    }
}