import {useRef, useState, useEffect} from 'react';
import {CriteriaGroup} from '../models/CriteriaGroup'
import {MarkScale} from '../models/MarkScale'
import {Criteria} from '../models/Criteria'
import {MetricTypes} from '../models/MetricTypes'

interface CriteriaGroupModalProps {
    groupData?: CriteriaGroup,
    criteria: Criteria[],
    onSave: (group: CriteriaGroup) => void,
}

export function CriteriaGroupModal({groupData, criteria, onSave}: CriteriaGroupModalProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    const initialMarkScales: MarkScale[] = [
        {min: undefined, max: undefined, mark: 'A'},
        {min: undefined, max: undefined, mark: 'B'},
        {min: undefined, max: undefined, mark: 'C'},
        {min: undefined, max: undefined, mark: 'D'},
        {min: undefined, max: undefined, mark: 'E'},
        {min: undefined, max: undefined, mark: 'F'}
    ]


    const initialGroupState: CriteriaGroup = {
        id: undefined,
        name: '',
        metricType: 1,
        criteria: [],
        markScales: initialMarkScales
    }
    const [group, setGroup] = useState(initialGroupState);

    useEffect(() => {
            if (groupData) {
                if (groupData.markScales.length === 0) {
                    setGroup({
                        ...groupData,
                        markScales: initialMarkScales,
                    });
                } else {
                    setGroup({
                        ...groupData,
                        markScales: groupData.markScales.sort((a, b) => (b.min ?? 0) - (a.min ?? 0))
                    })
                }
            } else {
                setGroup(initialGroupState);
            }
        }
        ,
        [groupData]
    )
    ;

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const {name, value} = e.target;

        setGroup((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const handleCriteriaChange = (checkedCriteria: Criteria) => {
        setGroup(prev => {
            const selected = prev.criteria.includes(checkedCriteria);

            return {
                ...prev,
                criteria: selected
                    ? prev.criteria.filter(criteria => criteria.id !== checkedCriteria.id)
                    : [...prev.criteria, checkedCriteria],
            };
        });
    };

    const handleScaleChange = (
        index: number,
        field: 'min' | 'max' | 'mark',
        value: undefined | string | number,
    ) => {
        let newValue = value;
        if (field !== 'mark') {
            newValue = value === '' ? undefined : Number(value);
        }
        const updatedScales = [...group.markScales];
        updatedScales[index] = {
            ...updatedScales[index],
            [field]: newValue
        }

        setGroup((prev) => ({
            ...prev,
            markScales: updatedScales
        }));
    }

    const handleScaleDelete = (index: number) => {
        setGroup((prev) => ({
            ...prev,
            markScales: prev.markScales.filter((_, i) => i !== index)
        }));
    }

    const handleAddScale = () => {
        setGroup(prev => ({
            ...prev,
            markScales: [...prev.markScales, {min: undefined, max: undefined, mark: ''}]
        }));
    };

    const handleSave = () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        onSave(group);
        setGroup(groupData ?? initialGroupState);

        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    }

    const handleClose = () => {
        setGroup(groupData ?? initialGroupState);
    }

    return (
        <div className="modal fade" id="groupModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1}
             aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5 ps-4"
                            id="staticBackdropLabel">{groupData ? "Редактирование группы критериев" : "Создание группы критериев"}</h1>
                        <button type="button" className="btn-close" ref={closeButtonRef} data-bs-dismiss="modal"
                                aria-label="Close" onClick={handleClose}></button>
                    </div>

                    <div className="modal-body">
                        <form ref={formRef} className="px-4">
                            <div className="mb-2">
                                <label className="form-label">Название</label>
                                <input type="text" className="form-control" name="name"
                                       required value={group.name} onChange={handleChange}/>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Метрика</label>
                                <div>
                                    {MetricTypes.map((type) => (
                                        <div key={type.value} className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="metricType"
                                                id={`metric-${type.value}`}
                                                value={type.value}
                                                checked={group.metricType === type.value}
                                                onChange={() => setGroup({...group, metricType: type.value})}
                                            />
                                            <label className="form-check-label" htmlFor={`metric-${type.value}`}>
                                                {type.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Таблица перевода оценок</label>

                                <div className="table-responsive" style={{maxWidth: '330px'}}>
                                    <table className="table table-light table-striped-columns mb-0">
                                        <thead>
                                        <tr>
                                            <th>Минимум</th>
                                            <th>Максимум</th>
                                            <th>Оценка</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {group.markScales.map((scale, index) => (
                                            <tr key={index}>
                                                <td><input type="number" className="form-control"
                                                           value={scale.min ?? ''}
                                                           onChange={(e) => handleScaleChange(index, 'min', e.target.value)}/>
                                                </td>
                                                <td><input type="number" className="form-control"
                                                           value={scale.max ?? ''}
                                                           onChange={(e) => handleScaleChange(index, 'max', e.target.value)}/>
                                                </td>
                                                <td><input type="text" className="form-control"
                                                           value={scale.mark}
                                                           onChange={(e) => handleScaleChange(index, 'mark', e.target.value)}/>
                                                </td>
                                                <td style={{minWidth: '95px'}}>
                                                    <button type="button" className="btn btn-sm btn-link"
                                                            onClick={() => handleScaleDelete(index)}>
                                                        <i className="bi bi-x-lg fs-5"
                                                           style={{color: '#dc3545'}}></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-center">
                                        <button type="button" className="btn btn-link btn-sm"
                                                onClick={handleAddScale}>
                                            <i className="bi bi-plus-square-fill fs-3"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Критерии</label>
                                <div>
                                    {criteria.map((criteria) => (
                                        <div key={criteria.id} className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`criteria-${criteria.id}`}
                                                checked={group.criteria.some(criterion => criterion.id === criteria.id)}
                                                onChange={() => handleCriteriaChange(criteria)}
                                            />
                                            <label className="form-check-label" htmlFor={`criteria-${criteria.id}`}>
                                                {criteria.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
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
