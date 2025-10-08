import { Routes } from '@angular/router';
import { ConfigComponent } from './components/config/config.component';
import { PipelinesComponent } from './components/pipelines/pipelines.component';

export const routes: Routes = [
  { path: '', component: ConfigComponent },
  { path: 'pipelines', component: PipelinesComponent },
];
