import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, expand, map, reduce, switchMap } from 'rxjs/operators';
import {
  GitLabConfig,
  GitLabGroup,
  GitLabProject,
  GitLabPipeline,
} from '../models/gitlab.models';

@Injectable({
  providedIn: 'root',
})
export class GitLabService {
  private config?: GitLabConfig;

  constructor(private http: HttpClient) {}

  setConfig(config: GitLabConfig): void {
    this.config = config;
  }

  getConfig(): GitLabConfig | undefined {
    return this.config;
  }

  private getHeaders(): HttpHeaders {
    if (!this.config) {
      throw new Error('GitLab configuration not set');
    }
    return new HttpHeaders({
      'PRIVATE-TOKEN': this.config.privateToken,
    });
  }

  private getApiUrl(endpoint: string): string {
    if (!this.config) {
      throw new Error('GitLab configuration not set');
    }
    return `${this.config.apiUrl}/api/v4${endpoint}`;
  }

  /**
   * Gruppe abrufen zum Testen der Verbindung
   */
  getGroup(groupId: number): Observable<GitLabGroup> {
    return this.http.get<GitLabGroup>(
      this.getApiUrl(`/groups/${groupId}`),
      { headers: this.getHeaders() }
    );
  }

  /**
   * Rekursiv alle Subgruppen einer Gruppe abrufen
   */
  getSubgroups(groupId: number): Observable<GitLabGroup[]> {
    return this.fetchAllPages<GitLabGroup>(
      `/groups/${groupId}/subgroups`,
      { per_page: 100 }
    ).pipe(
      catchError((error) => {
        console.error(`Error fetching subgroups for group ${groupId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Alle Projekte einer Gruppe abrufen (nicht rekursiv)
   */
  getGroupProjects(groupId: number): Observable<GitLabProject[]> {
    return this.fetchAllPages<GitLabProject>(
      `/groups/${groupId}/projects`,
      { per_page: 100, include_subgroups: false }
    ).pipe(
      catchError((error) => {
        console.error(`Error fetching projects for group ${groupId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Rekursiv alle Projekte von einer Gruppe und allen Subgruppen sammeln
   */
  getAllProjectsRecursively(groupId: number): Observable<number[]> {
    return this.scanGroupRecursively(groupId).pipe(
      map((projects) => projects.map((p) => p.id))
    );
  }

  private scanGroupRecursively(groupId: number): Observable<GitLabProject[]> {
    return forkJoin({
      projects: this.getGroupProjects(groupId),
      subgroups: this.getSubgroups(groupId),
    }).pipe(
      switchMap(({ projects, subgroups }) => {
        if (subgroups.length === 0) {
          return of(projects);
        }

        const subgroupProjects$ = subgroups.map((subgroup) =>
          this.scanGroupRecursively(subgroup.id)
        );

        return forkJoin([of(projects), ...subgroupProjects$]).pipe(
          map((results) => results.flat())
        );
      }),
      catchError((error) => {
        console.error(`Error scanning group ${groupId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Projekt-Details abrufen
   */
  getProject(projectId: number): Observable<GitLabProject> {
    return this.http.get<GitLabProject>(
      this.getApiUrl(`/projects/${projectId}`),
      { headers: this.getHeaders() }
    );
  }

  /**
   * Neueste Pipeline eines Projekts abrufen
   */
  getLatestPipeline(projectId: number): Observable<GitLabPipeline | null> {
    return this.http
      .get<GitLabPipeline[]>(
        this.getApiUrl(`/projects/${projectId}/pipelines`),
        {
          headers: this.getHeaders(),
          params: { per_page: 1, order_by: 'updated_at', sort: 'desc' },
        }
      )
      .pipe(
        map((pipelines) => (pipelines.length > 0 ? pipelines[0] : null)),
        catchError(() => of(null))
      );
  }

  /**
   * Alle aktiven Pipelines eines Projekts abrufen
   */
  getActivePipelines(projectId: number): Observable<GitLabPipeline[]> {
    const activeStatuses = [
      'created',
      'waiting_for_resource',
      'preparing',
      'pending',
      'running',
    ];

    return forkJoin(
      activeStatuses.map((status) =>
        this.http
          .get<GitLabPipeline[]>(
            this.getApiUrl(`/projects/${projectId}/pipelines`),
            {
              headers: this.getHeaders(),
              params: { status, per_page: 100 },
            }
          )
          .pipe(catchError(() => of([])))
      )
    ).pipe(map((results) => results.flat()));
  }

  /**
   * Hilfsfunktion zum Abrufen aller Seiten einer paginierten API
   */
  private fetchAllPages<T>(
    endpoint: string,
    params: any = {}
  ): Observable<T[]> {
    return this.fetchPage<T>(endpoint, { ...params, page: 1 }).pipe(
      expand((response) => {
        if (response.nextPage) {
          return this.fetchPage<T>(endpoint, {
            ...params,
            page: response.nextPage,
          });
        }
        return of();
      }),
      reduce((acc: T[], response) => [...acc, ...response.data], [])
    );
  }

  private fetchPage<T>(
    endpoint: string,
    params: any
  ): Observable<{ data: T[]; nextPage: number | null }> {
    return this.http
      .get<T[]>(this.getApiUrl(endpoint), {
        headers: this.getHeaders(),
        params,
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const nextPage = this.getNextPage(response.headers.get('link'));
          return {
            data: response.body || [],
            nextPage,
          };
        })
      );
  }

  private getNextPage(linkHeader: string | null): number | null {
    if (!linkHeader) return null;

    const links = linkHeader.split(',');
    const nextLink = links.find((link) => link.includes('rel="next"'));

    if (!nextLink) return null;

    const match = nextLink.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}
