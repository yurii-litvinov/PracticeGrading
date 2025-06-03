import {useEffect, useState} from 'react';
import {
    getCriteria,
    deleteCriteria,
    createCriteria,
    updateCriteria,
    getCriteriaGroup,
    createCriteriaGroup,
    updateCriteriaGroup,
    deleteCriteriaGroup
} from '../services/ApiService';
import {CriteriaModal} from '../components/CriteriaModal'
import {CriteriaGroupModal} from '../components/CriteriaGroupModal'
import {CriteriaAccordion} from '../components/CriteriaAccordion'
import {Criteria} from '../models/Criteria'
import {CriteriaGroup} from '../models/CriteriaGroup'
import {MetricTypes} from '../models/MetricTypes'

export function CriteriaPage() {
    const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>([]);
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const [criteriaToEditId, setCriteriaToEditId] = useState<number | null>();
    const [groupToEditId, setGroupToEditId] = useState<number | null>();

    const fetchCriteria = () => {
        getCriteriaGroup().then(response => setCriteriaGroups(response.data));

        getCriteria().then(response =>
            setCriteria(
                response.data.map((criteria: Criteria) => ({
                    ...criteria,
                    scale: filterAndSort(criteria.scale),
                    rules: filterAndSort(criteria.rules),
                }))
            )
        );
    }

    useEffect(() => {
        fetchCriteria();
    }, []);

    const handleDeleteCriteria = async (id: number) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить этот критерий?');
        if (isConfirmed) {
            await deleteCriteria(id);
            fetchCriteria();
        }
    }

    const handleDeleteGroup = async (id: number) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить эту группу?');
        if (isConfirmed) {
            await deleteCriteriaGroup(id);
            fetchCriteria();
        }
    }

    const filterAndSort = (array: any[]) => {
        return array
            .filter(rule => rule.description !== '')
            .sort((a, b) => b.value - a.value);
    };

    const addOrUpdateCriteria = async (newCriteria: Criteria) => {
        newCriteria.scale = filterAndSort(newCriteria.scale);
        newCriteria.rules = filterAndSort(newCriteria.rules);

        if (criteriaToEditId !== null) {
            await updateCriteria(newCriteria);
        } else {
            await createCriteria(newCriteria);
        }

        setCriteriaToEditId(null);
        fetchCriteria();
    }

    const addOrUpdateGroup = async (newGroup: CriteriaGroup) => {
        if (groupToEditId !== null) {
            await updateCriteriaGroup(newGroup);
        } else {
            await createCriteriaGroup(newGroup);
        }

        setGroupToEditId(null);
        fetchCriteria();
    }

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end ps-2 pb-2 w-100">
                <h1 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">Критерии</h1>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                            data-bs-toggle="modal" id="add-criteria"
                            data-bs-target="#criteriaModal" onClick={() => setCriteriaToEditId(null)}>
                        Создать критерий
                    </button>
                </div>
            </div>

            <div className="row pt-3">
                <div className="col-4">
                    <div className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0">Группы критериев</h5>
                            <button className="btn btn-sm btn-primary" data-bs-toggle="modal"
                                    data-bs-target="#groupModal" onClick={() => setGroupToEditId(null)}>Добавить
                            </button>
                        </div>
                        <div className="list-group" id="list-tab" role="tablist">
                            {criteriaGroups.map((group, index) => (
                                <a
                                    key={index}
                                    className={`list-group-item list-group-item-action ${index === 0 ? 'active' : ''}`}
                                    id={`list-${index}-list`}
                                    data-bs-toggle="list"
                                    href={`#list-${index}`}
                                    role="tab"
                                    aria-controls={`list-${index}`}
                                >
                                    {group.name}
                                </a>
                            ))}
                            <a
                                key={criteriaGroups.length}
                                className={`list-group-item list-group-item-action ${criteriaGroups.length === 0 ? 'active' : ''}`}
                                id={`list-${criteriaGroups.length}-list`}
                                data-bs-toggle="list"
                                href={`#list-${criteriaGroups.length}`}
                                role="tab"
                                aria-controls={`list-${criteriaGroups.length}`}
                            >
                                Все критерии
                            </a>
                        </div>
                    </div>
                </div>

                <div className="col-8">
                    <div className="tab-content" id="nav-tabContent">
                        {criteriaGroups.map((group, index) => (
                            <div
                                key={index}
                                className={`tab-pane fade ${index === 0 ? 'show active' : ''}`}
                                id={`list-${index}`}
                                role="tabpanel"
                                aria-labelledby={`list-${index}-list`}
                            >
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h4 className="card-title mb-0">{group.name}</h4>
                                            <div>
                                                <button type="button"
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        data-bs-toggle="modal" data-bs-target="#groupModal"
                                                        onClick={() => setGroupToEditId(group.id)}>Редактировать
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteGroup(Number(group.id))}>Удалить
                                                </button>
                                            </div>
                                        </div>
                                        <p className="card-text p-2 pb-0">
                                            <strong>Метрика:</strong> {MetricTypes.find(type => type.value === group.metricType)!.label}
                                        </p>

                                        {group.markScales.length !== 0 ? (<>
                                            <strong className="card-text p-2 pt-0">Таблица перевода оценок</strong>

                                            <div className="table-responsive" style={{maxWidth: '300px'}}>
                                                <table className="table table-light table-striped-columns m-2">
                                                    <thead>
                                                    <tr>
                                                        <th className="text-center">Сумма баллов</th>
                                                        <th className="text-center">Оценка</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {group.markScales.sort((a, b) =>
                                                        (b.min ?? 0) - (a.min ?? 0)).map((scale, index) => (
                                                        <tr key={index}>
                                                            <td className="text-center">{scale.min}-{scale.max}</td>
                                                            <td className="text-center">{scale.mark}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>) : (<></>)}

                                        <CriteriaAccordion
                                            criteria={group.criteria}
                                            handleDeleteCriteria={handleDeleteCriteria}
                                            setCriteriaToEditId={setCriteriaToEditId}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div
                            key={criteriaGroups.length}
                            className={`tab-pane fade ${criteriaGroups.length === 0 ? 'show active' : ''}`}
                            id={`list-${criteriaGroups.length}`}
                            role="tabpanel"
                            aria-labelledby={`list-${criteriaGroups.length}-list`}
                        >
                            <div className="card">
                                <div className="card-body">
                                    <h4 className="card-title">Все критерии</h4>
                                    <CriteriaAccordion
                                        criteria={criteria}
                                        handleDeleteCriteria={handleDeleteCriteria}
                                        setCriteriaToEditId={setCriteriaToEditId}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <CriteriaModal
                criteriaData={criteria.find(criteria => criteria.id === criteriaToEditId)}
                groups={criteriaGroups}
                onSave={addOrUpdateCriteria}/>

            <CriteriaGroupModal
                groupData={criteriaGroups.find(group => group.id === groupToEditId)}
                criteria={criteria}
                onSave={addOrUpdateGroup}/>
        </>
    );
}