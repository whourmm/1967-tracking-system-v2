INSERT INTO fellow (user_id, status)
SELECT id, 'pending'
FROM "user"
WHERE role = 'fellow'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin (user_id)
SELECT id
FROM "user"
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;
