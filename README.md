# XA Census

> Living product document — business statement, vision, data schema, and feature roadmap.
> Last updated: 2026-03-05

---

## Business Statement

Chi Alpha Campus Ministries conducts an annual census of its U.S. campus chapters (238 submitted in 2024–25). Today that process is a manual spreadsheet exchange: campus leaders fill out a 60-column Excel file, email it in, and a national administrator compiles responses. Analysis is slow, peer comparison is nearly impossible, and leaders get no feedback from the data they submit.

**XA Census replaces this workflow with a purpose-built web platform** — a structured form for campus leaders, real-time visibility for regional directors, and an analytics layer that turns raw survey data into actionable ministry intelligence.

---

## Product Vision

*Every Chi Alpha campus leader submits their annual census in a guided, section-by-section form. Regional directors see their campuses' progress in real time. National administrators can query 238 campuses' worth of data (2024–25) in plain English — and every leader gets back a benchmark showing how their campus compares to peer schools.*

---

## Users & Access Control

| Role | Access |
|------|--------|
| **Primary Chartered Leader** | Full edit access for their own campus census |
| **Regional Director** | Read-only view of all campuses in their region |
| **National Admin** | Read-only view of all campuses + export + AI query |

---

## Key Features

### 1. Census Form Wizard (Campus Leader)
- 6 structured sections; each section has a completion checkmark
- Final submit is locked until all 6 sections are complete
- Autosave — leaders can fill out the form over multiple sessions
- Read-only for anyone who is not the primary chartered leader for that campus

**Form sections:**
1. Campus Identity & Classification
2. Attendance & Engagement
3. International Students
4. Student Demographics
5. Small Groups & Leadership Pipeline
6. Staff, Missions & CMIT

### 2. Admin / Regional Dashboard
- Table view: Campus Name | Leader | Sections Complete | % | Last Updated
- Filter by Region and District
- Export to CSV
- Color-coded status (not started / in progress / submitted)

### 3. AI Query Interface *(Phase 2)*
- Natural-language questions against the full census dataset
- Examples:
  - *"Which campuses in the Southeast have less than 50% SG leader retention?"*
  - *"Show me campuses where >20% of students are international but have no international SG leaders."*
  - *"Which 10 campuses have the highest SG leader replication rate?"*
- 238 campuses in the 2024–25 dataset
- Backed by an LLM that translates to filtered queries — no SQL required

### 4. Campus Benchmark Dashboard *(Phase 2)*
- Each campus director sees how their campus stacks up against peer campuses (same school size tier, same region)
- Highlights above/below-median metrics: SG ratio, leader replication, missions participation, retreat attendance
- Turns census submission into something leaders actually want to see

---

## Data Schema

Derived from the 2024–2025 annual census spreadsheet (364 campuses).

### `CampusIdentity`
| Field | Type | Notes |
|-------|------|-------|
| `campus_name` | string | Links to `Chapter` in Project Camp |
| `leader_first_name` | string | |
| `leader_last_name` | string | |
| `region` | string | e.g., Northeast, South Central |
| `district` | string | e.g., Potomac, North Texas |
| `calendar_system` | enum | Semester / Quarter |
| `campus_classification` | enum | Public 2-yr, Public 4-yr, Private 2-yr, Private 4-yr |
| `total_student_enrollment` | enum | Range buckets (e.g., 5,001–10,000) |
| `iped_id` | string | Federal IPEDS ID — join key to `Chapter` |

### `AttendanceEngagement`
| Field | Type | Notes |
|-------|------|-------|
| `fall_retreat_attendance` | int | |
| `salt_winter_retreat_attendance` | int | |
| `fall_large_group_avg` | int | |
| `spring_large_group_avg` | int | |
| `overall_weekly_avg` | int | |

