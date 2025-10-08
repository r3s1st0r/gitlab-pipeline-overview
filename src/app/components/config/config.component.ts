import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GitLabService } from '../../services/gitlab.service';
import { StorageService } from '../../services/storage.service';
import { ThemeService } from '../../services/theme.service';
import { GitLabConfig } from '../../models/gitlab.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent {
  config: GitLabConfig = {
    apiUrl: 'https://gitlab.com',
    privateToken: '',
    rootGroupId: '',
  };

  error: string | null = null;
  loading = false;
  darkMode = false;

  constructor(
    private gitlabService: GitLabService,
    private storageService: StorageService,
    private router: Router,
    public themeService: ThemeService
  ) {
    // Load saved configuration (without token)
    const savedConfig = this.storageService.getConfig();
    if (savedConfig) {
      this.config.apiUrl = savedConfig.apiUrl || this.config.apiUrl;
      this.config.rootGroupId = savedConfig.rootGroupId || '';
    }

    // Subscribe to dark mode changes
    this.darkMode = this.themeService.isDarkMode();
    this.themeService.darkMode$.subscribe((isDark) => {
      this.darkMode = isDark;
    });
  }

  onSubmit(): void {
    if (!this.config.apiUrl || !this.config.privateToken || !this.config.rootGroupId) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.error = null;
    this.loading = true;

    // Set configuration temporarily to test
    this.gitlabService.setConfig(this.config);

    const groupId = parseInt(this.config.rootGroupId, 10);

    // Test API connection by fetching the group
    forkJoin({
      user: this.gitlabService.getCurrentUser(),
      group: this.gitlabService.getGroup(groupId),
    }).subscribe({
      next: (result) => {
        // Connection successful
        this.storageService.saveConfig(this.config);
        this.loading = false;
        this.router.navigate(['/pipelines']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.error = 'Invalid Private Token. Please check your token.';
        } else if (err.status === 404) {
          this.error = 'Group not found. Please check the Group ID.';
        } else if (err.status === 403) {
          this.error = 'Access denied. Please check your permissions.';
        } else {
          this.error = 'Connection failed: ' + (err.message || 'Unknown error');
        }
        console.error('API validation error:', err);
      },
    });
  }
}
