
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export enum ProjectStatus {
  IDEIA = 'IDEIA',
  DESENVOLVIMENTO = 'DESENVOLVIMENTO',
  TESTES = 'TESTES',
  PRODUCAO = 'PRODUCAO',
  MANUTENCAO = 'MANUTENCAO',
  PAUSADO = 'PAUSADO',
  CONCLUIDO = 'CONCLUIDO'
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string; // Opcional para projetos internos
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
}

export interface ProjectLog {
  id: string;
  projectId: string;
  logType: string;
  title: string;
  description: string;
  visibleToClient: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
