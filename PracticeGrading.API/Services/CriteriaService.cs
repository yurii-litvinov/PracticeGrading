// <copyright file="CriteriaService.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.API.Services;

using Models.DTOs;
using Models.Requests;
using System.Diagnostics.CodeAnalysis;
using Data.Entities;
using Data.Repositories;

/// <summary>
/// Service for working with criteria.
/// </summary>
/// <param name="criteriaRepository">Repository for criteia.</param>
[SuppressMessage(
    "StyleCop.CSharp.SpacingRules",
    "SA1010:Opening square brackets should be spaced correctly",
    Justification = "Causes another problem with spaces")]
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
            criteriaList = [await criteriaRepository.GetById(id.Value) ?? throw new Exception()];
        }

        var dtoList = criteriaList.Select(
                criteria => new CriteriaDto(
                    criteria.Id,
                    criteria.Name,
                    criteria.Comment,
                    (criteria.Rules ?? [])
                    .Where(rule => rule.IsScaleRule)
                    .Select(rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule))
                    .ToList(),
                    (criteria.Rules ?? [])
                    .Where(rule => !rule.IsScaleRule)
                    .Select(rule => new RuleDto(rule.Id, rule.Description, rule.Value, rule.IsScaleRule))
                    .ToList()))
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
            var criteria = await criteriaRepository.GetById((int)request.Id);
            if (criteria == null)
            {
                throw new Exception();
            }

            criteria.Name = request.Name;
            criteria.Comment = request.Comment;
            criteria.Rules?.Clear();

            foreach (var ruleRequest in request.Rules)
            {
                criteria.Rules?.Add(
                    new Rule
                    {
                        Description = ruleRequest.Description,
                        Value = ruleRequest.Value,
                        IsScaleRule = false,
                    });
            }

            foreach (var ruleRequest in request.Scale)
            {
                criteria.Rules?.Add(
                    new Rule
                    {
                        Description = ruleRequest.Description,
                        Value = ruleRequest.Value,
                        IsScaleRule = true,
                    });
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
        var criteria = await criteriaRepository.GetById(id);
        if (criteria == null)
        {
            throw new Exception();
        }

        await criteriaRepository.Delete(criteria);
    }
}