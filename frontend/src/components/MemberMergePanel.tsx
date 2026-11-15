import { useState } from 'react';
import { Member } from '../models/Member';
import { mergeMembers, previewMemberMerge } from '../services/ApiService';

export interface MergePreview {
    version: string;
    data: {
        members: (Member & { id: number; meetingIds: number[] })[];
        marks: { id: number; memberId: number; studentWorkId: number; studentName: string; mark: number; comment?: string;
            criteria: { id: number; criteriaId: number; mark?: number; comment?: string; rules: { ruleId: number; value: number }[] }[] }[];
        accesses: { id: number; memberId: number; meetingId: number; status: number }[];
        trustedAccesses: { id: number; memberId: number; createdAt: string; revokedAt?: string }[];
    };
}

const profileFields = ['name', 'email', 'phone', 'informationRu', 'informationEn'] as const;
type ProfileField = typeof profileFields[number];

export function MemberMergePanel({ members, onRemove, onDone, onCancel, onReviewChange }: {
    members: Member[]; onRemove: (id: number) => void; onDone: () => void; onCancel: () => void; onReviewChange: (reviewing: boolean) => void;
}) {
    const [preview, setPreview] = useState<MergePreview | null>(null);
    const [targetId, setTargetId] = useState(0);
    const [profile, setProfile] = useState<Member>({ name: '' });
    const [fieldSources, setFieldSources] = useState<Partial<Record<ProfileField, string>>>({});
    const [trustedAccessId, setTrustedAccessId] = useState<number | null>(null);
    const [markChoices, setMarkChoices] = useState<Record<number, number>>({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const describeError = (e: unknown) => (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Не удалось выполнить объединение. Обновите просмотр и повторите попытку.';
    const loadPreview = async () => {
        setBusy(true); setError('');
        try {
            const result = (await previewMemberMerge(members.map(m => m.id!))).data;
            onReviewChange(true); setPreview(result); setTargetId(result.data.members[0].id);
            setFieldSources(Object.fromEntries(profileFields.map(key => [key, String(result.data.members[0].id)])));
            setProfile(result.data.members[0]); setTrustedAccessId(null); setMarkChoices({}); setConfirmed(false);
        } catch (e) { setError(describeError(e)); }
        finally { setBusy(false); }
    };
    const groups = preview ? Object.values(preview.data.marks.reduce<Record<number, MergePreview['data']['marks']>>((acc, mark) => {
        (acc[mark.studentWorkId] ??= []).push(mark); return acc;
    }, {})).filter(g => g.length > 1) : [];
    const submit = async () => {
        if (!preview) return;
        setBusy(true); setError('');
        try {
            await mergeMembers({ memberIds: members.map(m => m.id!), targetId, profile, trustedAccessId, markChoices, version: preview.version });
            onDone();
        } catch (e) { setError(describeError(e)); }
        finally { setBusy(false); }
    };
    const memberName = (id: number) => preview?.data.members.find(m => m.id === id)?.name ?? '';
    return <section className="card p-3 mb-4" aria-label="Объединение членов комиссии">
        <h2 className="h5">Объединение членов комиссии</h2>
        {!preview ? <>
            <p>Нажмите на пользователей в списке, чтобы выбрать их для объединения (от 2 до 20). Можно менять поисковый запрос.</p>
            <ul>{members.map(m => <li key={m.id}>{m.name} · ID {m.id} <button className="btn btn-link" disabled={busy} onClick={() => onRemove(m.id!)}>Убрать</button></li>)}</ul>
            <button className="btn btn-primary" disabled={busy || members.length < 2} onClick={loadPreview}>Настроить объединение</button>
        </> : <fieldset disabled={busy}>
            <label className="form-label">Сохраняемый ID
                <select aria-label="Сохраняемый ID" className="form-select" value={targetId} onChange={e => setTargetId(Number(e.target.value))}>
                    {preview.data.members.map(m => <option key={m.id} value={m.id}>{m.name} · ID {m.id}</option>)}
                </select>
            </label>
            <h3 className="h6 mt-3">Итоговый профиль</h3>
            <p>Выберите источник каждого поля и при необходимости отредактируйте значение.</p>
            {profileFields.map(key => <div className="mb-3" key={key}>
                <label className="form-label" htmlFor={`merge-${key}`}>{{ name: 'ФИО', email: 'Email', phone: 'Телефон', informationRu: 'Описание на русском', informationEn: 'Описание на английском' }[key]}</label>
                <select aria-label={`Источник ${key}`} className="form-select mb-1" value={fieldSources[key] ?? ''} onChange={e => {
                    const source = preview.data.members.find(m => m.id === Number(e.target.value));
                    if (source) {
                        setProfile(p => ({ ...p, [key]: source[key] ?? '' }));
                        setFieldSources(previous => ({ ...previous, [key]: String(source.id) }));
                    }
                }}>
                    <option value="" disabled>Изменено вручную</option>
                    {preview.data.members.map(m => <option key={m.id} value={m.id}>ID {m.id}: {m[key] || '(пусто)'}</option>)}
                </select>
                <textarea id={`merge-${key}`} className="form-control" rows={key.startsWith('information') ? 3 : 1} value={profile[key] ?? ''} onChange={e => {
                    setProfile(p => ({ ...p, [key]: e.target.value }));
                    setFieldSources(previous => ({ ...previous, [key]: '' }));
                }} />
            </div>)}
            <label className="form-label">Доверенный доступ
                <select aria-label="Доверенный доступ" className="form-select" value={trustedAccessId ?? ''} onChange={e => setTrustedAccessId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Не сохранять — отозвать все постоянные ссылки</option>
                    {preview.data.trustedAccesses.filter(a => !a.revokedAt).map(a => <option key={a.id} value={a.id}>{memberName(a.memberId)} · ID {a.memberId} · выдан {new Date(a.createdAt).toLocaleString()}</option>)}
                </select>
            </label>
            <p>Сохранится одна выбранная постоянная ссылка. Остальные перестанут работать. Перенесённым пользователям потребуется войти заново.</p>
            <h3 className="h6">Связанные данные</h3>
            <ul>{preview.data.members.map(m => <li key={m.id}>ID {m.id}: заседания {m.meetingIds.join(', ') || '—'}, оценок {preview.data.marks.filter(a => a.memberId === m.id).length}, заявок {preview.data.accesses.filter(a => a.memberId === m.id).length}</li>)}</ul>
            <p>Все заседания объединяются без повторов. Все заявки и их статусы сохраняются. Оценки без конфликтов переносятся вместе с критериями, правилами и комментариями.</p>
            {groups.map(group => <div className="mb-3" key={group[0].studentWorkId}>
                <h3 className="h6">Конфликт: {group[0].studentName} · работа {group[0].studentWorkId}</h3>
                <p>Выберите одну оценку. Остальные оценки этой работы, их критерии и комментарии будут удалены.</p>
                {group.map(mark => <div className="border rounded p-2 mb-2" key={mark.id}>
                    <label><input type="radio" name={`work-${mark.studentWorkId}`} checked={markChoices[mark.studentWorkId] === mark.id} onChange={() => setMarkChoices(p => ({ ...p, [mark.studentWorkId]: mark.id }))} /> {memberName(mark.memberId)} · ID {mark.memberId}: оценка {mark.mark}, комментарий: {mark.comment || '—'}</label>
                    <details><summary>Оценки по критериям и правила</summary><ul>{mark.criteria.map(c => <li key={c.id}>Критерий {c.criteriaId}: {c.mark ?? '—'}; {c.comment}; правила: {c.rules.map(r => `${r.ruleId} = ${r.value}`).join(', ') || '—'}</li>)}</ul></details>
                </div>)}
            </div>)}
            <p>Итог: пользователь ID {targetId}, {profile.name}. Будут удалены дубли с ID {members.filter(m => m.id !== targetId).map(m => m.id).join(', ')}.</p>
            <label className="d-block mb-3"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> Подтверждаю выбор данных и удаление дублей. Отменить объединение нельзя.</label>
            <button className="btn btn-secondary me-2" onClick={() => { onReviewChange(false); setPreview(null); }}>Назад к выбору</button>
            <button className="btn btn-danger" disabled={!confirmed || !profile.name.trim() || groups.some(g => !markChoices[g[0].studentWorkId])} onClick={submit}>Объединить в ID {targetId}</button>
        </fieldset>}
        {error && <div role="alert" className="alert alert-danger mt-3">{error}</div>}
        <button className="btn btn-link mt-2" disabled={busy} onClick={onCancel}>Закрыть объединение</button>
    </section>;
}
