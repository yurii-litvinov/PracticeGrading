import {useRef, useState, useEffect} from 'react';
import {Criteria} from '../models/Criteria'
import {Rule} from '../models/Rule'
import {RuleTypes} from '../models/RuleTypes'

/**
 * Interface for criteria modal props.
 *
 * @param criteriaData - Criteria to edit
 * @param onSave - Save criteria function
 */
interface CriteriaModalProps {
    criteriaData?: Criteria,
    onSave: (criteria: Criteria) => void,
}

export function CriteriaModal({criteriaData, onSave}: CriteriaModalProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const [typeChange, setTypeChange] = useState(false);

    const initialCriteriaState: Criteria = {
        id: undefined,
        name: '',
        comment: '',
        scale: [{type: undefined, description: '', value: undefined, isScaleRule: true}],
        rules: [{type: RuleTypes.Fixed, description: '', value: undefined, isScaleRule: false}]
    }
    const [criteria, setCriteria] = useState(initialCriteriaState);

    useEffect(() => {
        if (criteriaData) {
            setCriteria(criteriaData);
        } else {
            setCriteria(initialCriteriaState);
        }
    }, [criteriaData]);

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const {name, value} = e.target;

        setCriteria((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const handleRuleChange = (
        index: number,
        field: 'type' | 'description' | 'value',
        value: undefined | string | number,
        type: 'scale' | 'rules'
    ) => {
        if (field === 'type') {
            setTypeChange(true)
        }

        const updatedItems = [...criteria[type]];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        }

        if (field !== 'type' && !updatedItems[index].description && !updatedItems[index].value) {
            updatedItems.splice(index, 1);
        }

        setCriteria((prevCriteria) => ({
            ...prevCriteria,
            [type]: updatedItems
        }));
    }

    useEffect(() => {
        if (typeChange) {
            setTypeChange(false)
        } else {
            const addEmptyRuleIfNeeded = (array: Rule[], isScale: boolean) =>
                (array.length === 0 || array[array.length - 1].description || array[array.length - 1].value !== undefined)
                    ? [...array, isScale
                        ? {description: '', value: undefined, isScaleRule: isScale}
                        : {type: RuleTypes.Fixed, description: '', value: undefined, isScaleRule: isScale}]
                    : array;

            setCriteria((prevCriteria) => ({
                ...prevCriteria,
                scale: addEmptyRuleIfNeeded(prevCriteria.scale, true),
                rules: addEmptyRuleIfNeeded(prevCriteria.rules, false),
            }));
        }
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
        <div className="modal fade" id="criteriaModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1}
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
                                <textarea className="form-control" name="comment"
                                          value={criteria.comment} onChange={handleChange}/>
                            </div>

                            <div className="mb-2">
                                <h6 className="form-label">Шкала оценивания</h6>

                                {criteria.scale.map((rule, index) => (
                                    <div key={index} className="">
                                        <div className="d-flex align-items-center pb-3">
                                            <input
                                                type="number"
                                                className="form-control me-2"
                                                style={{maxWidth: '65px'}}
                                                value={rule.value ?? ''}
                                                min="0" max="5" step="1"
                                                onChange={(e) => handleRuleChange(
                                                    index,
                                                    'value',
                                                    e.target.value === '' ? undefined : Number(e.target.value),
                                                    'scale')}
                                                placeholder="0"
                                            />
                                            <span className="me-2">—</span>
                                            <textarea
                                                className="form-control"
                                                value={rule.description}
                                                onChange={(e) =>
                                                    handleRuleChange(index, 'description', e.target.value, 'scale')}
                                                placeholder="Оставьте пустым, если не хотите добавлять это правило"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-2">
                                <h6 className="form-label">Дополнительные правила</h6>

                                {criteria.rules.map((rule, index) => (
                                    <div key={index} className="">

                                        <label className="form-label me-3">Тип правила:</label>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio"
                                                   checked={rule.type === RuleTypes.Fixed}
                                                   id="fixed"
                                                   onChange={() =>
                                                       handleRuleChange(index, 'type', RuleTypes.Fixed, 'rules')}/>
                                            <label className="form-check-label" htmlFor="fixed">Фиксированное
                                                число</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio"
                                                   checked={rule.type === RuleTypes.Range}
                                                   id="range"
                                                   onChange={() =>
                                                       handleRuleChange(index, 'type', RuleTypes.Range, 'rules')}/>
                                            <label className="form-check-label" htmlFor="range">Диапазон</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio"
                                                   checked={rule.type === RuleTypes.Custom}
                                                   id="custom"
                                                   onChange={() =>
                                                       handleRuleChange(index, 'type', RuleTypes.Custom, 'rules')}/>
                                            <label className="form-check-label" htmlFor="custom">Произвольное
                                                число</label>
                                        </div>

                                        <div className="d-flex align-items-center pb-3">
                                            {rule.type !== RuleTypes.Range ? (<></>) : (
                                                <label className="me-2">До</label>)}
                                            <input
                                                type="number"
                                                className="form-control me-2"
                                                style={{maxWidth: '65px'}}
                                                value={rule.value ?? ''}
                                                step="1"
                                                onChange={(e) => handleRuleChange(
                                                    index,
                                                    'value',
                                                    e.target.value === '' ? undefined : Number(e.target.value),
                                                    'rules')}
                                                placeholder="0"
                                            />
                                            <textarea
                                                className="form-control"
                                                value={rule.description}
                                                onChange={(e) =>
                                                    handleRuleChange(index, 'description', e.target.value, 'rules')}
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
                        <button type="button" id="save-criteria" className="btn btn-primary"
                                onClick={handleSave}>Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
