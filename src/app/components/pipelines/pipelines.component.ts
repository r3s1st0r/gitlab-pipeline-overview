import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { GitLabService } from '../../services/gitlab.service';
import { HierarchyService } from '../../services/hierarchy.service';
import { StorageService } from '../../services/storage.service';
import {
  GroupNode,
  TreeNode,
  ProjectNode,
  FilterOptions,
  PipelineStatus,
} from '../../models/gitlab.models';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.scss'],
})
export class PipelinesComponent implements OnInit, OnDestroy {
  hierarchy: GroupNode | null = null;
  filteredHierarchy: GroupNode | null = null;
  loading = true;
  scanning = false;
  error: string | null = null;
  autoRefresh = false;
  refreshIntervalSeconds = 30;
  private refreshSubscription?: Subscription;

  // Filter & Suche
  filterOptions: FilterOptions = {
    searchTerm: '',
    pipelineStatus: 'all',
    showOnlyWithPipelines: false,
  };

  availableStatuses: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active Only' },
    { value: 'none', label: 'No Pipeline' },
    { value: 'running', label: 'Running' },
    { value: 'pending', label: 'Pending' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
  ];

  constructor(
    private gitlabService: GitLabService,
    private hierarchyService: HierarchyService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const config = this.gitlabService.getConfig();
    if (!config) {
      this.router.navigate(['/']);
      return;
    }

    this.loadHierarchy();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadHierarchy(): void {
    this.loading = true;
    this.error = null;

    const config = this.gitlabService.getConfig();
    if (!config) return;

    const groupId = parseInt(config.rootGroupId, 10);

    this.hierarchyService.buildHierarchy(groupId).subscribe({
      next: (hierarchy) => {
        this.hierarchy = hierarchy;
        this.applyFilters();
        this.loadAllPipelines();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Hierarchie: ' + err.message;
        this.loading = false;
        console.error('Hierarchy loading error:', err);
      },
    });
  }

  loadAllPipelines(): void {
    if (!this.hierarchy) return;

    const projectIds = this.hierarchyService.collectProjectIds(this.hierarchy);

    projectIds.forEach((projectId) => {
      this.loadPipelineForProject(projectId);
    });
  }

  loadPipelineForProject(projectId: number): void {
    if (!this.hierarchy) return;

    this.gitlabService.getLatestPipeline(projectId).subscribe({
      next: (pipeline) => {
        this.hierarchy = this.hierarchyService.updateProjectInHierarchy(
          this.hierarchy!,
          projectId,
          (project) => ({
            ...project,
            pipeline: pipeline || undefined,
            loading: false,
          })
        );
        this.applyFilters();
      },
      error: (err) => {
        this.hierarchy = this.hierarchyService.updateProjectInHierarchy(
          this.hierarchy!,
          projectId,
          (project) => ({
            ...project,
            loading: false,
            error: err.message,
          })
        );
        this.applyFilters();
      },
    });
  }

  rescan(): void {
    this.scanning = true;
    this.storageService.clearScannedData();
    this.loadHierarchy();
    this.scanning = false;
  }

  refreshPipelines(): void {
    if (this.loading) return;
    this.loadAllPipelines();
  }

  startAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
    if (this.autoRefresh) {
      const intervalMs = this.refreshIntervalSeconds * 1000;
      this.refreshSubscription = interval(intervalMs).subscribe(() => {
        if (this.autoRefresh && !this.loading) {
          this.refreshPipelines();
        }
      });
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    this.startAutoRefresh();
  }

  onIntervalChange(): void {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  // Baum-Navigation
  toggleGroup(groupId: number): void {
    if (!this.filteredHierarchy) return;
    this.filteredHierarchy = this.hierarchyService.toggleGroup(
      this.filteredHierarchy,
      groupId
    );
  }

  expandAll(): void {
    if (!this.filteredHierarchy) return;
    this.filteredHierarchy = this.hierarchyService.expandAll(
      this.filteredHierarchy
    );
  }

  collapseAll(): void {
    if (!this.filteredHierarchy) return;
    this.filteredHierarchy = this.hierarchyService.collapseAll(
      this.filteredHierarchy
    );
  }

  // Filter & Suche
  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterOptions = {
      searchTerm: '',
      pipelineStatus: 'all',
      showOnlyWithPipelines: false,
    };
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.hierarchy) {
      this.filteredHierarchy = null;
      return;
    }

    const filtered = this.filterNode(this.hierarchy);
    // Root group should always be visible, even if empty after filtering
    this.filteredHierarchy = filtered || {
      ...this.hierarchy,
      children: []
    };
  }

