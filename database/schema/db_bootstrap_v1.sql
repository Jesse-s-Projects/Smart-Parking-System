-- Smart Parking System - Database schema
-- Run once against an empty smart_parking database

BEGIN;

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT, -- nullable ONLY for demo users; enforce for real authentication
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    license_plate VARCHAR(20) NOT NULL,
    state VARCHAR(20) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year SMALLINT CHECK (year BETWEEN 1900 AND 2100),
    color VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (license_plate, state)
);

CREATE TABLE parking_facility (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6) CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE parking_floor (
    floor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES parking_facility(facility_id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    floor_number INTEGER NOT NULL,
    map_reference TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (facility_id, floor_number)
);

CREATE TABLE parking_space (
    space_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES parking_floor(floor_id) ON DELETE RESTRICT,
    space_number VARCHAR(20) NOT NULL,
    space_type VARCHAR(20) NOT NULL DEFAULT 'standard'
        CHECK (space_type IN ('standard', 'accessible', 'ev', 'compact')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (floor_id, space_number)
);

CREATE TABLE parking_session (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicle(vehicle_id) ON DELETE RESTRICT,
    space_id UUID NOT NULL REFERENCES parking_space(space_id) ON DELETE RESTRICT,
    arrival_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    departure_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_session_times CHECK (
        (status = 'active' AND departure_time IS NULL)
        OR (status = 'completed' AND departure_time > arrival_time)
        OR (status = 'cancelled' AND departure_time IS NULL)
    )
);

-- Completed/cancelled sessions remain in history. Only active sessions must be unique.
CREATE UNIQUE INDEX one_active_session_per_space
    ON parking_session (space_id) WHERE status = 'active';
CREATE UNIQUE INDEX one_active_session_per_vehicle
    ON parking_session (vehicle_id) WHERE status = 'active';

COMMIT;