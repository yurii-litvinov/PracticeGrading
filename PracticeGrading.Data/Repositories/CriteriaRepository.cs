// <copyright file="CriteriaRepository.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using PracticeGrading.Data.Entities;

/// <summary>
/// Сlass for interacting with the critetia entity.
/// </summary>
/// <param name="context"> Database context.</param>
public class CriteriaRepository(AppDbContext context)
{
    /// <summary>
    /// Creates new criteria.
    /// </summary>
    /// <param name="criteria">New criteria.</param>
    public async Task Create(Criteria criteria)
    {
        await context.Criteria.AddAsync(criteria);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Updates criteria.
    /// </summary>
    /// <param name="criteria">Criteria to update.</param>
    public async Task Update(Criteria criteria)
    {
        context.Criteria.Update(criteria);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Gets criteria by id.
    /// </summary>
    /// <param name="id">Criteria id.</param>
    /// <returns>Criteria.</returns>
    public async Task<Criteria?> GetById(int id) =>
        await context.Criteria.Include(criteria => criteria.Rules).FirstOrDefaultAsync(criteria => criteria.Id == id);

    /// <summary>
    /// Gets all criteria.
    /// </summary>
    /// <returns>List of criteria.</returns>
    public async Task<List<Criteria>> GetAll() =>
        await context.Criteria.Include(criteria => criteria.Rules).ToListAsync();

    /// <summary>
    /// Deletes criteria.
    /// </summary>
    /// <param name="criteria">Criteria to delete.</param>
    public async Task Delete(Criteria criteria)
    {
        context.Criteria.Remove(criteria);
        await context.SaveChangesAsync();
    }
}