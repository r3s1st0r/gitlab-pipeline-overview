# Changelog

All notable changes to the GitLab Pipeline Overview project will be documented in this file.

## [Unreleased]

## [0.2.0] - 2025-10-08

### Added
- **Dark Mode Support**
  - Implemented theme service with localStorage persistence
  - Added dark mode toggle button to all pages
  - Automatic system preference detection on first load
  - Bootstrap 5.3 native dark mode integration with `data-bs-theme` attribute
  - Theme synchronization across all components

- **Bootstrap Icons Integration**
  - Replaced all emoji icons with Bootstrap Icons
  - Added icons for buttons, status badges, and navigation
  - Implemented dynamic icon switching (folder open/closed, play/pause, etc.)
  - Enhanced visual consistency across the application

- **API Connection Validation**
  - Added connection test before saving configuration
  - Validates GitLab API credentials (Private Token)
  - Verifies group access permissions
  - Displays specific error messages:
    - 401: Invalid Private Token
    - 404: Group not found
    - 403: Access denied
  - Loading state with spinner during validation

- **Footer Component**
  - Added footer to both config and pipelines pages
  - GitHub profile link with icon
  - Full-width footer layout
  - Dark mode support with theme-aware colors

- **Filter Empty Groups**
  - Groups without matching children are hidden when filters are active
  - Root group always remains visible
  - Improved tree view clarity

### Changed
- **UI Improvements**
  - Updated to Bootstrap 5.3.8
  - Improved responsive layout with proper full-width support
  - Enhanced color scheme for better dark mode compatibility
  - Status badges now use theme-aware colors
  - Improved contrast for "No Pipeline" badge in dark mode

- **Auto-Refresh Configuration**
  - Auto-refresh disabled by default
  - Configurable interval in seconds (5-300)
  - Dynamic interval updates without page reload

- **Localization**
  - Translated entire application to English
  - Updated README.md documentation
  - English UI labels and messages

### Fixed
- **Footer Layout**
  - Fixed footer width to span full viewport
  - Removed container constraints causing narrow footer
  - Proper background color in dark mode

- **Badge Visibility**
  - Fixed "No Pipeline" badge readability in dark mode
  - Changed from `bg-light` to `bg-secondary-subtle`

- **Text Contrast**
  - Fixed "GitLab Configuration" title visibility in dark mode
  - Removed hardcoded color values
  - Using theme-aware text colors

## [0.1.0] - 2025-10-08

### Added
- Initial project setup with Angular 20
- GitLab API integration
- Recursive group scanning with caching
- Hierarchical tree view for groups and projects
- Pipeline status display with real-time updates
- Search and filter functionality:
  - Filter by project name/path
  - Filter by pipeline status
  - Show only projects with pipelines
- Auto-refresh with configurable interval
- Statistics dashboard (total projects, filtered, active pipelines)
- Bootstrap 5 UI framework
- Responsive design for mobile and desktop
- LocalStorage for configuration persistence
- Error handling and loading states

### Technical Details
- Angular 20 with standalone components
- RxJS reactive programming
- TypeScript strict mode
- SCSS styling
- HttpClient for API communication
- GitLab API v4 compatibility

---

## Release Notes

### v0.1.0 Initial Release
First stable release of GitLab Pipeline Overview. Provides a comprehensive dashboard for monitoring GitLab CI/CD pipelines across multiple groups and projects with hierarchical visualization and real-time updates.

### Key Features
- 🔍 Recursive group scanning
- 📊 Real-time pipeline status
- 🌲 Hierarchical tree view
- 🔎 Advanced filtering
- 🔄 Auto-refresh
- 🎨 Bootstrap 5 UI
- 🌙 Dark mode support
- 🔐 Secure credential handling
