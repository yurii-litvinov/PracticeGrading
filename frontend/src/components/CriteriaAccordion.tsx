import {Criteria} from '../models/Criteria';
import {RuleTypes} from '../models/RuleTypes'

interface CriteriaAccordionProps {
    criteria: Criteria[];
    handleDeleteCriteria: (id: number) => void;
    setCriteriaToEditId: React.Dispatch<React.SetStateAction<number | null | undefined>>;
}

export function CriteriaAccordion({criteria, handleDeleteCriteria, setCriteriaToEditId}: CriteriaAccordionProps) {
    return (
        <>
            <div className="accordion p-2" id="criteriaAccordion">
                {criteria.length === 0 ? (
                    <div className="alert alert-primary" role="alert">
                        Нет критериев для отображения.
                    </div>
                ) : (
                    criteria.map((criteria) => (
                        <div key={criteria.id} className="accordion-item">
                            <h2 className="accordion-header d-flex justify-content-between align-items-center">
                                <button className="accordion-button collapsed fs-5"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse${criteria.id}`}
                                        aria-expanded="false"
                                        aria-controls={`collapse${criteria.id}`}>
                                    <p className="pe-1"
                                       id="criteria">{criteria.name} {criteria.comment && (
                                        <>
                                            <br/>
                                            <small className="fs-6"
                                                   style={{color: '#9a9d9f'}}>{criteria.comment}</small>
                                        </>
                                    )}
                                    </p>
                                </button>
                                <button type="button" id="delete-criteria"
                                        className="btn btn-sm btn-link"
                                        style={{height: '40px'}}
                                        onClick={() => handleDeleteCriteria(Number(criteria.id))}>
                                    <i className="bi bi-x-lg fs-5"
                                       style={{color: '#dc3545'}}></i>
                                </button>
                                <button type="button" className="btn btn-sm me-3 btn-link"
                                        data-bs-toggle="modal"
                                        data-bs-target="#criteriaModal"
                                        onClick={() => setCriteriaToEditId(criteria.id)}>
                                    <i className="bi bi-pencil fs-5"
                                       style={{color: '#007bff'}}></i>
                                </button>
                            </h2>
                            <div id={`collapse${criteria.id}`}
                                 className="accordion-collapse collapse"
                                 data-bs-parent="#criteriaAccordion">
                                <div className="accordion-body">
                                    <h6 className="p-2">Шкала оценивания</h6>
                                    <ul className="list-unstyled ps-3">
                                        {criteria.scale.map((rule, index) => (
                                            <li key={index}>
                                                {rule.value} — {rule.description}
                                            </li>
                                        ))}
                                    </ul>

                                    {criteria.rules.length !== 0 ? (<><h6 className="p-2 pt-4">Дополнительные
                                        правила</h6>
                                        <ul className="list-unstyled ps-3">
                                            {criteria.rules.map((rule, index) => (
                                                <li key={index}>
                                                    {rule.type === RuleTypes.Range ? "До " : ""}
                                                    {rule.value !== undefined && rule.value > 0 ? `+${rule.value}` : rule.value}{" "}
                                                    {rule.description.split(/(https?:\/\/\S+)/g).map((part, i) =>
                                                        part.match(/^https?:\/\//) ? (
                                                            <a key={i} href={part}
                                                               target="_blank"
                                                               rel="noopener noreferrer">
                                                                {part}
                                                            </a>
                                                        ) : (
                                                            part
                                                        )
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </>) : (<></>)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>);
}