# Slack Kudos App - Design Discussion & Deliverables

## Executive Summary

This document outlines the design approach, gaps, and deliverables for aligning the current Slack Kudos Bot implementation with the PRD requirements. The current implementation provides a solid foundation but requires significant enhancements to meet all PRD requirements.

---

## 1. Gap Analysis: Current vs PRD Requirements

### ✅ Already Implemented
- `/kudos` slash command with interactive modal
- Send kudos via DM and/or channel
- Database storage (SQLite/PostgreSQL)
- Web dashboard for viewing kudos
- Basic statistics and leaderboard
- REST API endpoints

### ❌ Missing Critical Features

#### 1.1 Manager Notifications
- **Current**: No manager awareness
- **PRD Requirement**: Notify both recipient's manager and sender's manager via DM
- **Impact**: HIGH - Core visibility requirement for managers

#### 1.2 Visibility/Privacy System
- **Current**: All kudos are treated the same
- **PRD Requirement**: Private vs Public distinction with different visibility rules
- **Impact**: HIGH - Privacy and trust requirement

#### 1.3 Manager Hierarchy Integration
- **Current**: No manager relationship awareness
- **PRD Requirement**: Use Slack APIs to determine manager relationships
- **Impact**: HIGH - Required for manager notifications and views

#### 1.4 Slack Shortcuts
- **Current**: Only slash command
- **PRD Requirement**: Message action and global shortcuts
- **Impact**: MEDIUM - Improves UX but not critical

#### 1.5 Slack Home Tab
- **Current**: Web dashboard only
- **PRD Requirement**: Public Kudos feed in Slack Home tab
- **Impact**: MEDIUM - Better Slack integration

#### 1.6 Manager Dashboard
- **Current**: No manager-specific views
- **PRD Requirement**: Managers can view all Kudos from/to their direct reports
- **Impact**: HIGH - Manager visibility requirement

#### 1.7 Multiple Recipients
- **Current**: Single recipient only
- **PRD Requirement**: Allow sending to multiple recipients (open question)
- **Impact**: LOW - Nice to have, pending decision

#### 1.8 Categories
- **Current**: No categorization
- **PRD Requirement**: Optional categories (TBD)
- **Impact**: LOW - Pending decision

---

## 2. Design Decisions Needed

### 2.1 Manager Hierarchy Detection

**Question**: How do we determine manager relationships?

**Options**:
1. **Slack User Profile Fields** (Recommended for v1)
   - Use `user.profile.fields` if custom field exists
   - Pros: Simple, no additional API calls
   - Cons: Requires workspace to configure custom profile fields
   
2. **Slack Enterprise Grid API** (If available)
   - Use `users.info` with `include_locale` and check for manager field
   - Pros: Native Slack data
   - Cons: Only available in Enterprise Grid workspaces
   
3. **Manual Configuration** (Fallback)
   - Store manager relationships in database
   - Admin endpoint to set manager relationships
   - Pros: Works everywhere
   - Cons: Requires maintenance

**Recommendation**: Start with Option 1 (profile fields), fallback to Option 3. Check if `user.profile.fields` contains manager info, otherwise provide admin endpoint.

### 2.2 Visibility Implementation

**Question**: How should private vs public be implemented?

**Design**:
- Add `visibility` field to database: `'private'` | `'public'`
- Private Kudos:
  - Only visible to: sender, recipient, sender's manager, recipient's manager
  - Never appear in public feeds or channels
  - Stored with `visibility = 'private'`
- Public Kudos:
  - Visible to everyone
  - Can appear in public feeds and channels
  - Stored with `visibility = 'public'`
- Default: **Private** (safer default)

**UI in Modal**:
- Radio buttons or toggle: "Private" (default) vs "Public"
- Clear explanation of who can see each type

### 2.3 Manager Notification Format

**Question**: What should manager notifications look like?

**Proposed Format**:
```
🎉 Kudos Notification

*Recipient:* @Jane Smith
*From:* @John Doe
*Visibility:* Private/Public

*Message:*
Great work on the project!

---
This Kudos was sent to one of your direct reports.
```

**Considerations**:
- Should include link to view in manager dashboard?
- Should notifications be batched (daily digest) or immediate?
- **Recommendation**: Immediate notifications for v1, digest as future enhancement

### 2.4 Multiple Recipients

**Question**: Should we support multiple recipients in v1?

**Recommendation**: **NO for v1**
- Adds complexity to UI (multi-select)
- Complicates manager notifications (multiple managers)
- Can be added in v2 if needed
- Workaround: Users can send multiple Kudos

### 2.5 Categories

**Question**: Should categories be included in v1?

**Recommendation**: **NO for v1**
- PRD marks as "TBD" and "optional"
- Adds UI complexity
- Can be added later without breaking changes
- Focus on core functionality first

### 2.6 Abuse Prevention

