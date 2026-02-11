# Spec-Driven Development (SDD) with AI - Skill Guide

## Overview
Spec-Driven Development (SDD) is a methodology designed specifically for AI-assisted coding. It splits implementation into three clean phases: **Research → Spec → Code**, clearing context between each phase to maximize AI effectiveness. The spec becomes a tactical blueprint that prevents scope creep, reduces breaking changes, and ensures the AI has maximum context available for actual code generation.

---

## Core Methodology: 3-Phase Workflow

### Phase 1: Research (PRD Generation)
**Goal**: Understand the problem, identify impacted files, and gather constraints.

**What the AI does**:
- Searches the codebase for existing implementations
- Maps all files that will be affected (created, modified, or read)
- Identifies similar patterns already in use
- Lists technical constraints and dependencies

**Output**: `PRD.md` (Product Requirements Document)

**Key principle**: Clear context after this phase. Only the PRD summary moves forward.

---

### Phase 2: Spec (Technical Specification)
**Goal**: Create a tactical, file-by-file implementation plan.

**What the AI does**:
- Reads the PRD.md
- Lists every file to be created (with full path)
- Lists every file to be modified (with full path)
- Describes exactly what changes in each file
- Includes code snippets or pseudocode as blueprints
- References existing functions/components instead of duplicating logic

**Output**: `spec.md` (Technical Specification)

**Key principle**: The spec is the contract. It's not prose—it's a structured, tactical plan with paths, functions, and code references.

---

### Phase 3: Code (Implementation)
**Goal**: Execute the spec exactly as written.

**What the AI does**:
- Reads the spec.md
- Implements changes file-by-file as specified
- Uses the code snippets/blueprints from the spec
- Validates against the constraints in the spec

**Output**: Working code

**Key principle**: Maximum context available for code generation because research and planning are compressed into the spec.

---

## Why SDD Works Better with AI

### Context Window Management
- Traditional approach: AI tries to research + plan + code in one session → context window fills up fast
- SDD approach: Each phase uses fresh context, with only a compressed summary from the previous phase

### Reduces Hallucination
- The spec acts as a "contract" that constrains what the AI can invent
- File paths and function signatures are explicit, not inferred

### Prevents Breaking Changes
- Research phase maps all impacted files upfront
- Spec phase forces you to review the blast radius before code is written
- Implementation phase touches only the files listed in the spec

### Enables Iteration
- Can regenerate spec if research reveals issues
- Can modify spec before touching code
- Can implement spec in chunks (one file at a time)

---

## Prompt Templates

### Phase 1: Research Prompt

```
I need to implement [FEATURE/CHANGE].

Please research the codebase and create a PRD.md with:

1. **Affected Files**: List all files that will be impacted by this change (created, modified, or read). Include full paths.

2. **Impact Analysis**: For each file, explain:
   - What part of the current functionality it handles
   - How this new feature will impact it
   - Any dependencies or side effects

3. **Existing Patterns**: Identify similar implementations already in the codebase that should be followed or reused.

4. **Constraints**: List technical constraints:
   - Architecture patterns to follow
   - APIs/libraries already in use
   - Performance considerations
   - Breaking change risks

5. **Edge Cases**: Identify potential edge cases or failure modes.

Output format: PRD.md with clear sections for each of the above.
```

---

### Phase 2: Spec Prompt

```
Read the attached PRD.md and generate a spec.md tactical implementation plan.

The spec.md MUST include:

## 1. Files to Create
For each new file:
- Full path (e.g., `src/components/FeatureName/index.tsx`)
- Purpose and responsibility
- Key exports (functions, components, types)
- Code blueprint or pseudocode showing structure

## 2. Files to Modify
For each existing file to change:
- Full path
- Exact changes required (which functions/components/lines)
- Before/after code snippets where helpful
- Reason for the change

## 3. Integration Points
- How new files integrate with existing code
- Which existing functions/components to call (never duplicate logic)
- Data flow between files

## 4. Implementation Order
- Suggested order to implement changes (to avoid breaking dependencies)

## 5. Testing Strategy
- Unit tests to add/modify
- Integration test scenarios
- Manual testing steps

**Requirements**:
- Every file path must be complete and accurate
- Prefer modifying existing files over creating new ones (justify if creating new)
- Reference existing functions/components instead of rewriting similar logic
- Include type definitions/interfaces where relevant
- Keep each file's responsibility focused (no "god files")
```

---

### Phase 3: Code Prompt

```
Implement the attached spec.md exactly as specified.

Follow these rules:
1. Implement changes file-by-file in the order specified
2. Use the code blueprints/snippets from the spec as starting points
3. Maintain consistency with existing code style and patterns
4. Do not add features not specified in the spec
5. If you encounter an issue with the spec (e.g., incorrect path, missing dependency), STOP and ask for spec revision instead of improvising

For each file:
- Show the complete modified file (or new file)
- Highlight what changed and why
- Note any deviations from the spec (if unavoidable) with explanation

After implementation, provide:
- Summary of changes made
- Testing instructions
- Any follow-up tasks or known issues
```

