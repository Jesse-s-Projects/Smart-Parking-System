---
title: 'Data Dictionary'
hide_description: true
hide_button: true
compact: true
---
[Back to Main Page](index)

Document Version 1.0
---

### Universal Conventions

1. UUID for primary keys
2. TIMESTAMPTZ instead of TIMESTAMP
3. Lowercase `snake_case` for names

### Dictionary Contents

#### users

| Column | Type | Constraints | Description |
| user_id | UUID | Primary Key, generated | Unique user identifier |
| email | VARCHAR (100) | Unique | User email/login |
| password_hash | TEXT | n/a | Salted password hash |
| first_name | VARCHAR (100) | n/a | First name |
| last_name | VARCHAR (100) | n/a | Last Name |
| role | VARCHAR(20) | n/a | user or admin |
| created_at | TIMESTAMPTZ | n/a | Account creation time |
| updated_at | TIMESTAMPTZ | n/a | Time last updated |

#### vehicle

| Column | Type | Constraints | Description |
| vehicle_id | UUID | Primary Key, generated | Unique vehicle identifier |
| user_id | UUID | Foreign Key, users.user_id | Registered user |
| license_plate | VARCHAR(20) | n/a | License plate number |
| state | VARCHAR(20) | n/a | State of vehicle registration |
| make | VARCHAR(50) | n/a | Manufacturer |
| model | VARCHAR(50) | n/a | Model |
| year | SMALLINT | Between 1900 and 2100 | Model year |
| color | VARCHAR(50) | n/a | Color |
| created_at | TIMESTAMPTZ | n/a | Registration time |

#### parking_facility

| Column | Type | Constraints | Description |
| facility_id | UUID | Primary Key, generated | Unique facility identifier |
| name | VARCHAR (100) | n/a | Facility name |
| address | TEXT | n/a | Street address |
| latitude | NUMERIC(9,6) | -90 - 90 | Geographic latitude |
| longitude | NUMERIC(9,6) | -180 - 180 | Geographic longitude |
| is_active | BOOLEAN | n/a | Facility status |

#### parking_floor

| Column | Type | Constraints | Description |
| floor_id | UUID | Primary Key, generated | Unique floor identifier |
| facility_id | UUID | Foreign Key, parking_facility.facility_id | Parent facility |
| name | VARCHAR (100) | n/a | Floor name |
| floor_number | INTEGER | n/a | Floor number/level |
| map_reference | TEXT | n/a | Reference to floor map |
| is_active | BOOLEAN | n/a | Floor status |

#### parking_space

| Column | Type | Constraints | Description |
| space_id | UUID | Primary Key, generated | Unique space identifier |
| floor_id | UUID | Foreign Key, parking_floor.floor_id | Parent floor |
| space_number | VARCHAR(20) | n/a | Human-readable identifier |
| space_type | VARCHAR(20) | n/a | Type of space |
| is_active | BOOLEAN | n/a | Space usability status (Not availability) |

#### parking_session

| Column | Type | Constraints | Description |
| session_id | UUID | Primary Key, generated | Unique session identifier |
| user_id | UUID | Foreign Key, users.user_id | Session user |
| vehicle_id | UUID | Foreign Key, vehicle.vehicle_id | Session vehicle |
| space_id | UUID | Foreign Key, parking_space.space_id | Session space |
| arrival_time | TIMESTAMPTZ | n/a | Entry time |
| departure_time | TIMESTAMPTZ | n/a | Exit time |
| status | VARCHAR(20) | n/a | Session state |
| created_at | TIMESTAMPTZ | n/a | Record creation |

#### parking_rate

| Column | Type | Constraints | Description |
| rate_id | UUID | Primary Key, generated | Unique rate identifier |
| facility_id | UUID | Foreign Key, parking_facility.facility_id | Applicable facility |
| name | VARCHAR(100) | n/a | Rate description |
| hourly_rate | NUMERIC(10,2) | > 0 | Hourly price |
| effective_from | TIMESTAMPTZ | n/a | When rate begins |
| effective_until | TIMESTAMPTZ | n/a | When rate ends |
| is_active | BOOLEAN | n/a | Rate status |

#### parking_fee

| Column | Type | Constraints | Description |
| fee_id | UUID | Primary Key, generated | Unique fee identifier |
| session_id | UUID | Foreign Key, parking_session.session_id | Associated session |
| fee_type | VARCHAR(20) | n/a | Type of fee |
| amount | NUMERIC(10,2) | > 0 | Charge amount |
| description | TEXT | n/a | Additional fee information |
| created_at | TIMESTAMPTZ | n/a | Charge creation |
| created_by | UUID | Foreign Key, users.user_id | User who manually added fee |

#### feedback

| Column | Type | Constraints | Description |
| feedback_id | UUID | Primary Key, generated | Unique feedback identifier |
| user_id | UUID | Foreign Key, users.user_id | Submitting user |
| session_id | UUID | Foreign Key, parking_session.session_id | Associated session |
| rating | SMALLINT | 1-5 | Session rating |
| comments | TEXT | n/a | Written feedback |
| created_at | TIMESTAMPTZ | n/a | Submission time |

### Miscellaneous Details

* A vehicle's license plate and state combination must be unique.
* A floor number must be unique within its facility.
* A parking space number must be unique within its own floor.
* A parking space may only have up to one active parking session at a time.
* A vehicle may only have up to one active parking session at a time.
* A parking session can only have one feedback record.
* Time-related records must make sense. I.e. the departure time must be later than the arrival time.
* Monetary-related records must make sense. I.e. fees and base parking rates cannot be less than zero.
* Historical sessions, financial data, etc. should be retained rather than deleted.