**Question**: Should we implement limits or spam prevention?

**Recommendation**: **Basic limits for v1**
- Rate limiting: Max 10 Kudos per user per hour (configurable)
- Prevent self-kudos (validation)
- Store rate limit data in memory/cache (Redis optional for v2)

---

## 3. Architecture & Technical Design

### 3.1 Database Schema Changes

**New Fields Needed**:
```sql
ALTER TABLE kudos ADD COLUMN visibility TEXT DEFAULT 'private'; -- 'private' | 'public'
ALTER TABLE kudos ADD COLUMN category TEXT; -- Optional, for future use
```

**New Table for Manager Relationships** (if manual config needed):
```sql
CREATE TABLE manager_relationships (
  user_id TEXT PRIMARY KEY,
  manager_id TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**New Indexes**:
```sql
CREATE INDEX idx_visibility ON kudos(visibility);
CREATE INDEX idx_visibility_created ON kudos(visibility, created_at);
```

### 3.2 Slack API Integration Points

**New Slack Features to Implement**:

1. **Shortcuts**:
   - Global shortcut: `kudos_shortcut` (opens modal from anywhere)
   - Message action: `kudos_from_message` (pre-fill message from selected Slack message)

2. **Home Tab**:
   - Use `app.home` to create public Kudos feed
   - Show recent public Kudos with filtering

3. **Manager Detection**:
   - Function to get manager for a user
   - Cache manager relationships to reduce API calls

### 3.3 Code Structure Changes

**New Files Needed**:
```
slack_kudos_app/
├── utils/
│   ├── manager.js          # Manager hierarchy detection
│   └── rateLimiter.js      # Abuse prevention
├── handlers/
│   ├── shortcuts.js        # Handle Slack shortcuts
│   ├── home.js            # Handle Home tab
│   └── managerNotifications.js  # Send manager DMs
└── database.js            # Updated with new fields
```

**Modified Files**:
- `index.js` - Add shortcut handlers, manager notifications
- `database.js` - Add visibility field, manager relationship queries
- `routes/api.js` - Add manager-specific endpoints, visibility filtering

---

## 4. Deliverables Breakdown

### Phase 1: Core PRD Requirements (MVP)

#### 4.1 Manager Notifications ✅ HIGH PRIORITY
- [ ] Implement manager detection function
- [ ] Add manager notification logic to Kudos creation
- [ ] Send DMs to recipient's manager and sender's manager
- [ ] Format manager notification messages
- [ ] Handle edge cases (no manager, manager not in workspace)

**Estimated Effort**: 4-6 hours

#### 4.2 Visibility/Privacy System ✅ HIGH PRIORITY
- [ ] Add `visibility` field to database schema
- [ ] Update modal UI with visibility toggle/radio buttons
- [ ] Implement visibility filtering in queries
- [ ] Ensure private Kudos never appear in public feeds
- [ ] Update API endpoints to respect visibility rules

**Estimated Effort**: 4-5 hours

#### 4.3 Manager Dashboard ✅ HIGH PRIORITY
- [ ] Create API endpoint: `GET /api/kudos/manager/:managerId`
- [ ] Filter Kudos by direct reports (sent and received)
- [ ] Add time range filtering
- [ ] Create Slack Home tab view for managers
- [ ] Update web dashboard with manager view

**Estimated Effort**: 5-6 hours

#### 4.4 Database Migration
- [ ] Create migration script for existing databases
- [ ] Add visibility column with default 'private'
- [ ] Update all database queries to handle visibility
- [ ] Test migration on both SQLite and PostgreSQL

**Estimated Effort**: 2-3 hours

**Phase 1 Total**: ~15-20 hours

---

### Phase 2: Enhanced Slack Integration

#### 4.5 Slack Shortcuts
- [ ] Implement global shortcut (`kudos_shortcut`)
- [ ] Implement message action shortcut (pre-fill from message)
- [ ] Update Slack app configuration documentation

**Estimated Effort**: 3-4 hours

#### 4.6 Slack Home Tab
- [ ] Implement `app.home` handler
- [ ] Create public Kudos feed UI in Home tab
- [ ] Add filtering and pagination
- [ ] Update on Kudos creation (publish to Home)

**Estimated Effort**: 4-5 hours

**Phase 2 Total**: ~7-9 hours

---

### Phase 3: Polish & Future Enhancements

#### 4.7 Rate Limiting & Abuse Prevention
- [ ] Implement rate limiting (10 Kudos/hour per user)
- [ ] Add self-kudos validation
- [ ] Add error messages for rate limits

**Estimated Effort**: 2-3 hours

#### 4.8 Enhanced Manager Features
- [ ] Manager digest emails (optional)
- [ ] Manager analytics dashboard
- [ ] Export functionality for managers

**Estimated Effort**: 4-6 hours (future)

#### 4.9 Categories (If Approved)
- [ ] Add category field to database
- [ ] Update modal with category selector
- [ ] Filter by category in feeds
- [ ] Category-based analytics

**Estimated Effort**: 3-4 hours (future)

---

## 5. API Endpoints - New/Updated

### New Endpoints Needed:

```
GET /api/kudos/manager/:managerId
  - Get all Kudos sent/received by manager's direct reports
  - Query params: ?timeRange=7d&limit=50

