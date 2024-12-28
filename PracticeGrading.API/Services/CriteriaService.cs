// <copyright file="CriteriaService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using PracticeGrading.API.Models.DTOs;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

/// <summary>
/// Service for working with criteria.
/// </summary>
/// <param name="criteriaRepository">Repository for criteria.</param>
public class CriteriaService(CriteriaRepository criteriaRepository)
{
    /// <summary>
    /// Adds new criteria.
    /// </summary>
    /// <param name="request">Criteria creation request.</param>
    public async Task AddCriteria(CriteriaRequest request)
    {
        var criteria = new Criteria
        {
            Name = request.Name,
            Comment = request.Comment,
            Rules = request.Scale.Select(
                ruleRequest => new Rule
                {
                    Description = ruleRequest.Description,
                    Value = ruleRequest.Value,
                    IsScaleRule = true,
                }).ToList(),
        };

        foreach (var ruleRequest in request.Rules)
        {
            criteria.Rules.Add(
                new Rule
                {
                    Description = ruleRequest.Description,
                    Value = ruleRequest.Value,
                    IsScaleRule = false,
                });
        }

        await criteriaRepository.Create(criteria);
    }

    /// <summary>
    /// Gets criteria by id or all criterias.
    /// </summary>
    /// <param name="id">Criteria id.</param>
    /// <returns>List of criteria.</returns>
    public async Task<List<CriteriaDto>> GetCriteria(int? id = null)
    {
        List<Criteria> criteriaList;
        if (id == null)
        {
            criteriaList = await criteriaRepository.GetAll();
        }
        else
        {
            criteriaList =
            [
                await criteriaRepository.GetById(id.Value) ??
                throw new InvalidOperationException($"Criteria with ID {id.Value} was not found.")
            ];
        }

        var dtoList = criteriaList.Select(
                criteria => new CriteriaDto(
                    criteria.Id,
                    criteria.Name,
                    criteria.Comment,
                    (criteria.Rules ?? []).Where(rule => rule.IsScaleRule).Select(
                        rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule)).ToList(),
                    (criteria.Rules ?? []).Where(rule => !rule.IsScaleRule).Select(
                        rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule)).ToList()))
            .ToList();

        return dtoList;
    }

    /// <summary>
    /// Updates criteria.
    /// </summary>
    /// <param name="request">Criteria updating request.</param>
    public async Task UpdateCriteria(CriteriaRequest request)
    {
        if (request.Id != null)
        {
            var criteria = await criteriaRepository.GetById((int)request.Id) ??
                           throw new InvalidOperationException($"Criteria with ID {request.Id} was not found.");

            criteria.Name = request.Name;
            criteria.Comment = request.Comment;

            foreach (var scaleRequest in request.Scale)
            {
                var existingScaleRule =
                    (criteria.Rules ?? []).FirstOrDefault(rule => rule.Id == scaleRequest.Id && rule.IsScaleRule);

                if (existingScaleRule != null)
                {
                    existingScaleRule.Description = scaleRequest.Description;
                    existingScaleRule.Value = scaleRequest.Value;
                }
                else
                {
                    criteria.Rules?.Add(
                        new Rule
                        {
                            Description = scaleRequest.Description,
                            Value = scaleRequest.Value,
                            IsScaleRule = true,
                        });
                }
            }

            var scaleRulesToRemove = (criteria.Rules ?? [])
                .Where(
                    scale => scale.IsScaleRule && request.Scale.All(
                        scaleRequest => scaleRequest.Id != null && scaleRequest.Id != scale.Id))
                .ToList();

            foreach (var rule in scaleRulesToRemove)
            {
                criteria.Rules?.Remove(rule);
            }

            foreach (var ruleRequest in request.Rules)
            {
                var existingRule = (criteria.Rules ?? [])
                    .FirstOrDefault(rule => rule.Id == ruleRequest.Id && !rule.IsScaleRule);

                if (existingRule != null)
                {
                    existingRule.Description = ruleRequest.Description;
                    existingRule.Value = ruleRequest.Value;
                }
                else
                {
                    criteria.Rules?.Add(
                        new Rule
                        {
                            Description = ruleRequest.Description,
                            Value = ruleRequest.Value,
                            IsScaleRule = false,
                        });
                }
            }

            var rulesToRemove = (criteria.Rules ?? [])
                .Where(
                    rule => !rule.IsScaleRule && request.Rules.All(
                        ruleRequest => ruleRequest.Id != null && ruleRequest.Id != rule.Id))
                .ToList();

            foreach (var rule in rulesToRemove)
            {
                criteria.Rules?.Remove(rule);
            }

            await criteriaRepository.Update(criteria);
        }
    }

    /// <summary>
    /// Deletes criteria.
    /// </summary>
    /// <param name="id">Criteria id.</param>
    public async Task DeleteCriteria(int id)
    {
        var criteria = await criteriaRepository.GetById(id) ??
                       throw new InvalidOperationException($"Criteria with ID {id} was not found.");

        await criteriaRepository.Delete(criteria);
    }
}