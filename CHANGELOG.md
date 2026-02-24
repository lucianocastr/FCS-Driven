# Changelog

All notable changes to Fiplex Control Software will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation (EN)
- Technical architecture documentation with Mermaid diagrams

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Issue #18: "Edit password menu fails" (source: user Excel tracker, 2026-05-01) for `release/3.0.0` stabilization

### Security
- Nothing yet

---

## [3.0.0] - 2025-11-30

### Added
- Complete migration from VB.NET to C# (.NET 10)
- Modern dependency injection architecture
- WebView2 integration for HTML-based device UIs
- OIDC authentication with Duende IdentityModel
- Serial command pipeline with FIFO queue
- Circuit breaker pattern for device communication
- Strategy pattern for device-specific response handlers
- Embedded HTTP server for WebView2 communication
- Training validation and subscription management
- Simulated device mode for development (`NoUSB` mode)
- Structured logging with Microsoft.Extensions.Logging

### Changed
- Target framework from .NET Framework 4.x to .NET 10
- UI architecture from native WinForms to WebView2 hybrid
- Authentication from custom to OIDC-based system
- Serial communication to async pipeline model

### Removed
- Legacy VB.NET codebase
- Direct COM port access (replaced by abstracted pipeline)

---

## [1.x.x] - Legacy VB.NET Version

The original VB.NET implementation is no longer maintained.
See migration comments in code (`// Equivalente VB.NET:`) for historical context.

---

## Version History Summary

| Version | Date | Framework | Status |
|---------|------|-----------|--------|
| 3.0.0 | 2025 | .NET 10 | Current |
| 1.x.x | 2015-2025 | .NET Framework | Legacy |

---

## Release Types

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, documentation updates

## Supported Devices

| Device Type | TDev | NDev Range | Status |
|-------------|------|------------|--------|
| Signal Booster | 1c | 2.2 - 7.0+ | ✅ Active |
| Signal Booster | 2c | 1.0+ | ✅ Active |
| DAS Master | 5dm | 1.0+ | ✅ Active |
| DAS Remote | 5dr | 1.0+ | ✅ Active |

---

[Unreleased]: https://github.com/fiplex/control-software/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/fiplex/control-software/releases/tag/v3.0.0