  private filterNode(node: GroupNode): GroupNode | null {
    const filteredChildren = node.children
      .map((child) => {
        if (child.type === 'group') {
          return this.filterNode(child);
        } else {
          return this.filterProject(child) ? child : null;
        }
      })
      .filter((child) => child !== null) as TreeNode[];

    // Hide groups with no children after filtering
    if (filteredChildren.length === 0) {
      return null;
    }

    return {
      ...node,
      children: filteredChildren,
    };
  }

  private filterProject(project: ProjectNode): boolean {
    // Suchbegriff-Filter
    if (this.filterOptions.searchTerm) {
      const searchLower = this.filterOptions.searchTerm.toLowerCase();
      const nameMatch = project.name.toLowerCase().includes(searchLower);
      const pathMatch = project.path_with_namespace
        .toLowerCase()
        .includes(searchLower);
      if (!nameMatch && !pathMatch) {
        return false;
      }
    }

    // Pipeline-Status-Filter
    if (this.filterOptions.pipelineStatus !== 'all') {
      if (this.filterOptions.pipelineStatus === 'active') {
        const activeStatuses = [
          'running',
          'pending',
          'created',
          'waiting_for_resource',
          'preparing',
        ];
        if (
          !project.pipeline ||
          !activeStatuses.includes(project.pipeline.status)
        ) {
          return false;
        }
      } else if (this.filterOptions.pipelineStatus === 'none') {
        if (project.pipeline) {
          return false;
        }
      } else {
        if (
          !project.pipeline ||
          project.pipeline.status !== this.filterOptions.pipelineStatus
        ) {
          return false;
        }
      }
    }

    // Nur Projekte mit Pipelines
    if (this.filterOptions.showOnlyWithPipelines && !project.pipeline) {
      return false;
    }

    return true;
  }

  // Statistiken
  getTotalProjects(): number {
    if (!this.hierarchy) return 0;
    return this.hierarchyService.collectProjectIds(this.hierarchy).length;
  }

  getFilteredProjectsCount(): number {
    if (!this.filteredHierarchy) return 0;
    return this.hierarchyService.collectProjectIds(this.filteredHierarchy)
      .length;
  }

  getActivePipelinesCount(): number {
    if (!this.filteredHierarchy) return 0;

    let count = 0;
    const activeStatuses = [
      'running',
      'pending',
      'created',
      'waiting_for_resource',
      'preparing',
    ];

    const countInNode = (node: TreeNode): void => {
      if (node.type === 'project') {
        if (node.pipeline && activeStatuses.includes(node.pipeline.status)) {
          count++;
        }
      } else if (node.type === 'group') {
        node.children.forEach(countInNode);
      }
    };

    this.filteredHierarchy.children.forEach(countInNode);
    return count;
  }

  // UI Helpers
  getStatusClass(status?: string): string {
    if (!status) return 'status-unknown';

    const statusMap: { [key: string]: string } = {
      success: 'status-success',
      failed: 'status-failed',
      running: 'status-running',
      pending: 'status-pending',
      canceled: 'status-canceled',
      skipped: 'status-skipped',
      manual: 'status-manual',
      created: 'status-created',
      waiting_for_resource: 'status-waiting',
      preparing: 'status-preparing',
      scheduled: 'status-scheduled',
    };

    return statusMap[status] || 'status-unknown';
  }

  getStatusIcon(status?: string): string {
    if (!status) return '❓';

    const iconMap: { [key: string]: string } = {
      success: '✅',
      failed: '❌',
      running: '🔄',
      pending: '⏳',
      canceled: '🚫',
      skipped: '⏭️',
      manual: '✋',
      created: '🆕',
      waiting_for_resource: '⏳',
      preparing: '🔧',
      scheduled: '📅',
    };

    return iconMap[status] || '❓';
  }

  isGroupNode(node: TreeNode): node is GroupNode {
    return node.type === 'group';
  }

  isProjectNode(node: TreeNode): node is ProjectNode {
    return node.type === 'project';
  }
}
