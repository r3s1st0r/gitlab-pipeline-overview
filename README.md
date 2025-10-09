# GitLab Pipeline Overview

An Angular application for monitoring GitLab pipelines across groups and subgroups.

## Features

- 🌳 **Tree View** - Hierarchical display of groups, subgroups, and projects
- 🔍 **Search & Filter** - Search by name/path and filter by pipeline status
- 💾 **Smart Caching** - Cached project IDs for faster loading
- 🔄 **Auto-Refresh** - Configurable automatic refresh (disabled by default)
- 📊 **Statistics** - Overview of total, filtered, and active pipelines
- 🎨 **Modern UI** - Built with Bootstrap 5
- ⚡ **Performance** - Parallel API requests for optimal speed

## Prerequisites

- Node.js (Version 20+)
- npm (Version 10+)
- GitLab account with Private Token

## Installation

1. Clone or download the project

2. Navigate to project directory:
```bash
cd gitlab-pipeline-overview
```

3. Install dependencies:
```bash
npm install
```

4. Start development server:
```bash
npm start
```

5. Open browser: `http://localhost:4200`

## Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start the container:
```bash
docker-compose up -d
```

2. Open browser: `http://localhost:9001`

3. Stop the container:
```bash
docker-compose down
```

### Using Docker directly

1. Build the image:
```bash
docker build -t gitlab-pipeline-overview .
```

2. Run the container:
```bash
docker run -d -p 9001:80 --name gitlab-pipeline-overview gitlab-pipeline-overview
```

3. Open browser: `http://localhost:9001`

4. Stop and remove the container:
```bash
docker stop gitlab-pipeline-overview
docker rm gitlab-pipeline-overview
```

### Docker Image Details

- **Multi-stage build**: Uses Node.js for building and nginx for serving
- **Production optimized**: Minified assets, gzip compression
- **Lightweight**: Alpine-based images (~50MB)
- **Health checks**: Automatic container health monitoring
- **Port**: Exposes port 80 (mapped to 9001 on host)

## Configuration

### Creating a GitLab Private Token

1. Log in to GitLab
2. Navigate to: **Settings → Access Tokens**
3. Create a new token with the following scopes:
   - `api`
   - `read_api`
4. Copy the token (shown only once!)

### Finding the GitLab Group ID

You can find the Group ID:
- In the group URL: `gitlab.com/groups/YOUR_GROUP` (ID is in group settings)
- Under **Settings → General** in the group

### First Use

1. On first start, the configuration form appears
2. Fill in the fields:
   - **GitLab API URL**: e.g., `https://gitlab.com` or `https://gitlab.example.com`
   - **Private Token**: Your created GitLab Private Token
   - **Root Group ID**: The ID of your main group
3. Click "Connect"
4. The application scans all projects in the group and subgroups
5. Pipeline statuses are then displayed

## Usage

### Main View

The main view shows:
- Number of projects found
- Number of active pipelines
- Hierarchical tree of all groups and projects with their pipeline statuses

### Actions

- **⬇️ Expand All / ⬆️ Collapse All**: Expand or collapse all groups
- **▶️ Auto-Refresh**: Enable automatic refresh (disabled by default)
- **Interval Input**: Set refresh interval in seconds (5-300 seconds)
- **🔄 Refresh**: Reload pipeline statuses (keeps cached project IDs)
- **🔍 Rescan**: Perform new scan of all groups (finds new projects)

### Search & Filter

- **Search Bar**: Search by project name or path
- **Status Filter**: Filter by pipeline status (All, Active Only, Specific Status)
- **Only with Pipelines**: Show only projects that have pipelines
- **✖️ Clear Filters**: Reset all filters

### Pipeline Status

The following statuses are displayed:
- ✅ **success**: Pipeline completed successfully
- ❌ **failed**: Pipeline failed
- 🔄 **running**: Pipeline is currently running
- ⏳ **pending/waiting**: Pipeline waiting for execution
- 🔧 **preparing**: Pipeline is being prepared
- 🆕 **created**: Pipeline was created
- 🚫 **canceled**: Pipeline was canceled
- ⏭️ **skipped**: Pipeline was skipped
- ✋ **manual**: Manual pipeline (waiting for confirmation)

## Architecture

### Services

- **GitLabService**: Communication with GitLab API
- **HierarchyService**: Building and managing the tree structure
- **StorageService**: Managing local cache (localStorage)
- **ScannerService**: Recursive scanning of groups and projects

### Components

- **ConfigComponent**: Configuration form for GitLab connection
- **PipelinesComponent**: Main view with pipeline overview and tree structure

### Data Models

See [src/app/models/gitlab.models.ts](src/app/models/gitlab.models.ts) for all TypeScript interfaces.

## Development

### Build

```bash
npm run build
```

Build artifacts are stored in the `dist/` directory.

### Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Notes

### Performance

- Initial setup may take several seconds with many projects
- Project IDs are cached in browser storage
- Pipeline statuses are queried in parallel for all projects

### Security

- The Private Token is **NOT** stored in localStorage
- Token must be re-entered on each browser restart
- Use tokens with minimal required permissions

### API Limits

- GitLab has rate limits for API requests
- With many projects, temporary delays may occur
- Auto-refresh is disabled by default to avoid hitting limits
- Configurable refresh interval (default: 30 seconds)

## Technologies

- **Angular 20**: Framework
- **Bootstrap 5**: UI Components & Styling
- **TypeScript**: Programming Language
- **RxJS**: Reactive Programming
- **GitLab API v4**: Data Source

## License

MIT
