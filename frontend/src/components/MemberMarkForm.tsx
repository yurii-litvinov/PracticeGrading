import React, {useEffect} from 'react';
import {RuleTypes} from '../models/RuleTypes'

export function MemberMarkForm({role, name, criteria, isChanged, setIsChanged, mark, setMark, saveMark}) {
    const calculateMark = () => {
        setMark((prevMark) => {
            let finalMark = prevMark.criteriaMarks[0]?.mark || 0;

            prevMark.criteriaMarks.forEach((criteriaMark) => {
                if (criteriaMark.mark !== null) {
                    finalMark = Math.min(finalMark, criteriaMark.mark);
                }
            });

            return {
                ...prevMark,
                mark: finalMark
            }
        });
    }

    const handleCheckboxChange = (e, criteriaId, rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const updatedSelectedRules = [...criteriaMark.selectedRules];

                    if (e.target.checked) {
                        updatedSelectedRules.push({ruleId: rule.id, value: rule.value});
                    } else {
                        updatedSelectedRules.splice(updatedSelectedRules.findIndex(r => r.ruleId === rule.id), 1);
                    }

                    return {
                        ...criteriaMark,
                        selectedRules: updatedSelectedRules,
                        mark: updatedSelectedRules.reduce((sum, selectedRule) => sum + selectedRule.value, 0)
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks
            }
        });

        calculateMark();
        setIsChanged(true);
    }

    const handleRadioChange = (criteriaId, rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const notScaleRules = criteriaMark.selectedRules.filter(selectedRule => {
                        return criteria.find(criteria => criteria.id === criteriaId).rules.find(r => r.id === selectedRule.ruleId)
                    });

                    notScaleRules.push({ruleId: rule.id, value: rule.value})

                    return {
                        ...criteriaMark,
                        selectedRules: notScaleRules,
                        mark: notScaleRules.reduce((sum, selectedRule) => sum + selectedRule.value, 0)
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks,
            }
        });

        calculateMark();
        setIsChanged(true);
    }

    const handleInputChange = (value, criteriaId, rule) => {
        const newValue = value === '' ? undefined : Number(value);

        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const updatedSelectedRules = [...criteriaMark.selectedRules];
                    const selectedRule = updatedSelectedRules.find(r => r.ruleId === rule.id)

                    if (!selectedRule) {
                        updatedSelectedRules.push({ruleId: rule.id, value: newValue > 0 ? 0 : newValue});
                    } else {
                        selectedRule.value = newValue > 0 ? 0 : newValue;
                    }

                    return {
                        ...criteriaMark,
                        selectedRules: updatedSelectedRules,
                        mark: updatedSelectedRules.reduce((sum, selectedRule) => sum + (selectedRule.value ?? 0), 0)
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks
            }
        });

        calculateMark();
        if (newValue) {
            setIsChanged(true);
        }
    }

    const handleCommentChange = (e, criteriaId) => {
        const newComment = e.target.value;

        if (criteriaId === null) {
            setMark(prevMark => ({
                ...prevMark,
                comment: newComment
            }));
        } else {
            setMark(prevMark => {
                const updatedCriteriaMarks = prevMark.criteriaMarks.map(criteriaMark => {
                    if (criteriaMark.criteriaId === criteriaId) {
                        return {
                            ...criteriaMark,
                            comment: newComment
                        };
                    }
                    return criteriaMark;
                });

                return {
                    ...prevMark,
                    criteriaMarks: updatedCriteriaMarks
                };
            });
        }

        setIsChanged(true);
    }

    const handleMarkChange = (value) => {
        if ((value >= 1 && value <= 5) || value === '') {
            setMark(prevMark => ({
                ...prevMark,
                mark: value
            }));

            setIsChanged(true);
        }
    }

    const isRuleSelected = (criteriaId, ruleId) => {
        return mark.criteriaMarks.some((criteriaMark) =>
            criteriaMark.criteriaId === criteriaId &&
            criteriaMark.selectedRules.some((selectedRule) => selectedRule.ruleId === ruleId)
        );
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            if (role === 'member' && isChanged) {
                saveMark();
                setIsChanged(false);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [mark]);

    return (<>
        <div className="d-flex mb-2 align-items-center">
            <label className="me-1 fs-5 fw-semibold w-auto">Член комиссии:</label>
            <span className="form-control-plaintext fs-5 w-auto text-wrap">{name}</span>
        </div>

        <form>
            {criteria.map((criteria, index) => (
                <div key={criteria.id} className="mb-4">
                    <label
                        className="mb-2 fw-semibold w-auto">{index + 1}. {criteria.name} {criteria.comment && (
                        <>
                            <br/>
                            <small className="fs-6 fw-normal"
                                   style={{color: '#9a9d9f'}}>{criteria.comment}</small>
                        </>
                    )}</label>

                    <h6 className="w-auto">Шкала оценивания:</h6>
                    <div className="mb-2">
                        {criteria.scale.map((rule, ruleIndex) => (
                            <div key={rule.id} className="form-check">
                                <input className="form-check-input" type="radio" name={criteria.id}
                                       checked={isRuleSelected(criteria.id, rule.id)}
                                       onChange={() => handleRadioChange(criteria.id, rule)}></input>
                                <label>
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> — {rule.description}
                                </label>
                            </div>
                        ))}
                    </div>

                    {criteria.rules.length > 0 ? (
                        <>
                            <h6 className="w-auto">Дополнительные правила:</h6>
                            <div>
                                {criteria.rules.map((rule) => (
                                    <div key={rule.id} className="form-check">
                                        {rule.type === RuleTypes.Fixed ? (
                                            <input className="form-check-input" type="checkbox"
                                                   checked={isRuleSelected(criteria.id, rule.id)}
                                                   onChange={(e) => handleCheckboxChange(e, criteria.id, rule)}/>
                                        ) : (<></>)}

                                        <label>
                                            {rule.type === RuleTypes.Range ? "До " : ""}
                                            <span className="fw-semibold">{rule.value}</span>{" "}
                                            {rule.description.split(/(https?:\/\/\S+)/g).map((part, i) =>
                                                part.match(/^https?:\/\//) ? (
                                                    <a key={i} href={part} target="_blank"
                                                       rel="noopener noreferrer">
                                                        {part}
                                                    </a>
                                                ) : (part))}
                                        </label>

                                        {rule.type === RuleTypes.Range ? (
                                            <div className="mt-1 mb-2" style={{maxWidth: '500px'}}>
                                                <input
                                                    value={rule.value - mark.criteriaMarks.find(c => c.criteriaId === criteria.id)
                                                        ?.selectedRules.find(s => s.ruleId === rule.id)?.value ?? 0}
                                                    type="range"
                                                    className="form-range"
                                                    min={rule.value} max={0} step={1}
                                                    onChange={(e) =>
                                                        handleInputChange(rule.value - e.target.value, criteria.id, rule)}/>

                                                <div className="d-flex justify-content-between ps-2 pe-1">
                                                    {Array.from(
                                                        {length: Math.abs(rule.value) + 1},
                                                        (_, i) => (
                                                            <span key={i}>{0 - i}</span>
                                                        ))}
                                                </div>
                                            </div>) : rule.type === RuleTypes.Custom ? (
                                            <input type="number"
                                                   className="form-control w-auto mb-2"
                                                   value={mark.criteriaMarks.find(criteriaMark =>
                                                       criteriaMark.criteriaId === criteria.id)?.selectedRules
                                                       .find(selected => selected.ruleId === rule.id)?.value ?? ''}
                                                   step="1"
                                                   onChange={(e) => handleInputChange(e.target.value, criteria.id, rule)}
                                                   placeholder="0"
                                            />) : (<></>)}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}

                    <div className="my-2">
                        <h6>Комментарий:</h6>
                        <textarea type="text" className="form-control" name="comment"
                                  value={mark.criteriaMarks.find(criteriaMark => criteriaMark.criteriaId === criteria.id)?.comment || ''}
                                  onChange={(e) => handleCommentChange(e, criteria.id)}/>
                    </div>

                </div>
            ))}

            <div className="d-flex mb-2 align-items-center">
                <label className="me-2 fw-semibold fs-5 w-auto">Итоговая оценка:</label>
                <input type="number"
                       className="form-control fs-5 w-auto"
                       value={mark?.mark ?? ''}
                       min={1} max={5}
                       step="1"
                       onChange={(e) => handleMarkChange(e.target.value)}
                       placeholder="0"
                />
            </div>

            <div className="my-2">
                <h6>Общий комментарий:</h6>
                <textarea type="text" className="form-control" name="comment"
                          value={mark.comment}
                          onChange={(e) => handleCommentChange(e, null)}/>
            </div>
        </form>
    </>);
}