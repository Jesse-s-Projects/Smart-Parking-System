---
title: 'Requirements Specification'
hide_description: true
hide_button: true
compact: true
---
[Back to Main Page](index)

Document Version 1.0
---

# Functional Requirements

### REQ-01 - User Access & Roles

The system shall authenticate users and use role-based access control (RBAC) to restrict functionality.

The initial roles are:

* User - Access parking-related functionality, including parking availability, vehicle information, and active parking sessions.
* Administrator - Access administrative functionaity, reports, parking management, and system information.

Unauthorized users should not be permitted to access protected functionality.

### REQ-02 - Vehicle Management

The system shall allow vehicle information to be associated with users and parking sessions.

Vehicle informatio may include:
* License plate
* Make
* Model
* Year
* Color

Administrators shall be able to search stored vehicle information when necessary.

### REQ-03 - Entry, Exit, and Parking Sessions

The system shall maintain parking sessions representing a vehicle's use of the parking facility.

A parking session shall include applicable information such as:
* User
* Vehicle
* Parking space
* Arrival time
* Departure time
* Parking duration
* Session status

The system shall retain completed parking sessions for historical and reporting purposes.

### REQ-04 - Parking Spaces & Availability

The system shall maintain information about parking spaces within the facility.

Each space shall:
* Have a unique identifier
* Belong to a floor or parking area
* Have an availability status
* Be associated with no more than one active parking session at a time

The system shall update parking availability when spaces become occupied or available.

### REQ-05 - Parking Map

The system shall provide an interactive representation of the parking facility.

Users shall be able to:
* View different parking floors or areas
* Identify avaliable and unavailable spaces
* Select an available parking space
* Search or filter parking spaces using supported characteristics

OpenStreetMap may be used where external geographic or navigation functionality is required.

### REQ-06 - Congestion & Availability

The system shall provide users with current parking availability information.

When parking availability is limited or unavailable, the system shall notify the user.

Where sufficient information exists, the system may provide an estimated time for future parking availability.

### REQ-07 - Parking Duration & Fees

The system shall calculate and display information associated with a users's parking session, including:
* Arrival time
* Departure time, when applicable
* Elapsed parking duration
* Base parking fee
* Additional applicable fees or penalties
* Total amount

The system shall retain necessary financial information for reporting purposes.

### REQ-08 - Administrative Dashboard

Administrators shall have access to a dashboard for managing and monitoring the parking system.

The dashboard shall provide applicable information including:
* Current parking occupancy and availability
* Active parking sessions
* Vehicle and parking records
* Financial information
* User feedback
* Relevant system status information

### REQ-09 Reporting

The system shall allow administrators to generate reports using historical parking data.

Reports shall support information such as:
* Parking usage
* Occupancy
* Number of parking sessions
* Revenue
* Fees and penalties

The system shall support monthly reporting periods.

### REQ-10 User Feedback

The system shall allow users to provide feedback about their parking experience.

Feedback may include:
* A numerical rating
* Written comments
* Date and time of submission
* Associated user or parking session

Administrators shall be able to review submitted feedback.

# Non-Functional Requirements

### NFR-01 Security

The system shall follow reasonable security practices for a web application, including:
* Encrypted network communication when deployed
* Secure handling of authentication credentials
* Role-based access controls
* Server-side protection of database credentials
* Parameterized database queries to prevent SQL injection
* Application secrets shall not be committed to source control

Sensitive data shall be protected according to its level of sensitivity.

### NFR-02 Data Integrity & Reliability

The system shall maintain consistent and valid application data.

The PostgreSQL database shall use appropriate:
* Primary keys
* Foreign keys
* Unique constraints
* Data types
* Required/null constraints
* Other applicable database constraints

Operations involving related data should preserve consistency between users, vehicles, parking spaces, and parking sessions.

### NFR-03 Performance

The system shall provide reasonable response times under the expected workload of the project.

Parking availability information should reflect changes within a reasonable period after the system recieves update information.

Database queries should be designed and indexed appropriately for commonly accessed information.

### NFR-04 Usability

The application shall provide a clear and usable web interface.

User should be able to easily:
* Determine parking availability
* Navigate the parking map
* Access their parking information
* Understand errors and system messages

The application should support commonly used desktop and mobile screen sizes where practical.

### NFR-05 Maintainability

The application shall be structured and documented sufficiently to allow team members to understand, develop, test, and maintain the system.

Project source code and documentation shall be maintained using Git and Github.

Database structure and setup procedures shall be documented and reproducible between development environments.