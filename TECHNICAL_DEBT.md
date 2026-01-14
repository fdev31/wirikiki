# Technical Debt & Project Assessment

This document outlines the current state of the Wirikiki project, highlighting security vulnerabilities, code quality issues, and architectural observations.

## 🚨 Critical Issues & Security Vulnerabilities

### 1. Improper Input Validation & Error Handling (`assert`)

- **Location:** `wirikiki/routes.py` (e.g., `addNote`, `updateNote`)
- **Issue:** The code uses `assert` statements for input validation (e.g., `assert "." not in note.name`).
- **Risk:** In Python, `assert` statements are **removed** when running with optimization flags (`python -O`). This means input validation disappears in production environments, potentially allowing path traversal or invalid data states. Furthermore, failing asserts raise 500 Internal Server Errors rather than 400 Bad Requests.
- **Recommendation:** Replace all `assert` statements with explicit `if` checks raising `HTTPException`.

### 2. Path Traversal Risks

- **Location:** `wirikiki/models.py` and `wirikiki/routes.py`
- **Issue:** While there is a check for `.` in `addNote`, the `Note` model simply joins user input with the base path: `os.path.join(PATH, self.name)`.
- **Risk:** If the `assert` is bypassed (or if `updateNote` receives a crafted payload since it relies on the Pydantic model directly without the explicit checks found in `addNote`), a user could potentially overwrite files outside the intended directory using sequences like `../../target`.
- **Recommendation:** Implement strict filename validation (e.g., allowlist alphanumeric + hyphens) and ensure resolved paths are within the intended root directory.

### 3. Command Injection / Insecure Shell Execution

- **Location:** `wirikiki/routes.py`
- **Issue:** Usage of `os.system` with f-strings constructed from file paths:
  ```python
  os.system(f'git add "{root[len(fullpath)+1:]}/{fname}"')
  ```
- **Risk:** While `gitRun` in `versioning.py` uses the safer `asyncio.create_subprocess_exec`, the startup logic in `routes.py` uses `os.system`. If a filename contains malicious characters (e.g., `"; rm -rf /; "`), it could lead to arbitrary command execution.
- **Recommendation:** Remove `os.system` calls. strictly use `subprocess` (or `asyncio` subprocesses) with argument lists, never shell strings.

## ⚠️ Code Quality & Performance

### 4. Blocking I/O in Async Routes

- **Location:** `wirikiki/routes.py` -> `getNotes`
- **Issue:** The `getNotes` function is `async`, but it calls `os.walk`, which is a synchronous blocking I/O operation.
- **Impact:** This blocks the FastAPI/asyncio event loop. While likely acceptable for a single-user desktop app, it degrades performance significantly if multiple requests happen simultaneously or if the file tree is large.
- **Recommendation:** Run blocking file operations in a separate thread pool (e.g., using `run_in_executor`) or use an async filesystem library.

### 5. Lack of Tests

- **Observation:** The `tests/` directory contains only `smoketest.sh` (a simple `wget` command).
- **Issue:** There are no unit tests or integration tests for the Python backend logic, making refactoring or security patching risky.
- **Recommendation:** Add a proper test suite (e.g., using `pytest`) covering at least the core route logic and model saving/loading.

## ℹ️ Architecture & Design

### 6. Git Integration Strategy

- **Observation:** `gitSave` triggers a commit on _every_ file save/update.
- **Impact:** This will create an extremely noisy git history. For a notebook app, a "debounce" strategy or manual "snapshot" feature might be cleaner than committing every keystroke save.

### 7. Dependency Management

- **Observation:** The project uses `python-jose`.
- **Note:** `python-jose` is largely unmaintained.
- **Recommendation:** Migrating to `pyjwt` is generally recommended for long-term support.