### `InternationalStudents`
| Field | Type | Notes |
|-------|------|-------|
| `intl_students_total` | int | Of total weekly attendance |
| `intl_students_small_groups` | int | |
| `intl_students_both_sg_and_lg` | int | |
| `intl_students_involved_either` | int | SG or LG or both |

### `Demographics`
Percentages of regularly involved students:
| Field | Type |
|-------|------|
| `pct_ag_background` | decimal |
| `pct_church_non_ag` | decimal |
| `pct_black_african_american` | decimal |
| `pct_asian` | decimal |
| `pct_hispanic_latino` | decimal |
| `pct_white_caucasian` | decimal |
| `pct_other` | decimal |
| `ethnicity_total` | decimal | Should sum to 100 |

### `SpiritualFormation`
| Field | Type |
|-------|------|
| `students_converted_or_recommitted` | int |
| `students_baptized_water` | int |
| `students_baptized_holy_spirit` | int |
| `students_physically_healed` | int |

### `SmallGroups`
| Field | Type | Notes |
|-------|------|-------|
| `discipleship_groups_weekly` | int | |
| `sg_leaders_start_of_year` | int | |
| `sg_leaders_end_of_year` | int | |
| `sg_leader_retention_rate` | decimal | Computed: end/start |
| `intl_sg_leaders` | int | |
| `sg_leaders_not_continuing` | int | Graduating / moving |
| `newly_trained_students` | int | |
| `newly_approved_sg_leaders` | int | |
| `sg_leader_replication_rate` | decimal | Computed |
| `projected_sg_leaders_next_year` | int | |
| `sg_members_per_leader` | decimal | Computed |

### `Staff`
| Field | Type |
|-------|------|
| `affiliated_staff_total` | int |
| `full_time_staff` | int |
| `part_time_staff` | int |
| `volunteer_staff` | int |
| `staff_who_led_sgs` | int |
| `staff_who_led_leader_resource_groups` | int |
| `students_per_ft_pt_staff` | decimal |
| `sg_leaders_per_affiliated_staff` | decimal |
| `years_director_leading` | int |

### `CMIT` (Campus Ministry Internship Training)
| Field | Type |
|-------|------|
| `has_cmit_program` | bool |
| `cmit_intern_count` | int |
| `cmit_interns_led_sgs` | int |
| `cmit_interns_preparing_agwm` | int |

### `Missions`
| Field | Type |
|-------|------|
| `us_mission_trips_count` | int |
| `students_on_us_trips` | int |
| `us_trip_destinations` | text |
| `world_mission_trips_count` | int |
| `students_on_world_trips` | int |
| `world_trip_destinations` | text |
| `world_missionaries_engaged_at_lg` | int |
| `has_annual_missions_week` | bool |

---

## Integration with Project Camp

Census data links to Project Camp's existing `Chapter` model via:
- **`iped_id`** (IPEDS federal school ID — cleanest join)
- **School name** (fuzzy match fallback)

This allows Project Camp to pull census metrics directly onto campus profiles.

---

## Tech Stack

Follows Project Camp conventions:
- **Backend:** Django (model per section, or JSON field on CensusSubmission)
- **Frontend:** React + TypeScript + Vite + Tailwind v4
- **Infra:** Heroku (same pipeline as Project Camp)
- **DB:** PostgreSQL

---

## Roadmap

| Phase | Features | Status |
|-------|----------|--------|
| **1 — Core** | Census form wizard, admin dashboard, CSV export | Planning |
| **2 — Intelligence** | AI query interface, campus benchmark dashboard | Future |
| **3 — Integration** | Embed census data in Project Camp campus profiles | Future |

---

## Questions / Open Items

- [ ] Will Census live inside Project Camp or as a standalone app?
- [ ] Auth: reuse Project Camp SSO or separate login for chapter leaders?
- [ ] Historical data: import prior years' Excel files as read-only records?
- [ ] Who owns the "submit by" deadline enforcement?

---

*This document is maintained by Levi (JNS Engineering Agent). Update it as decisions get made.*