---

## Advanced Patterns

### Pattern 1: Incremental Spec Implementation

For large features, break the spec into phases:

```
spec-phase1.md → Implement → Review → spec-phase2.md → Implement
```

Each phase has its own mini-SDD cycle but references previous phases' outputs.

---

### Pattern 2: Spec Review Checklist

Before moving from Spec → Code, validate:

- [ ] All file paths are correct and follow project structure
- [ ] No duplicate logic being created (reusing existing utils/components)
- [ ] Changes don't break existing functionality (check dependents)
- [ ] Type definitions are included (TypeScript projects)
- [ ] Testing strategy is clear
- [ ] Implementation order won't create temporary broken states

---

### Pattern 3: Error Recovery

If implementation reveals the spec was wrong:

1. **STOP coding**
2. Document what was discovered (missing dependency, wrong assumption, etc.)
3. **Regenerate spec** with new information
4. Resume from Phase 3 with corrected spec

Do NOT let the AI "fix it as we go"—that defeats the purpose of SDD.

---

## File Structure Examples

### Example PRD.md Structure

```markdown
# PRD: Add User Authentication

## Feature Summary
Implement JWT-based authentication with login/logout/refresh token flow.

## Affected Files

### Files to Create
- `src/lib/auth.ts` - Auth utility functions
- `src/middleware/authMiddleware.ts` - Express middleware for protected routes
- `src/types/auth.ts` - TypeScript types for auth

### Files to Modify
- `src/server.ts` - Add auth middleware to app
- `src/routes/user.ts` - Protect existing user routes
- `src/config/env.ts` - Add JWT_SECRET to config

## Existing Patterns
- We already use bcrypt in `src/utils/password.ts` for hashing
- Error handling follows pattern in `src/middleware/errorHandler.ts`
- Database queries use Prisma client from `src/lib/db.ts`

## Constraints
- Must not break existing API routes
- JWT secret must come from environment variable
- Token expiry: 15min access, 7d refresh
- Must handle token refresh gracefully

## Edge Cases
- Expired token during active session
- Multiple devices (one logout affects all?)
- Password reset flow (future consideration)
```

---

### Example spec.md Structure

```markdown
# Spec: User Authentication Implementation

## 1. Files to Create

### `src/lib/auth.ts`
**Purpose**: JWT token generation and verification utilities

**Exports**:
```typescript
export function generateAccessToken(userId: string): string;
export function generateRefreshToken(userId: string): string;
export function verifyToken(token: string): { userId: string } | null;
```

**Implementation notes**:
- Use `jsonwebtoken` library (already in package.json)
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Read JWT_SECRET from `src/config/env.ts`

---

### `src/middleware/authMiddleware.ts`
**Purpose**: Express middleware to protect routes

**Export**:
```typescript
export const requireAuth: RequestHandler;
```

**Logic**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token using `verifyToken()` from `src/lib/auth.ts`
3. If valid, attach `req.userId = userId` and call `next()`
4. If invalid, return 401 error using `src/middleware/errorHandler.ts` pattern

---

## 2. Files to Modify

### `src/server.ts`
**Change**: Import and apply authMiddleware to protected routes

**Add after line 15** (after other middleware):
```typescript
import { requireAuth } from './middleware/authMiddleware';

// Protected routes
app.use('/api/user', requireAuth, userRoutes);
```

---

### `src/routes/user.ts`
**Change**: Add login/logout endpoints

**Add these new routes**:
```typescript
router.post('/login', async (req, res) => {
  // 1. Validate email/password from req.body
  // 2. Query user from DB using Prisma (src/lib/db.ts)
  // 3. Verify password using src/utils/password.ts comparePassword()
  // 4. Generate tokens using src/lib/auth.ts
  // 5. Return { accessToken, refreshToken }
});

router.post('/logout', requireAuth, async (req, res) => {
  // For now, just return 200 (client discards token)
  // Future: invalidate refresh token in DB
});

router.post('/refresh', async (req, res) => {
  // 1. Extract refreshToken from req.body
  // 2. Verify using verifyToken()
  // 3. Generate new accessToken
  // 4. Return new accessToken
});
```

---

### `src/config/env.ts`
**Change**: Add JWT_SECRET validation

**Add to config object**:
```typescript
export const config = {
  // ... existing config
  JWT_SECRET: process.env.JWT_SECRET,
};

