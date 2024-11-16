import React, {useRef, useState, useEffect} from 'react';
import {Criteria} from '../interfaces/Criteria'
import {Rule} from '../interfaces/Rule'

interface CriteriaModalProps {
    criteriaData: Criteria,
    onSave: (criteria: Criteria) => void,
}

export function CriteriaModal({criteriaData, onSave}: CriteriaModalProps) {
    const formRef = useRef();
    const closeButtonRef = useRef();

    const initialCriteriaState: Criteria = {
        id: null,
        name: '',
        comment: '',
        scale: [{description: '', value: 0}],
        rules: [{description: '', value: 0}]
    }
    const [criteria, setCriteria] = useState(initialCriteriaState);

    useEffect(() => {
        if (criteriaData) {
            setCriteria(criteriaData);
        } else {
            setCriteria(initialCriteriaState);
        }
    }, [criteriaData]);

    const handleChange = (e) => {
        const {name, value} = e.target;

        setCriteria((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const handleRuleChange = (
        index: number,
        field: 'description' | 'value',
        value: string | number,
        type: 'scale' | 'rules'
    ) => {
        const updatedItems = [...criteria[type]];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        }

        if (!updatedItems[index].description && updatedItems[index].value === 0) {
            updatedItems.splice(index, 1);
        }

        setCriteria((prevCriteria) => ({
            ...prevCriteria,
            [type]: updatedItems
        }));
    }

    useEffect(() => {
        const addEmptyRuleIfNeeded = (array) => {
            if (array.length === 0 || array[array.length - 1].description !== '' || array[array.length - 1].value !== 0) {
                return [...array, {description: '', value: 0}];
            }
            return array;
        }

        setCriteria((prevCriteria) => ({
            ...prevCriteria,
            scale: addEmptyRuleIfNeeded(prevCriteria.scale),
            rules: addEmptyRuleIfNeeded(prevCriteria.rules),
        }));
    }, [criteria.scale, criteria.rules]);


    const handleSave = () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        onSave(criteria);
        setCriteria(criteriaData ?? initialCriteriaState);

        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    }

    const handleClose = () => {
        setCriteria(criteriaData ?? initialCriteriaState);
    }

    return (
        <div className="modal fade" id="criteriaModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1"
             aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5 ps-4"
                            id="staticBackdropLabel">{criteriaData ? "Редактирование критерия" : "Создание критерия"}</h1>
                        <button type="button" className="btn-close" ref={closeButtonRef} data-bs-dismiss="modal"
                                aria-label="Close" onClick={handleClose}></button>
                    </div>

                    <div className="modal-body">
                        <form ref={formRef} className="px-4">
                            <div className="mb-2">
                                <label className="form-label">Название</label>
                                <input type="text" className="form-control" name="name"
                                       required value={criteria.name} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Комментарий</label>
                                <textarea type="text" className="form-control" name="comment"
                                       value={criteria.comment} onChange={handleChange}/>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Шкала оценивания</label>

                                {criteria.scale.map((rule, index) => (
                                    <div key={index} className="">
                                        <div className="d-flex align-items-center pb-3">
                                            <input
                                                type="number"
                                                className="form-control me-2"
                                                style={{maxWidth: '65px'}}
                                                value={rule.value || 0}
                                                min="0" max="5" step="1"
                                                onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value), 'scale')}
                                                placeholder="0"
                                            />
                                            <span className="me-2">—</span>
                                            <textarea
                                                type="text"
                                                className="form-control"
                                                value={rule.description}
                                                onChange={(e) => handleRuleChange(index, 'description', e.target.value, 'scale')}
                                                placeholder="Оставьте пустым, если не хотите добавлять это правило"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Дополнительные правила</label>

                                {criteria.rules.map((rule, index) => (
                                    <div key={index} className="">
                                        <div className="d-flex align-items-center pb-3">
                                            <input
                                                type="number"
                                                className="form-control me-2"
                                                style={{maxWidth: '65px'}}
                                                value={rule.value || 0}
                                                step="1"
                                                onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value), 'rules')}
                                                placeholder="0"
                                            />
                                            <textarea
                                                type="text"
                                                className="form-control"
                                                value={rule.description}
                                                onChange={(e) => handleRuleChange(index, 'description', e.target.value, 'rules')}
                                                placeholder="Оставьте пустым, если не хотите добавлять это правило"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </form>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" data-bs-dismiss="modal"
                                onClick={handleClose}>Отмена
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
