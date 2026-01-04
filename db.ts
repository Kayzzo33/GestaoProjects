
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc, 
  getDoc, 
  setDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db_firestore } from "./firebase";
import { User, Client, Project, ProjectLog, UserRole, ProjectStatus, AuditLog, LogType } from './types';

class Database {
  // --- AUDITORIA ---
  async addAudit(action: string, type: 'PROJECT' | 'CLIENT' | 'USER', id: string, userName: string, details: string) {
    await addDoc(collection(db_firestore, "auditLogs"), {
      action,
      entityType: type,
      entityId: id,
      userName,
      details,
      createdAt: new Date().toISOString()
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const q = query(collection(db_firestore, "auditLogs"), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  }

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db_firestore, "users"));
    return snap.docs.map(doc => ({ ...doc.data() } as User));
  }

  async getUserByUid(uid: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db_firestore, "users", uid));
    return docSnap.exists() ? (docSnap.data() as User) : null;
  }

  async saveUser(userData: User, adminName: string) {
    await setDoc(doc(db_firestore, "users", userData.id), {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    await this.addAudit('SAVE_USER', 'USER', userData.id, adminName, `Usuário ${userData.email} atualizado/criado.`);
  }

  // --- CLIENTES ---
  async getClients(): Promise<Client[]> {
    const snap = await getDocs(collection(db_firestore, "clients"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  async addClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, adminName: string) {
    const docRef = await addDoc(collection(db_firestore, "clients"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.addAudit('CREATE_CLIENT', 'CLIENT', docRef.id, adminName, `Cliente ${data.companyName} cadastrado.`);
    return docRef.id;
  }

  // --- PROJETOS ---
  async getProjects(includeArchived = false): Promise<Project[]> {
    const q = includeArchived 
      ? collection(db_firestore, "projects")
      : query(collection(db_firestore, "projects"), where("isArchived", "==", false));
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  }

  async addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, adminName: string) {
    const docRef = await addDoc(collection(db_firestore, "projects"), {
      ...data,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.addAudit('CREATE_PROJECT', 'PROJECT', docRef.id, adminName, `Projeto ${data.name} iniciado.`);
    
    // Log automático de status inicial
    await this.addLog({
      projectId: docRef.id,
      logType: LogType.MILESTONE,
      title: "Projeto Criado",
      description: `Projeto inicializado com status: ${data.status}`,
      visibleToClient: data.visibilityForClient,
      createdBy: adminName
    });

    return docRef.id;
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus, adminName: string) {
    const docRef = doc(db_firestore, "projects", projectId);
    await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
    await this.addLog({
      projectId,
      logType: LogType.UPDATE,
      title: "Alteração de Status",
      description: `O status do projeto foi alterado para: ${status}`,
      visibleToClient: true,
      createdBy: adminName
    });
  }

  // --- LOGS ---
  async getLogs(projectId?: string): Promise<ProjectLog[]> {
    const q = projectId 
      ? query(collection(db_firestore, "projectLogs"), where("projectId", "==", projectId), orderBy("createdAt", "desc"))
      : query(collection(db_firestore, "projectLogs"), orderBy("createdAt", "desc"), limit(100));
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectLog));
  }

  async addLog(data: Omit<ProjectLog, 'id' | 'createdAt'>) {
    await addDoc(collection(db_firestore, "projectLogs"), {
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  // --- CONTEXTO PARA IA ---
  async getAdminContext() {
    const [projects, logs, clients] = await Promise.all([
      this.getProjects(),
      this.getLogs(),
      this.getClients()
    ]);
    return { projects, logs, clients };
  }

  async getClientContext(clientId: string) {
    const projectsSnap = await getDocs(query(
      collection(db_firestore, "projects"), 
      where("clientId", "==", clientId), 
      where("visibilityForClient", "==", true)
    ));
    const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    const projectIds = projects.map(p => p.id);
    
    if (projectIds.length === 0) return { projects: [], updates: [] };

    const logsSnap = await getDocs(query(
      collection(db_firestore, "projectLogs"), 
      where("projectId", "in", projectIds), 
      where("visibleToClient", "==", true),
      orderBy("createdAt", "desc")
    ));
    const updates = logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectLog));
    
    return { projects, updates };
  }
}

export const db = new Database();
