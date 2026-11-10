-- Smart Parking System - Demo seed data
-- Run AFTER db_bootstrap_v1.sql.

BEGIN;

INSERT INTO users (user_id, email, first_name, last_name, role)
VALUES
 ('11111111-1111-4111-8111-111111111111', 'demo@parking.local', 'Demo', 'User', 'user'),
 ('66666666-6666-4666-8666-666666666666', 'admin@parking.local', 'Demo', 'Admin', 'admin')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vehicle (vehicle_id, user_id, license_plate, state, make, model, year, color)
VALUES
 ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'DEMO123', 'TX', 'Toyota', 'Camry', 2022, 'Blue'),
 ('77777777-7777-4777-8777-777777777777', '66666666-6666-4666-8666-666666666666', 'ADMIN01', 'TX', 'Honda', 'Civic', 2021, 'Gray')
ON CONFLICT (vehicle_id) DO NOTHING;

INSERT INTO parking_facility (facility_id, name, address, latitude, longitude)
VALUES ('33333333-3333-4333-8333-333333333333', 'Demo Parking Garage', '123 Demo Street, San Angelo, TX', 31.463800, -100.437000)
ON CONFLICT (facility_id) DO NOTHING;
-- Address and coordinates above are fictional demo values, not a real facility.

INSERT INTO parking_floor (floor_id, facility_id, name, floor_number)
VALUES
 ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 'Level 1', 1),
 ('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333', 'Level 2', 2)
ON CONFLICT (floor_id) DO NOTHING;

INSERT INTO parking_space (floor_id, space_number, space_type)
SELECT '44444444-4444-4444-8444-444444444444'::uuid,
       'A-' || LPAD(n::text, 2, '0'),
       CASE WHEN n = 1 THEN 'accessible' WHEN n = 2 THEN 'ev' ELSE 'standard' END
FROM generate_series(1, 8) AS n
ON CONFLICT (floor_id, space_number) DO NOTHING;

INSERT INTO parking_space (floor_id, space_number, space_type)
SELECT '55555555-5555-4555-8555-555555555555'::uuid,
       'B-' || LPAD(n::text, 2, '0'),
       CASE WHEN n = 1 THEN 'accessible' ELSE 'standard' END
FROM generate_series(1, 8) AS n
ON CONFLICT (floor_id, space_number) DO NOTHING;

COMMIT;
