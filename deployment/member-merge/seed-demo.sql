\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
    users integer[] := '{}';
    meetings integer[] := '{}';
    works integer[] := '{}';
    new_id integer;
    group_id integer;
    admin_id integer;
    member_mark_id integer;
    i integer;
    row_data record;
BEGIN
    IF EXISTS (SELECT 1 FROM "Users" WHERE "Email" LIKE 'merge-demo-%@example.test') THEN
        RAISE NOTICE 'Merge demo already exists; skipping creation.';
        RETURN;
    END IF;
    SELECT g."Id" INTO STRICT group_id FROM "CriteriaGroup" g
        WHERE EXISTS (SELECT 1 FROM "CriteriaCriteriaGroup" c WHERE c."CriteriaGroupsId" = g."Id")
        ORDER BY g."Id" LIMIT 1;
    SELECT "Id" INTO admin_id FROM "Users" WHERE "RoleId" = 1 ORDER BY "Id" LIMIT 1;
    FOR i IN 1..3 LOOP
        INSERT INTO "Users" ("UserName", "RoleId", "Email", "Phone", "InformationRu", "InformationEn")
        VALUES (
            CASE i WHEN 1 THEN 'Тест объединения — Иванов Иван Иванович'
                WHEN 2 THEN 'Тест объединения — Иванов И. И.'
                ELSE 'Тест объединения — ИВАНОВ Иван Иванович' END,
            2, 'merge-demo-' || i || '@example.test', '+7 (000) 000-00-0' || i,
            CASE i WHEN 1 THEN 'ТЕСТ: профессор, основное описание. Участие в заседаниях А и В.'
                WHEN 2 THEN 'ТЕСТ: заведующий кафедрой, альтернативное описание. Участие в А и Б.'
                ELSE 'ТЕСТ: эксперт отрасли, дополнительное описание. Участие в Б и В.' END,
            'TEST: profile variant ' || i)
        RETURNING "Id" INTO new_id;
        users := array_append(users, new_id);
    END LOOP;
    FOR i IN 1..3 LOOP
        INSERT INTO "Meetings" ("DateAndTime", "Auditorium", "Info", "CriteriaGroupId")
        VALUES (date_trunc('day', now()) + interval '10 hours' + (i - 1) * interval '1 day',
            'ТЕСТ-' || i,
            'ТЕСТ объединения: заседание ' || (ARRAY['А', 'Б', 'В'])[i] || '. Синтетические данные для ручной проверки.', group_id)
        RETURNING "Id" INTO new_id;
        meetings := array_append(meetings, new_id);
        INSERT INTO "StudentWork" ("StudentName", "Theme", "Supervisor", "Info", "FinalMark", "MeetingId")
        VALUES ('Тестовый студент ' || i, 'ТЕСТ объединения: работа ' || i,
            'Тестовый руководитель', 'Синтетическая работа для проверки конфликтующих оценок', '', new_id)
        RETURNING "Id" INTO new_id;
        works := array_append(works, new_id);
    END LOOP;
    INSERT INTO "StudentWork" ("StudentName", "Theme", "Supervisor", "Info", "FinalMark", "MeetingId")
    VALUES ('Тестовый студент 4', 'ТЕСТ объединения: работа без конфликта',
        'Тестовый руководитель', 'Эта оценка должна перенестись автоматически', '', meetings[3])
    RETURNING "Id" INTO new_id;
    works := array_append(works, new_id);

    INSERT INTO "MeetingUser" ("MeetingsId", "MembersId") VALUES
        (meetings[1], users[1]), (meetings[3], users[1]),
        (meetings[1], users[2]), (meetings[2], users[2]),
        (meetings[2], users[3]), (meetings[3], users[3]);

    FOR row_data IN SELECT * FROM (VALUES (1,1,3), (2,1,5), (2,2,4), (3,2,5), (1,3,3), (3,3,4), (3,4,5)) AS d(member_no, work_no, mark) LOOP
        INSERT INTO "MemberMarks" ("MemberId", "StudentWorkId", "Mark", "Comment")
        VALUES (users[row_data.member_no], works[row_data.work_no], row_data.mark,
            'ТЕСТ: вариант оценки от дубля ' || row_data.member_no || ' для работы ' || row_data.work_no)
        RETURNING "Id" INTO member_mark_id;
        INSERT INTO "CriteriaMark" ("CriteriaId", "MemberMarkId", "Mark", "Comment")
        SELECT "CriteriaId", member_mark_id, row_data.mark,
            'ТЕСТ: комментарий по критерию от дубля ' || row_data.member_no
        FROM "CriteriaCriteriaGroup" WHERE "CriteriaGroupsId" = group_id;
        INSERT INTO "SelectedRule" ("RuleId", "CriteriaMarkId", "Value")
        SELECT r."Id", c."Id", r."Value" FROM "CriteriaMark" c
        JOIN LATERAL (SELECT * FROM "Rule" r WHERE r."CriteriaId" = c."CriteriaId" ORDER BY r."Id" LIMIT 1) r ON true
        WHERE c."MemberMarkId" = member_mark_id;
    END LOOP;
    INSERT INTO "AverageCriteriaMark" ("CriteriaId", "StudentWorkId", "AverageMark")
    SELECT cm."CriteriaId", mm."StudentWorkId", round(avg(cm."Mark"), 1)
    FROM "CriteriaMark" cm JOIN "MemberMarks" mm ON mm."Id" = cm."MemberMarkId"
    WHERE mm."StudentWorkId" = ANY(works) GROUP BY cm."CriteriaId", mm."StudentWorkId";

    FOR row_data IN SELECT * FROM (VALUES
        (1,1,1), (1,3,1), (2,1,1), (2,2,1), (3,2,1), (3,3,1),
        (1,2,0), (3,1,2), (2,3,3)) AS d(member_no, meeting_no, status) LOOP
        INSERT INTO "MeetingMemberAccesses" ("MemberId", "MeetingId", "TokenHash", "Status", "CreatedAt", "StatusChangedAt", "StatusChangedByUserId")
        VALUES (users[row_data.member_no], meetings[row_data.meeting_no],
            upper(encode(sha256(convert_to('merge-demo-meeting-' || row_data.member_no || '-' || row_data.meeting_no, 'UTF8')), 'hex')),
            row_data.status, now() - interval '2 days',
            CASE WHEN row_data.status = 0 THEN null ELSE now() - interval '1 day' END,
            CASE WHEN row_data.status = 0 THEN null ELSE admin_id END);
    END LOOP;
    FOR i IN 1..3 LOOP
        INSERT INTO "TrustedMemberAccesses" ("MemberId", "TokenHash", "CreatedAt", "RevokedAt")
        VALUES (users[i], upper(encode(sha256(convert_to('merge-demo-trusted-' || i, 'UTF8')), 'hex')),
            now() - i * interval '1 day', CASE WHEN i = 3 THEN now() - interval '1 hour' ELSE null END);
    END LOOP;
    RAISE NOTICE 'Demo user IDs: %, meeting IDs: %, work IDs: %', users, meetings, works;
END $$;
COMMIT;
SELECT u."Id", u."UserName", u."Email",
    (SELECT count(*) FROM "MeetingUser" m WHERE m."MembersId" = u."Id") AS meetings,
    (SELECT count(*) FROM "MemberMarks" m WHERE m."MemberId" = u."Id") AS marks,
    (SELECT count(*) FROM "MeetingMemberAccesses" a WHERE a."MemberId" = u."Id") AS requests
FROM "Users" u WHERE u."Email" LIKE 'merge-demo-%@example.test' ORDER BY u."Id";
SELECT "Id", "Info" FROM "Meetings" WHERE "Info" LIKE 'ТЕСТ объединения:%' ORDER BY "Id";
