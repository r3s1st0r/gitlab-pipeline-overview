import { Injectable } from '@angular/core';
import { ScannedData, GitLabConfig } from '../models/gitlab.models';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly SCANNED_DATA_KEY = 'gitlab_scanned_data';
  private readonly CONFIG_KEY = 'gitlab_config';

  /**
   * Gescannte Projekt-IDs speichern
   */
  saveScannedData(projectIds: number[], rootGroupId: string): void {
    const data: ScannedData = {
      projectIds,
      lastScan: new Date().toISOString(),
      rootGroupId,
    };
    localStorage.setItem(this.SCANNED_DATA_KEY, JSON.stringify(data));
  }

  /**
   * Gescannte Projekt-IDs laden
   */
  getScannedData(): ScannedData | null {
    const data = localStorage.getItem(this.SCANNED_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Gescannte Daten löschen (für Rescan)
   */
  clearScannedData(): void {
    localStorage.removeItem(this.SCANNED_DATA_KEY);
  }

  /**
   * GitLab-Konfiguration speichern
   */
  saveConfig(config: GitLabConfig): void {
    // Token aus Sicherheitsgründen nicht speichern
    const configToStore = {
      apiUrl: config.apiUrl,
      rootGroupId: config.rootGroupId,
    };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configToStore));
  }

  /**
   * GitLab-Konfiguration laden (ohne Token)
   */
  getConfig(): Partial<GitLabConfig> | null {
    const config = localStorage.getItem(this.CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  }

  /**
   * Prüfen, ob bereits ein Scan durchgeführt wurde
   */
  hasScannedData(rootGroupId: string): boolean {
    const data = this.getScannedData();
    return data !== null && data.rootGroupId === rootGroupId;
  }
}
