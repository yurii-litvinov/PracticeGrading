import {ChangeEvent, useEffect} from 'react';
import {RuleTypes} from '../models/RuleTypes';
import {MemberMark} from '../models/MemberMark';
import {CriteriaGroup} from '../models/CriteriaGroup';
import {Rule} from '../models/Rule';
import {MetricTypes} from '../models/MetricTypes';

interface MemberMarkFormProps {
    role: string;
    name: string;
    criteriaGroup: CriteriaGroup;
    isChanged: boolean;
    setIsChanged: (value: boolean) => void;
    mark: MemberMark
    setMark: React.Dispatch<React.SetStateAction<MemberMark>>;
    saveMark: () => void;
}

export function MemberMarkForm({
                                   role,
                                   name,
                                   criteriaGroup,
                                   isChanged,
                                   setIsChanged,
                                   mark,
                                   setMark,
                                   saveMark
                               }: MemberMarkFormProps) {
    const calculateMark = () => {
        setMark((prevMark) => {
            let finalMark = 0;
            if (criteriaGroup.metricType === MetricTypes[0].value) {
                finalMark = Infinity;
            }

            prevMark.criteriaMarks.forEach((criteriaMark) => {
                if (criteriaMark.mark != null) {
                    if (criteriaGroup.metricType === MetricTypes[0].value) {
                        finalMark = Math.min(finalMark, criteriaMark.mark!);
                    } else if (criteriaGroup.metricType === MetricTypes[1].value) {
                        finalMark += criteriaMark.mark!;
                    }
                }
            });

            return {
                ...prevMark,
                mark: finalMark
            }
        });
    }

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, criteriaId: any, rule: Rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const updatedSelectedRules = [...criteriaMark.selectedRules];

                    if (e.target.checked) {
                        updatedSelectedRules.push({ruleId: rule.id!, value: rule.value});
                    } else {
                        updatedSelectedRules.splice(updatedSelectedRules.findIndex(r => r.ruleId === rule.id), 1);
                    }

                    return {
                        ...criteriaMark,
                        selectedRules: updatedSelectedRules,
                        mark: updatedSelectedRules.reduce((sum, selectedRule) => sum + selectedRule.value!, 0)
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

    const handleRadioChange = (criteriaId: any, rule: Rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const notScaleRules = criteriaMark.selectedRules.filter((selectedRule: { ruleId: any; }) => {
                        return criteriaGroup.criteria.find(criteria => criteria.id === criteriaId)?.rules.find((rule) => rule.id === selectedRule.ruleId)
                    });

                    notScaleRules.push({ruleId: rule.id!, value: rule.value})

                    return {
                        ...criteriaMark,
                        selectedRules: notScaleRules,
                        mark: notScaleRules.reduce((sum: number, selectedRule: { value?: number; }) =>
                            sum + selectedRule.value!, 0)
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

    const handleInputChange = (value: string | number, criteriaId: any, rule: Rule) => {
        const newValue = value === '' ? undefined : Number(value);

        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const updatedSelectedRules = [...criteriaMark.selectedRules];
                    const selectedRule = updatedSelectedRules.find(r => r.ruleId === rule.id)

                    if (!selectedRule) {
                        updatedSelectedRules.push({
                            ruleId: rule.id!, value: newValue 
                        });
                    } else {
                        selectedRule.value = newValue;
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

    const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>, criteriaId: number | null) => {
        const newComment = e.target.value;

        if (criteriaId === null) {
            setMark((prevMark) => ({
                ...prevMark,
                comment: newComment
            }));
        } else {
            setMark((prevMark) => {
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

    const handleMarkChange = (value: string | number) => {
        if (value === '') {
            setMark((prevMark) => ({
                ...prevMark,
                mark: undefined
            }));
        } else {
            const mark = Number(value);
            if (mark >= 1) {
                setMark((prevMark) => ({
                    ...prevMark,
                    mark: mark
                }));

                setIsChanged(true);
            }
        }
    }

    const isRuleSelected = (criteriaId: any, ruleId: any) => {
        return mark.criteriaMarks?.some((criteriaMark) =>
            criteriaMark.criteriaId === criteriaId &&
            criteriaMark.selectedRules.some((selectedRule: { ruleId: any; }) => selectedRule.ruleId === ruleId)
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
            {criteriaGroup?.criteria.map((criteria, index) => (
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
                        {criteria.scale.map((rule) => (
                            <div key={rule.id} className="form-check">
                                <input className="form-check-input" type="radio" name={String(criteria.id)}
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
                                            {rule.description.split(/(https?:\/\/\S+)/g).map((part: string, i: number) =>
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
                                                    value={rule.value! - (mark.criteriaMarks.find(c => c.criteriaId === criteria.id)
                                                        ?.selectedRules.find((selected: {
                                                            ruleId: any;
                                                        }) => selected.ruleId === rule.id)?.value ?? 0)}
                                                    type="range"
                                                    className="form-range"
                                                    min={rule.value} max={0} step={1}
                                                    onChange={(e) =>
                                                        handleInputChange(rule.value! - Number(e.target.value), criteria.id, rule)}/>

                                                <div className="d-flex justify-content-between ps-2 pe-1">
                                                    {Array.from(
                                                        {length: Math.abs(rule.value!) + 1},
                                                        (_, i) => (
                                                            <span key={i}>{0 - i}</span>
                                                        ))}
                                                </div>
                                            </div>) : rule.type === RuleTypes.Custom ? (
                                            <input type="number"
                                                   className="form-control w-auto mb-2"
                                                   value={mark.criteriaMarks.find(criteriaMark =>
                                                       criteriaMark.criteriaId === criteria.id)?.selectedRules
                                                       .find((selected: {
                                                           ruleId: any;
                                                       }) => selected.ruleId === rule.id)?.value ?? ''}
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
                        <textarea className="form-control" name="comment"
                                  value={mark.criteriaMarks?.find(criteriaMark => criteriaMark.criteriaId === criteria.id)?.comment || ''}
                                  onChange={(e) => handleCommentChange(e, criteria.id!)}/>
                    </div>

                </div>
            ))}

            <div className="d-flex flex-column flex-md-row mb-2 align-items-start justify-content-between">
                <div className="d-flex align-items-center">
                    <label className="me-2 fw-semibold fs-5 w-auto">Итоговая оценка:</label>
                    <input
                        type="number"
                        className="form-control fs-5 w-auto"
                        value={mark?.mark ?? ''}
                        min={1}
                        step="1"
                        onChange={(e) => handleMarkChange(e.target.value)}
                        placeholder="0"
                    />
                </div>

                {criteriaGroup?.markScales.length ?
                    (<div className="position-relative pt-1" style={{maxWidth: '320px'}}>
                        <button
                            className="btn btn-link"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseScaleTable"
                            aria-expanded="false"
                            aria-controls="collapseScaleTable"
                        >
                            <h5>Таблица перевода оценок</h5>
                        </button>

                        <div className="collapse mt-2" id="collapseScaleTable">

                            <div className="table-responsive">
                                <table className="table table-light table-striped-columns mb-0">
                                    <thead>
                                    <tr>
                                        <th className="text-center">Сумма баллов</th>
                                        <th className="text-center">Оценка</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {criteriaGroup.markScales
                                        .sort((a, b) => (b.min ?? 0) - (a.min ?? 0))
                                        .map((scale, index) => (
                                            <tr key={index}>
                                                <td className="text-center">
                                                    {scale.min}-{scale.max}
                                                </td>
                                                <td className="text-center">{scale.mark}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>) : (<></>)}
            </div>

            <div className="my-2">
                <h6>Общий комментарий:</h6>
                <textarea className="form-control" name="comment"
                          value={mark.comment}
                          onChange={(e) => handleCommentChange(e, null)}/>
            </div>
        </form>
    </>)
        ;
}