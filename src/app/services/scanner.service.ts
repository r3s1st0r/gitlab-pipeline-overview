import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { GitLabService } from './gitlab.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  constructor(
    private gitlabService: GitLabService,
    private storageService: StorageService
  ) {}

  /**
   * Projekt-IDs laden oder neu scannen
   * Verwendet gecachte Daten wenn verfügbar, sonst wird ein neuer Scan durchgeführt
   */
  getProjectIds(rootGroupId: string, forceScan = false): Observable<number[]> {
    // Prüfen ob bereits gescannte Daten vorhanden sind
    if (!forceScan && this.storageService.hasScannedData(rootGroupId)) {
      const scannedData = this.storageService.getScannedData();
      if (scannedData) {
        console.log(
          `Using cached project IDs (${scannedData.projectIds.length} projects, last scan: ${scannedData.lastScan})`
        );
        return of(scannedData.projectIds);
      }
    }

    // Neuen Scan durchführen
    console.log(`Starting fresh scan of group ${rootGroupId}...`);
    return this.scanAndStore(rootGroupId);
  }

  /**
   * Führt einen neuen Scan durch und speichert die Ergebnisse
   */
  private scanAndStore(rootGroupId: string): Observable<number[]> {
    const groupId = parseInt(rootGroupId, 10);

    // Zuerst testen ob die Gruppe existiert
    return this.gitlabService.getGroup(groupId).pipe(
      tap((group) => {
        console.log(`Found group: ${group.name} (${group.full_path})`);
      }),
      switchMap(() => this.gitlabService.getAllProjectsRecursively(groupId)),
      tap((projectIds) => {
        console.log(`Scan completed: Found ${projectIds.length} projects`);
        if (projectIds.length > 0) {
          this.storageService.saveScannedData(projectIds, rootGroupId);
        } else {
          console.warn('No projects found in group or subgroups');
        }
      })
    );
  }

  /**
   * Cache löschen und neuen Scan erzwingen
   */
  rescan(rootGroupId: string): Observable<number[]> {
    this.storageService.clearScannedData();
    return this.getProjectIds(rootGroupId, true);
  }

  /**
   * Informationen über den letzten Scan abrufen
   */
  getLastScanInfo(): { lastScan: string; projectCount: number } | null {
    const scannedData = this.storageService.getScannedData();
    if (!scannedData) return null;

    return {
      lastScan: scannedData.lastScan,
      projectCount: scannedData.projectIds.length,
    };
  }
}
