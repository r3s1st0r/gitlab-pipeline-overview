import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GitLabService } from '../../services/gitlab.service';
import { StorageService } from '../../services/storage.service';
import { GitLabConfig } from '../../models/gitlab.models';

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

  constructor(
    private gitlabService: GitLabService,
    private storageService: StorageService,
    private router: Router
  ) {
    // Load saved configuration (without token)
    const savedConfig = this.storageService.getConfig();
    if (savedConfig) {
      this.config.apiUrl = savedConfig.apiUrl || this.config.apiUrl;
      this.config.rootGroupId = savedConfig.rootGroupId || '';
    }
  }

  onSubmit(): void {
    if (!this.config.apiUrl || !this.config.privateToken || !this.config.rootGroupId) {
      alert('Please fill in all fields');
      return;
    }

    // Set configuration
    this.gitlabService.setConfig(this.config);
    this.storageService.saveConfig(this.config);

    // Navigate to pipeline overview
    this.router.navigate(['/pipelines']);
  }
}
