export interface GitLabConfig {
  apiUrl: string;
  privateToken: string;
  rootGroupId: string;
}

export interface GitLabGroup {
  id: number;
  name: string;
  full_path: string;
  description?: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
}

export interface GitLabPipeline {
  id: number;
  project_id: number;
  status: PipelineStatus;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
}

export type PipelineStatus =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled';

export interface ProjectWithPipeline {
  project: GitLabProject;
  pipeline?: GitLabPipeline;
  loading: boolean;
  error?: string;
}

export interface ScannedData {
  projectIds: number[];
  lastScan: string;
  rootGroupId: string;
  hierarchy?: GroupNode;
}

export interface GroupNode {
  id: number;
  name: string;
  full_path: string;
  type: 'group';
  expanded: boolean;
  children: TreeNode[];
}

export interface ProjectNode {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  type: 'project';
  pipeline?: GitLabPipeline;
  loading: boolean;
  error?: string;
}

export type TreeNode = GroupNode | ProjectNode;

export interface FilterOptions {
  searchTerm: string;
  pipelineStatus: PipelineStatus | 'all' | 'active' | 'none';
  showOnlyWithPipelines: boolean;
}
