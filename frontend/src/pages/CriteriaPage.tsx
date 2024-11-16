import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {getCriteria, deleteCriteria, createCriteria, updateCriteria} from '../services/apiService';
import {CriteriaModal} from '../components/CriteriaModal'

export function CriteriaPage() {
    const [criteria, setCriteria] = useState([]);
    const [criteriaToEditId, setCriteriaToEditId] = useState();
    const navigate = useNavigate()

    useEffect(() => {
        getCriteria().then(response => setCriteria(response.data));
    }, []);

    const handleDeleteCriteria = async (id) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить этот критерий?');
        if (isConfirmed) {
            await deleteCriteria(id);
            getCriteria().then(response => setCriteria(response.data));
        }
    }

    const filterAndSort = (array) => {
        return array
            .filter(rule => rule.description !== '')
            .sort((a, b) => b.value - a.value);
    };

    const addOrUpdateCriteria = async (newCriteria) => {
        newCriteria.scale = filterAndSort(newCriteria.scale);
        newCriteria.rules = filterAndSort(newCriteria.rules);

        if (criteriaToEditId !== null) {
            await updateCriteria(newCriteria);
        } else {
            await createCriteria(newCriteria);
        }

        setCriteriaToEditId(null);
        getCriteria().then(response => setCriteria(response.data));
    }

    return (<>
            <div className="d-flex align-items-center justify-content-end ps-2 pb-2">
                <h1 className="me-auto">Список критериев</h1>
                <button type="button" className="btn btn-primary btn-lg" data-bs-toggle="modal"
                        data-bs-target="#criteriaModal" onClick={() => setCriteriaToEditId(null)}>
                    Добавить критерий
                </button>
            </div>

            <div className="accordion p-2" id="criteriaAccordion">
                {criteria.length === 0 ? (
                    <div className="alert alert-primary" role="alert">
                        Нет критериев для отображения.
                    </div>
                ) : (
                    criteria.map((criteria) => (
                        <div key={criteria.id} className="accordion-item">
                            <h2 className="accordion-header d-flex justify-content-between align-items-center">
                                <button className="accordion-button collapsed fs-5" type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse${criteria.id}`} aria-expanded="false"
                                        aria-controls={`collapse${criteria.id}`}>
                                    <p className="pe-1">{criteria.name} {criteria.comment && (
                                        <>
                                            <br/>
                                            <small className="fs-6"
                                                   style={{color: '#9a9d9f'}}>{criteria.comment}</small>
                                        </>
                                    )}
                                    </p>
                                </button>
                                <button type="button" className="btn btn-sm" style={{height: '40px'}}
                                        onClick={() => handleDeleteCriteria(criteria.id)}>
                                    <i className="bi bi-x-lg fs-5" style={{color: 'red'}}></i>
                                </button>
                                <button type="button" className="btn btn-sm me-3"
                                        data-bs-toggle="modal" data-bs-target="#criteriaModal"
                                        onClick={() => setCriteriaToEditId(criteria.id)}>
                                    <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
                                </button>
                            </h2>
                            <div id={`collapse${criteria.id}`} className="accordion-collapse collapse"
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

                                    <h6 className="p-2 pt-4">Дополнительные правила</h6>
                                    <ul className="list-unstyled ps-3">
                                        {criteria.rules.map((rule, index) => (
                                            <li key={index}>
                                                {rule.value > 0 ? `+${rule.value}` : rule.value} {rule.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            <CriteriaModal
                criteriaData={criteria.find(criteria => criteria.id === criteriaToEditId)}
                onSave={addOrUpdateCriteria}/>
        </>
    );
}