// Add validation (in existing validation block):
if (!config.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

## 3. Integration Points

- Use existing `src/lib/db.ts` Prisma client for user queries
- Follow error handling pattern from `src/middleware/errorHandler.ts`
- Password verification via existing `src/utils/password.ts` 

## 4. Implementation Order

1. Create `src/types/auth.ts` (no dependencies)
2. Create `src/lib/auth.ts` (depends on types + env config)
3. Modify `src/config/env.ts` (auth.ts needs this)
4. Create `src/middleware/authMiddleware.ts` (depends on auth.ts)
5. Modify `src/routes/user.ts` (add endpoints)
6. Modify `src/server.ts` (wire everything together)

## 5. Testing Strategy

**Unit tests** (`src/lib/auth.test.ts`):
- `generateAccessToken()` creates valid JWT
- `verifyToken()` accepts valid token, rejects expired/invalid

**Integration tests**:
- POST /api/user/login with valid credentials returns tokens
- POST /api/user/login with invalid credentials returns 401
- GET /api/user/profile (protected route) requires valid token
- POST /api/user/refresh with valid refresh token returns new access token

**Manual testing**:
1. Login via Postman → receive tokens
2. Use access token to call protected route → success
3. Wait 15+ min → access token expired → 401
4. Use refresh token → get new access token
```

---

## Integration with Development Tools

### With VS Code / Cursor / Windsurf
1. Create three separate chat sessions (or save/load context):
   - Session 1: Generate PRD
   - Session 2: Generate spec from PRD
   - Session 3: Implement from spec

2. Use "Add file to context" feature:
   - Phase 1: Add relevant existing files
   - Phase 2: Add PRD.md only
   - Phase 3: Add spec.md only

### With Claude Desktop / ChatGPT
1. Use Projects feature to store PRD/spec as project knowledge
2. Create custom instructions referencing the spec format
3. Use file upload for each phase's input document

### With n8n / Automation
Create a workflow:
1. **Research node**: AI agent with codebase access → outputs PRD.md
2. **Spec node**: AI agent reads PRD.md → outputs spec.md
3. **Code node**: AI agent reads spec.md → outputs code files
4. **Review node**: Human approval gate between phases

### With Cursor Composer / Aider
These tools already work file-by-file, so SDD fits naturally:
1. Use Research phase to generate file list
2. Use Spec phase to create implementation plan
3. Pass spec to Composer/Aider to implement

---

## Common Pitfalls & Solutions

### Pitfall 1: AI Skips Research Phase
**Problem**: AI goes straight from request to code without mapping impacted files.

**Solution**: Explicitly say "Stop. First generate a PRD.md following the SDD research template."

---

### Pitfall 2: Spec Is Too Vague
**Problem**: Spec says "update user routes" without specifying which routes or what changes.

**Solution**: Enforce the prompt template that requires file paths + exact changes. Reject vague specs.

---

### Pitfall 3: Spec and Code Drift
**Problem**: During implementation, AI starts adding things not in the spec.

**Solution**: 
- In Phase 3 prompt, explicitly say "Do NOT add features outside the spec"
- If something missing is discovered, stop and regenerate spec

---

### Pitfall 4: Breaking Changes Not Caught
**Problem**: Research missed a file that depends on modified code.

**Solution**: 
- In Research prompt, add: "Search for all files that import or reference [the thing you're changing]"
- Use IDE's "Find all references" to validate the PRD file list

---

## Measuring Success

SDD is working well when:

- ✅ You can review the spec and spot issues before any code is written
- ✅ Implementation rarely requires "fixing" the spec mid-way
- ✅ Generated code has fewer breaking changes
- ✅ You can pause between phases without losing context
- ✅ The AI stops inventing things outside the spec

---

## Advanced: Multi-Agent SDD

For complex features, use specialized agents per phase:

```
Research Agent (context: full codebase, no code generation)
    ↓ PRD.md
Spec Agent (context: PRD + architecture docs, no code generation)
    ↓ spec.md
Code Agent (context: spec + relevant files only, code generation enabled)
    ↓ Implementation
```

Each agent has a specialized prompt optimized for its phase.

---

## Templates You Can Copy-Paste

### Quick Research Prompt
```
Research phase for [FEATURE]. Create PRD.md with:
1. All affected files (full paths)
2. Impact per file
3. Existing similar patterns
4. Constraints & risks
```

### Quick Spec Prompt
```
From this PRD, create spec.md with:
1. Files to create (paths + blueprints)
2. Files to modify (paths + exact changes)
3. Integration points
4. Implementation order
Must be detailed enough to implement without guessing.
```

### Quick Implementation Prompt
```
Implement this spec.md file-by-file.
Rules: Follow spec exactly, no extra features, ask if spec is unclear.
```

---

## Usage Instructions

1. **Start every new feature/change with Research phase**: Even if you "know" what to do, let the AI map the territory.

2. **Review the PRD before generating spec**: Catch missing files or wrong assumptions early.

3. **Review the spec before writing code**: This is your last chance to catch scope creep or architectural issues.

4. **Keep each phase's output in version control**: PRD and spec are documentation that explain why code is structured the way it is.

5. **Update the spec if implementation reveals issues**: Don't let code diverge from spec—update spec and regenerate code.

6. **Use this methodology for any change larger than a single function**: SDD overhead pays off when blast radius > 3 files.

---

## Further Reading

- Original video reference: [Spec-Driven Development with AI](https://www.youtube.com/watch?v=BcLtqQ3JlMU)
- Related: TDD (Test-Driven Development) - similar three-phase loop (Red → Green → Refactor)
- Related: RFC process in large engineering orgs (Research → Proposal → Implementation)

---

## Changelog

**v1.0** - Initial skill guide based on SDD methodology
