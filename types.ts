
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

export interface User {
  id: string;
  name: string;
  email: string;
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
  clientId?: string; 
  projectType: string;
  stack: string;
  productionUrl: string;
  stagingUrl: string;
  repositoryUrl: string;
  status: ProjectStatus;
  visibilityForClient: boolean;
  startDate: string;
  expectedEndDate: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  logType: LogType;
  title: string;
  description: string;
  visibleToClient: boolean;
  createdBy: string; // User Name
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'PROJECT' | 'CLIENT' | 'USER';
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
