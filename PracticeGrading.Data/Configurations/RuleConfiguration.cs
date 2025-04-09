// <copyright file="RuleConfiguration.cs" company="Maria Myasnikova">
// Copyright (c) Maria Myasnikova. All rights reserved.
// Licensed under the Apache-2.0 license. See LICENSE file in the project root for full license information.
// </copyright>

namespace PracticeGrading.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PracticeGrading.Data.Entities;

/// <summary>
/// The class for configuration of rule entity.
/// </summary>
public class RuleConfiguration : IEntityTypeConfiguration<Rule>
{
    /// <summary>
    /// Configures rule entity.
    /// </summary>
    public void Configure(EntityTypeBuilder<Rule> builder)
    {
        builder.HasKey(rule => rule.Id);

        builder.HasData(
            new Rule
            {
                Id = 1, Type = null,
                Description = "понятное коммерческое или научное применение",
                Value = 5,
                IsScaleRule = true, CriteriaId = 1,
            },
            new Rule
            {
                Id = 2, Type = null,
                Description =
                    "сфера полезности размыта, есть сомнения в актуальности, проект чисто для получения опыта",
                Value = 3, IsScaleRule = true, CriteriaId = 1,
            },
            new Rule
            {
                Id = 3, Type = null,
                Description = "«мы в восторге от Вашей изобретательности, но поражены Вашей неосведомлённостью»",
                Value = 2, IsScaleRule = true, CriteriaId = 1,
            },
            new Rule
            {
                Id = 4, Type = null,
                Description =
                    "делалось что-то, что уже и так все умеют, не имеет смысла даже с образовательной точки зрения",
                Value = 1, IsScaleRule = true, CriteriaId = 1,
            },
            new Rule
            {
                Id = 5, Type = null, Description = "вообще не нужно", Value = 0, IsScaleRule = true, CriteriaId = 1,
            },
            new Rule
            {
                Id = 6, Type = "fixed",
                Description =
                    "за отсутствие указания достаточно узкой группы людей, кому нужна работа (для инженерных работ — конкретной компании/организации/коллектива)",
                Value = -1, IsScaleRule = false, CriteriaId = 1,
            },
            new Rule
            {
                Id = 7, Type = null,
                Description = "с нуля за полгода не воспроизвести, требует глубокого погружения и серьёзных усилий",
                Value = 5, IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 8, Type = null,
                Description =
                    "честная работа за семестр, не требуется предварительных специальных знаний, однако требуются значимые усилия",
                Value = 4, IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 9, Type = null,
                Description =
                    "в целом несложно, кажется, что средним студентом делается за месяц, или за неделю членом комиссии",
                Value = 3, IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 10, Type = null,
                Description =
                    "делается что-то понятное и довольно простое, но пришлось почитать, поразбираться, решать проблемы",
                Value = 2, IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 11, Type = null, Description = "по ощущениям, делается средним второкурсником часов за 10",
                Value = 1, IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 12, Type = null,
                Description = "уровень домашней работы первого курса или сделано просто по учебнику", Value = 0,
                IsScaleRule = true, CriteriaId = 2,
            },
            new Rule
            {
                Id = 13, Type = "range", Description = "за демонстрацию недостаточного погружения в предметную область",
                Value = -3, IsScaleRule = false, CriteriaId = 2,
            },
            new Rule
            {
                Id = 14, Type = null, Description = "по умолчанию", Value = 5, IsScaleRule = true, CriteriaId = 3,
            },
            new Rule
            {
                Id = 15, Type = "fixed", Description = "за отсутствие внятных выводов из обзора", Value = -1,
                IsScaleRule = false, CriteriaId = 3,
            },
            new Rule
            {
                Id = 16, Type = "range", Description = "за плохо оформленный текст отчёта", Value = -3,
                IsScaleRule = false, CriteriaId = 3,
            },
            new Rule
            {
                Id = 17, Type = "range", Description = "за отсутствие или некачественный обзор", Value = -4,
                IsScaleRule = false, CriteriaId = 3,
            },
            new Rule
            {
                Id = 18, Type = "range",
                Description =
                    "за отсутствие экспериментов (плана экспериментов) или апробации результата (для теоретических работ не применяется)",
                Value = -4, IsScaleRule = false, CriteriaId = 3,
            },
            new Rule
            {
                Id = 19, Type = "range",
                Description =
                    "за слабое позиционирование результатов автора относительно уже существовавших или полученных другими членами команды",
                Value = -4, IsScaleRule = false, CriteriaId = 3,
            },
            new Rule
            {
                Id = 20, Type = null,
                Description = "слайды идеальны, выступление хорошо подготовлено, ответы на вопросы чёткие и по делу",
                Value = 5, IsScaleRule = true, CriteriaId = 4,
            },
            new Rule
            {
                Id = 21, Type = "custom", Description = "за каждую минуту сверх 7 минут на выступление", Value = -1,
                IsScaleRule = false, CriteriaId = 4,
            },
            new Rule
            {
                Id = 22, Type = "fixed", Description = "за значимое количество опечаток на слайдах", Value = -1,
                IsScaleRule = false, CriteriaId = 4,
            },
            new Rule
            {
                Id = 23, Type = "fixed", Description = "за ошибки в представлении результатов экспериментов",
                Value = -1, IsScaleRule = false, CriteriaId = 4,
            },
            new Rule
            {
                Id = 24, Type = "custom",
                Description =
                    "за каждое нарушение пунктов из чеклиста по оформлению презентаций: https://docs.google.com/spreadsheets/d/1LvHveX6TdbzexuACcqGPeHIEph6cm4Hd0arCRQBqODw",
                Value = -1, IsScaleRule = false, CriteriaId = 4,
            },
            new Rule
            {
                Id = 25, Type = "range", Description = "за недостаточно подробное изложение", Value = -5,
                IsScaleRule = false, CriteriaId = 4,
            },
            new Rule
            {
                Id = 26, Type = null, Description = "по умолчанию", Value = 5, IsScaleRule = true, CriteriaId = 5,
            },
            new Rule
            {
                Id = 27, Type = "custom",
                Description =
                    "за каждый отсутствующий пункт из чеклиста по оформлению репозитория: https://github.com/yurii-litvinov/courses/blob/master/additional/repo-checklist/repo-checklist.pdf",
                Value = -1, IsScaleRule = false, CriteriaId = 5,
            });
    }
}