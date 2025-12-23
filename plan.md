# Plan: Event System Enhancement & Dynamic Registration

This plan addresses the requirements for Admin/Member visibility, Series/Recurring events, and Customizable Registration Templates.

## Phase 1: Database Schema & Models (Backend)

- [x] **1.1 Update `Event` Model**
    - Add `visibility` field: Enum (`PUBLIC`, `PRIVATE`).
    - Add `series_id` field: UUID (to link multiple events in a series).
    - Add `template_id` field: ForeignKey to `RegistrationTemplate` (optional).
    - Add `created_by` field: Store who created the event (already exists? Need to confirm/ensure it distinguishes Admin vs Member).
- [x] **1.2 Create `RegistrationTemplate` Model**
    - Fields:
        - `id`: UUID
        - `title`: String
        - `fields_schema`: JSON (Defines the form fields: name, type, required, options).
        - `is_public`: Boolean (True = Admin created/Global, False = Private/Member created).
        - `owner_id`: ID of the creator.
- [x] **1.3 Update `Checkin` Model**
    - Add `dynamic_data` field: JSON (To store the answers to the custom questions).

## Phase 2: Backend Logic Implementation

- [x] **2.1 Event Visibility & Permissions**
    - Update `GET /events`:
        - **Admin:** Returns ALL events.
        - **Member:** Returns `PUBLIC` events + `PRIVATE` events created by themselves.
    - Update `GET /events/{id}`: Allow access if user knows the link (Private) or is owner/admin.
- [x] **2.2 Recurring Events (Series) Logic**
    - Create a utility to generate multiple `Event` objects based on parameters:
        - Start/End Date
        - Frequency (Weekly)
        - Days (e.g., Tue, Fri)
        - Time
    - Endpoint `POST /events/series`: Accepts series config and creates multiple `Event` records sharing a `series_id`.
    - Endpoint `PUT /events/{id}`: Allow editing a single instance.
- [x] **2.3 Dynamic Registration Templates**
    - Create CRUD endpoints for `RegistrationTemplate`.
    - Logic: Admins can set `is_public=True`. Members can only create `is_public=False`.
- [x] **2.4 Dynamic Check-in Handling**
    - Update `POST /checkin`:
        - Fetch the Event's Template.
        - Validate provided data against `fields_schema`.
        - Store in `dynamic_data`.

## Phase 3: Frontend Implementation

- [x] **3.1 Event Dashboard & List**
    - Update list to respect the data returned (Public vs Private).
    - Show who created the event.
- [x] **3.2 Event Creation UI (Advanced)**
    - **Visibility Toggle:** Public vs Private.
    - **Series Creator:**
        - Checkbox: "Is this a recurring event?"
        - Inputs: Date Range, Days Selection (Mon-Sun), Time.
        - Logic to preview generated dates before saving.
- [x] **3.3 Registration Template Builder**
    - UI to add/remove fields (Text, Number, Select, etc.).
    - Save as "My Template" (Private) or use "System Template" (Public, if Admin).
- [x] **3.4 Dynamic Check-in Form**
    - When user scans QR / opens Link:
        - Render form based on `fields_schema`.
        - Submit JSON data.

## Phase 4: Testing & Verification
- [x] **4.1 Verify Visibility:** Ensure Members cannot see others' private events in the list.
- [x] **4.2 Verify Series:** Create a semester course (e.g., Tue/Fri) and verify all dates appear.
- [x] **4.3 Verify Dynamic Data:** Create an event with a custom "Student ID" field, check in, and verify data is saved.