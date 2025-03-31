import React, {useEffect} from 'react';
import {RuleTypes} from '../models/RuleTypes'

export function MemberMarkCard({role, otherMarks, otherMembers, criteria, handleDeleteMark, setMark}) {
    return (
        <>
            {otherMarks.length === 0 ? (
                <div className="alert alert-primary" role="alert">
                    Нет оценок для отображения.
                </div>
            ) : (<>
                <div className="accordion" id="marksAccordion">
                    {otherMarks.map((memberMark, index) =>
                        <div className="accordion-item" key={memberMark.memberId}>

                            <h2 className="accordion-header d-flex justify-content-between align-items-center">
                                <button className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse${memberMark.memberId}`}
                                        aria-expanded="false"
                                        aria-controls={`collapse${memberMark.memberId}`}>
                                <span
                                    className="fw-semibold me-1">{otherMembers?.find(member => member.id === memberMark.memberId)?.name}</span>
                                    оценка: {memberMark.mark}
                                </button>

                                {role === 'admin' ? (<>
                                    <button type="button" id="delete-criteria" className="btn btn-sm btn-link"
                                            style={{height: '40px'}}
                                            onClick={() => handleDeleteMark(memberMark.memberId)}>
                                        <i className="bi bi-x-lg fs-5" style={{color: 'red'}}></i>
                                    </button>
                                    <button type="button" className="btn btn-sm me-3 btn-link"
                                            data-bs-toggle="modal" data-bs-target="#markModal"
                                            onClick={() => setMark(memberMark)}>
                                        <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
                                    </button>
                                </>) : null}

                            </h2>


                            <div id={`collapse${memberMark.memberId}`}
                                 className="accordion-collapse collapse"
                                 data-bs-parent="#marksAccordion">
                                <div className="accordion-body">
                                    {criteria.map((criteria, index) => {
                                        const criteriaMark = memberMark.criteriaMarks.find(m => m.criteriaId === criteria.id);
                                        if (criteriaMark?.mark === null) return null;

                                        return (
                                            <div key={criteria.id} className="mb-2">
                                                <label className="w-auto">
                                                    <span
                                                        className="fw-semibold me-1">{index + 1}. {criteria.name}:</span>
                                                    {criteriaMark?.mark}
                                                </label>

                                                <ul className="list-unstyled ps-3 mb-1">
                                                    {criteriaMark?.selectedRules.sort((a, b) => b.value - a.value).map((selected, index) => {
                                                            const rule = criteria.scale.concat(criteria.rules)
                                                                .find(r => r.id === selected.ruleId);

                                                            return (<li key={index}>
                                                                {rule.isScaleRule ? (<>{selected.value} — {rule.description}</>)
                                                                    : (<>{selected.value} {rule.description}</>)}
                                                            </li>)
                                                        }
                                                    )}
                                                </ul>

                                                {criteriaMark?.comment ?
                                                    (<p
                                                        className="w-auto fst-italic ms-3">Комментарий: {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).comment}</p>)
                                                    : null}
                                            </div>
                                        );
                                    })}

                                    {memberMark.comment !== '' ?
                                        (<div className="w-auto fst-italic ms-3 text-wrap">
                                            <span className="fw-semibold">Общий комментарий:</span> {memberMark.comment}
                                        </div>) : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>)}
        </>);
}