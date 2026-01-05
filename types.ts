
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export enum ProjectStatus {
  IDEA = 'IDEA',
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  PRODUCTION = 'PRODUCTION',
  MAINTENANCE = 'MAINTENANCE',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export enum LogType {
  UPDATE = 'UPDATE',
  ISSUE = 'ISSUE',
  MILESTONE = 'MILESTONE',
  NOTE = 'NOTE'
}

export enum RequestStatus {
  OPEN = 'OPEN',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DONE = 'DONE'
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Novo campo
  role: UserRole;
  isActive: boolean;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string; 
  email: string;
  phone: string;
  notes: string;
  projectsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string | null; 
  projectType: string;
  stack: string;
  productionUrl: string;
  stagingUrl: string;
  repositoryUrl: string;
  figmaUrl?: string;
  docsUrl?: string;
  status: ProjectStatus;
  visibilityForClient: boolean;
  lighthouseMetrics?: LighthouseMetrics;
  startDate: string;
  expectedEndDate: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  type: 'BUG' | 'IMPROVEMENT' | 'NEW_FEATURE';
  status: RequestStatus;
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  logType: LogType;
  title: string;
  description: string;
  visibleToClient: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'PROJECT' | 'CLIENT' | 'USER' | 'REQUEST';
  entityId: string;
  userName: string;
  details: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ClientRankInfo {
  position: number;
  medal: string;
  category: string;
  color: string;
  message: string;
}
