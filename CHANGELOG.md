# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.0] - 2025-09-15

### Features

- **auth**: Add memory session options and improved redirect handling
- **security**: Enhanced password strength validation component

### Bug Fixes

- **auth**: Fix infinite recursion in profiles RLS policies
- **audit**: Resolve audit_logs constraint violations for login actions
- **types**: Correct TypeScript errors in authentication flow

### Security

- **database**: Simplified RLS policies to prevent recursion
- **audit**: Fixed audit_logs action constraint to allow all required actions
- **validation**: Enhanced password strength requirements

### Chores

- **formatting**: Add missing newlines to PasswordStrength component exports
- **dependencies**: Add openai package for AI functionality
