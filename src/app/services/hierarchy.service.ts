import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { GitLabService } from './gitlab.service';
import { StorageService } from './storage.service';
import {
  GroupNode,
  ProjectNode,
  TreeNode,
  GitLabGroup,
  GitLabProject,
} from '../models/gitlab.models';

@Injectable({
  providedIn: 'root',
})
export class HierarchyService {
  constructor(
    private gitlabService: GitLabService,
    private storageService: StorageService
  ) {}

  /**
   * Baut die komplette Hierarchie auf
   */
  buildHierarchy(rootGroupId: number): Observable<GroupNode> {
    return this.buildGroupNode(rootGroupId);
  }

  /**
   * Baut einen Gruppen-Knoten mit allen Kindern auf
   */
  private buildGroupNode(groupId: number): Observable<GroupNode> {
    return this.gitlabService.getGroup(groupId).pipe(
      switchMap((group) => {
        return forkJoin({
          group: of(group),
          subgroups: this.gitlabService.getSubgroups(groupId),
          projects: this.gitlabService.getGroupProjects(groupId),
        });
      }),
      switchMap(({ group, subgroups, projects }) => {
        // Subgruppen rekursiv verarbeiten
        const subgroupNodes$ =
          subgroups.length > 0
            ? forkJoin(subgroups.map((sg) => this.buildGroupNode(sg.id)))
            : of([]);

        // Projekt-Knoten erstellen
        const projectNodes = projects.map((p) => this.createProjectNode(p));

        return subgroupNodes$.pipe(
          map((subgroupNodes) => {
            const children: TreeNode[] = [
              ...subgroupNodes,
              ...projectNodes,
            ];

            return {
              id: group.id,
              name: group.name,
              full_path: group.full_path,
              type: 'group' as const,
              expanded: true,
              children: children,
            };
          })
        );
      })
    );
  }

  /**
   * Erstellt einen Projekt-Knoten
   */
  private createProjectNode(project: GitLabProject): ProjectNode {
    return {
      id: project.id,
      name: project.name,
      path_with_namespace: project.path_with_namespace,
      web_url: project.web_url,
      type: 'project' as const,
      loading: true,
    };
  }

  /**
   * Sammelt alle Projekt-IDs aus der Hierarchie
   */
  collectProjectIds(node: GroupNode): number[] {
    const projectIds: number[] = [];

    const traverse = (children: TreeNode[]) => {
      for (const child of children) {
        if (child.type === 'project') {
          projectIds.push(child.id);
        } else if (child.type === 'group') {
          traverse(child.children);
        }
      }
    };

    traverse(node.children);
    return projectIds;
  }

  /**
   * Findet ein Projekt in der Hierarchie und aktualisiert es
   */
  updateProjectInHierarchy(
    node: GroupNode,
    projectId: number,
    updateFn: (project: ProjectNode) => ProjectNode
  ): GroupNode {
    const updateChildren = (children: TreeNode[]): TreeNode[] => {
      return children.map((child) => {
        if (child.type === 'project' && child.id === projectId) {
          return updateFn(child);
        } else if (child.type === 'group') {
          return {
            ...child,
            children: updateChildren(child.children),
          };
        }
        return child;
      });
    };

    return {
      ...node,
      children: updateChildren(node.children),
    };
  }

  /**
   * Expandiert/Kollabiert eine Gruppe
   */
  toggleGroup(node: GroupNode, groupId: number): GroupNode {
    if (node.id === groupId) {
      return { ...node, expanded: !node.expanded };
    }

    const toggleChildren = (children: TreeNode[]): TreeNode[] => {
      return children.map((child) => {
        if (child.type === 'group') {
          return this.toggleGroup(child, groupId);
        }
        return child;
      });
    };

    return {
      ...node,
      children: toggleChildren(node.children),
    };
  }

  /**
   * Expandiert alle Gruppen
   */
  expandAll(node: GroupNode): GroupNode {
    const expandChildren = (children: TreeNode[]): TreeNode[] => {
      return children.map((child) => {
        if (child.type === 'group') {
          return this.expandAll({ ...child, expanded: true });
        }
        return child;
      });
    };

    return {
      ...node,
      expanded: true,
      children: expandChildren(node.children),
    };
  }

  /**
   * Kollabiert alle Gruppen
   */
  collapseAll(node: GroupNode): GroupNode {
    const collapseChildren = (children: TreeNode[]): TreeNode[] => {
      return children.map((child) => {
        if (child.type === 'group') {
          return this.collapseAll({ ...child, expanded: false });
        }
        return child;
      });
    };

    return {
      ...node,
      expanded: false,
      children: collapseChildren(node.children),
    };
  }
}