GET /api/kudos/public?limit=50
  - Get only public Kudos (for public feed)
  - Respects visibility rules

GET /api/manager/:userId
  - Get manager information for a user
  - Returns manager_id, manager_name
```

### Updated Endpoints:

```
GET /api/kudos
  - Add ?visibility=public|private|all filter
  - Default: all (for backward compatibility)

GET /api/kudos/user/:userId
  - Respect visibility rules based on requester
  - Only show private Kudos if requester is sender, recipient, or manager
```

---

## 6. User Experience Flow

### 6.1 Sending Kudos (Updated Flow)

1. User triggers `/kudos` or shortcut
2. Modal opens with:
   - Recipient selector (single select)
   - Message input (required, min 10 chars)
   - Emoji selector (optional)
   - **Visibility toggle**: Private (default) / Public
   - Posting options: DM to recipient, Share with team
3. User submits
4. System:
   - Sends DM to recipient (if selected)
   - Posts to channel (if selected and public)
   - Sends DM to recipient's manager
   - Sends DM to sender's manager
   - Stores in database with visibility flag
   - Updates Home tab (if public)
5. User receives confirmation

### 6.2 Manager Notification Flow

1. Manager receives DM when:
   - Their direct report sends a Kudos (sender's manager)
   - Their direct report receives a Kudos (recipient's manager)
2. Notification includes:
   - Who sent/received
   - Message content
   - Visibility status
   - Timestamp
3. Manager can click link to view in manager dashboard

### 6.3 Public Feed Flow

1. User opens Slack Home tab
2. Sees "Kudos Feed" section
3. Displays recent public Kudos (paginated)
4. Can filter by:
   - Time range
   - Recipient
   - Sender
5. Private Kudos never appear

---

## 7. Testing Considerations

### 7.1 Test Scenarios

- [ ] Send private Kudos - verify managers notified, not in public feed
- [ ] Send public Kudos - verify in public feed and managers notified
- [ ] User with no manager - graceful handling
- [ ] Manager not in workspace - graceful handling
- [ ] Rate limiting - verify limits enforced
- [ ] Self-kudos attempt - should be blocked
- [ ] Manager dashboard - verify only shows direct reports' Kudos
- [ ] Visibility filtering - verify private Kudos hidden from unauthorized users

### 7.2 Edge Cases

- [ ] User has multiple managers (take first/primary)
- [ ] Manager is also a team member (don't duplicate notifications)
- [ ] Kudos sent to manager (manager gets notification as recipient, not as manager)
- [ ] Database migration from existing data (set all existing as 'private')

---

## 8. Documentation Updates Needed

- [ ] Update README with manager notification feature
- [ ] Update API.md with new endpoints
- [ ] Add manager hierarchy setup instructions
- [ ] Update Slack app configuration guide
- [ ] Add privacy/visibility documentation

---

## 9. Open Questions for Discussion

1. **Manager Detection**: Which approach should we use? (Profile fields vs Manual config)
2. **Default Visibility**: Should default be Private or Public? (Recommendation: Private)
3. **Manager Notification Frequency**: Immediate or batched? (Recommendation: Immediate for v1)
4. **Multiple Recipients**: Include in v1? (Recommendation: No)
5. **Categories**: Include in v1? (Recommendation: No)
6. **Rate Limits**: What should the limits be? (Recommendation: 10/hour per user)
7. **Home Tab**: Required for v1 or can be Phase 2? (Recommendation: Phase 2 acceptable)
8. **Web Dashboard**: Keep as-is or enhance with manager features? (Recommendation: Enhance)

---

## 10. Recommended Implementation Order

### Sprint 1 (MVP - Core Features):
1. Database migration (visibility field)
2. Manager detection & notification system
3. Visibility/Privacy system in modal and queries
4. Manager dashboard API endpoint

### Sprint 2 (Slack Integration):
5. Slack shortcuts (global + message action)
6. Slack Home tab with public feed
7. Enhanced manager dashboard in Home tab

### Sprint 3 (Polish):
8. Rate limiting
9. Enhanced error handling
10. Documentation updates
11. Testing & bug fixes

---

## Next Steps

1. **Review this document** and discuss open questions
2. **Confirm manager detection approach**
3. **Approve visibility defaults and UI**
4. **Prioritize features** (MVP vs Phase 2)
5. **Begin implementation** with Phase 1 (Core PRD Requirements)

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Ready for Review

