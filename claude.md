# Scheduling App Backend Reference

## Tech Stack
- **Runtime**: Node.js with ES Modules (`"type": "module"`)
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL (AWS RDS)
- **Auth**: JWT (jsonwebtoken)

## Database Connection
- Config: `app/config/db.config.js`
- Env vars: `DB_HOST`, `DB_USER`, `DB_PW`, `DB_NAME`
- Dialect: `mysql`
- Connection pool: max 5, idle 10s, acquire 30s

---

## Database Schema

### users (table: `users`)
| Column | Type | Notes |
|---|---|---|
| user_id | INTEGER | PK, auto-increment |
| fName | STRING(100) | required |
| lName | STRING(100) | required |
| email | STRING(255) | required, unique |
| phone | STRING(20) | nullable |
| is_super_admin | BOOLEAN | default: false |
| is_active | BOOLEAN | default: true |
| created_at | DATE | auto |
| updated_at | DATE | auto |

### sessions (table: `sessions`)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK, auto-increment |
| token | STRING(3000) | required |
| email | STRING | required |
| expirationDate | DATE | required |
| user_id | INTEGER | FK → users.user_id (CASCADE) |

### areas (table: `areas`)
| Column | Type | Notes |
|---|---|---|
| area_id | INTEGER | PK, auto-increment |
| area_code | STRING(20) | required, unique |
| area_name | STRING(100) | required |
| created_at | DATE | auto |

### Position (table: `Position`)
| Column | Type | Notes |
|---|---|---|
| position_id | INTEGER | PK, auto-increment |
| area_id | INTEGER | required |
| position_name | STRING | required |
| is_manager | BOOLEAN | default: false |
| created_at | DATE | default: NOW |

### PositionUser (table: `PositionUser`)
| Column | Type | Notes |
|---|---|---|
| position_user_id | INTEGER | PK, auto-increment |
| position_id | INTEGER | required |
| user_id | INTEGER | required |
| joined_at | DATE | default: NOW |
| is_active | BOOLEAN | default: true |

### shifts (table: `shifts`)
| Column | Type | Notes |
|---|---|---|
| shift_id | INTEGER | PK, auto-increment |
| schedule_id | INTEGER | required |
| position_id | INTEGER | required |
| user_id | INTEGER | nullable, FK → users.user_id (SET NULL) |
| shift_date | DATE | required |
| start_time | TIME | required |
| end_time | TIME | required |
| is_open | BOOLEAN | default: true |
| assignment_type | STRING(20) | nullable |
| status | STRING(20) | nullable |
| assigned_by | INTEGER | nullable |
| assigned_at | DATE | nullable |
| confirmed_at | DATE | nullable |
| created_by | INTEGER | required |
| created_at | DATE | auto |
| updated_at | DATE | auto |

### schedules (table: `schedules`)
| Column | Type | Notes |
|---|---|---|
| schedule_id | INTEGER | PK, auto-increment |
| area_id | INTEGER | required, FK → areas.area_id |
| start_date | DATE | required |
| end_date | DATE | required |
| created_at | DATE | auto |

### availabilities (table: `availabilities`)
| Column | Type | Notes |
|---|---|---|
| availability_id | INTEGER | PK, auto-increment |
| user_id | INTEGER | required, FK → users.user_id (CASCADE) |
| day_of_week | INTEGER | required |
| start_time | TIME | required |
| end_time | TIME | required |
| is_active | BOOLEAN | default: true |
| created_at | DATE | auto |
| updated_at | DATE | auto |

### notifications (table: `notifications`)
| Column | Type | Notes |
|---|---|---|
| notification_id | INTEGER | PK, auto-increment |
| user_id | INTEGER | required |
| type | STRING(50) | required |
| message | TEXT | required |
| related_shift_id | INTEGER | nullable |
| is_read | BOOLEAN | default: false |
| created_at | DATE | auto |

### TaskList (table: `TaskList`)
| Column | Type | Notes |
|---|---|---|
| task_id | INTEGER | PK, auto-increment |
| area_id | INTEGER | required, FK → areas.area_id (CASCADE) |
| task_name | STRING(255) | required |
| description | TEXT | nullable |
| created_at | DATE | auto |
| updated_at | DATE | auto |

### task_list_item (table: `task_list_item`)
| Column | Type | Notes |
|---|---|---|
| task_list_item_id | INTEGER | PK, auto-increment |
| task_id | INTEGER | required, FK → TaskList.task_id (CASCADE) |
| description | TEXT | nullable |
| created_at | DATE | auto |
| updated_at | DATE | auto |

### task_list_item_status (table: `task_list_item_status`)
| Column | Type | Notes |
|---|---|---|
| task_list_item_status_id | INTEGER | PK, auto-increment |
| shift_id | INTEGER | required, FK → shifts.shift_id (CASCADE) |
| task_list_item_id | INTEGER | required, FK → task_list_item.task_list_item_id (CASCADE) |
| is_completed | BOOLEAN | default: false |
| completed_at | DATE | nullable |
| created_at | DATE | auto |
| updated_at | DATE | auto |
| **Unique constraint**: (shift_id, task_list_item_id) |

### shift_task (table: `shift_task`)
| Column | Type | Notes |
|---|---|---|
| shift_task_id | INTEGER | PK, auto-increment |
| shift_id | INTEGER | required, FK → shifts.shift_id (CASCADE) |
| task_id | INTEGER | required, FK → TaskList.task_id (CASCADE) |
| created_at | DATE | auto |
| updated_at | DATE | auto |
| **Unique constraint**: (shift_id, task_id) |

---

## Key Relationships
- **User → Session**: one-to-many (CASCADE)
- **User → Availability**: one-to-many (CASCADE)
- **User → Shift**: one-to-many (SET NULL on delete)
- **Area → Schedule**: one-to-many (CASCADE)
- **Area → TaskList**: one-to-many (CASCADE)
- **TaskList → TaskListItem**: one-to-many (CASCADE)
- **TaskListItem → TaskListItemStatus**: one-to-many (CASCADE)
- **Shift → TaskListItemStatus**: one-to-many (CASCADE)
- **Shift → ShiftTask**: one-to-many (CASCADE)
- **TaskList → ShiftTask**: one-to-many (CASCADE)
- **Position** links to Area via `area_id`
- **PositionUser** links User to Position (many-to-many join table)

## Project Structure
```
app/
  config/       - db.config.js, sequelizeInstance.js, auth.config.js, logger.js
  controllers/  - CRUD controllers per model
  models/       - Sequelize model definitions + index.js (associations)
  routes/       - Express route definitions per model
server.js       - Entry point
```

## Useful SQL
```sql
-- Make a user super admin
UPDATE users SET is_super_admin = true WHERE email = 'user@example.com';

-- Check who is a manager
SELECT u.email, p.position_name, p.is_manager, a.area_code
FROM PositionUser pu
JOIN users u ON u.user_id = pu.user_id
JOIN Position p ON p.position_id = pu.position_id
JOIN areas a ON a.area_id = p.area_id
WHERE p.is_manager = true;
```
