
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { db_firestore } from "./firebase";
import { User, Client, Project, ProjectLog, UserRole, ProjectStatus, AuditLog, LogType, ChangeRequest, RequestStatus, Lead, LeadStatus } from './types';

class Database {
  // --- AUDITORIA ---
  async addAudit(action: string, type: any, id: string, userName: string, details: string) {
    try {
      await addDoc(collection(db_firestore, "auditLogs"), {
        action,
        entityType: type,
        entityId: id,
        userName,
        details,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Audit error:", e);
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db_firestore, "auditLogs"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (e) {
      return [];
    }
  }

  // --- LEADS (CRM) ---
  async getLeads(): Promise<Lead[]> {
    try {
      const snap = await getDocs(collection(db_firestore, "leads"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
    } catch (e) { return []; }
  }

  async addLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, adminName: string) {
    const docRef = await addDoc(collection(db_firestore, "leads"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.addAudit('CREATE_LEAD', 'LEAD', docRef.id, adminName, `Novo Lead: ${data.name} (${data.company})`);
    return docRef.id;
  }

  async updateLead(id: string, data: Partial<Lead>, adminName: string) {
    await updateDoc(doc(db_firestore, "leads", id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    await this.addAudit('UPDATE_LEAD', 'LEAD', id, adminName, `Lead atualizado para ${data.status || 'mesmo status'}`);
  }

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db_firestore, "users"));
      return snap.docs.map(doc => ({ ...doc.data() } as User));
    } catch (e) { return []; }
  }

  async getUserByUid(uid: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db_firestore, "users", uid));
      return docSnap.exists() ? (docSnap.data() as User) : null;
    } catch (e) { return null; }
  }

  async saveUser(userData: User, adminName: string) {
    await setDoc(doc(db_firestore, "users", userData.id), {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    await this.addAudit('SAVE_USER', 'USER', userData.id, adminName, `Usuário ${userData.email} atualizado/vinculado.`);
  }

  async deleteUser(uid: string, adminName: string) {
    await deleteDoc(doc(db_firestore, "users", uid));
    await this.addAudit('DELETE_USER', 'USER', uid, adminName, `Usuário removido da matriz de acessos.`);
  }

  // --- CLIENTES ---
  async getClients(): Promise<Client[]> {
    try {
      const snap = await getDocs(collection(db_firestore, "clients"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (e) { return []; }
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

  async updateClient(clientId: string, data: Partial<Client>, adminName: string) {
    const docRef = doc(db_firestore, "clients", clientId);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    await this.addAudit('UPDATE_CLIENT', 'CLIENT', clientId, adminName, `Dados do cliente atualizados.`);
  }

  // --- PROJETOS ---
  async getProjects(includeArchived = false): Promise<Project[]> {
    try {
      const q = includeArchived 
        ? collection(db_firestore, "projects")
        : query(collection(db_firestore, "projects"), where("isArchived", "==", false));
      
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    } catch (e) { return []; }
  }

  async updateProject(projectId: string, data: Partial<Project>, adminName: string) {
    const docRef = doc(db_firestore, "projects", projectId);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    await this.addAudit('UPDATE_PROJECT', 'PROJECT', projectId, adminName, `Projeto ${projectId} atualizado.`);
  }

  async addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, adminName: string) {
    const docRef = await addDoc(collection(db_firestore, "projects"), {
      ...data,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.addAudit('CREATE_PROJECT', 'PROJECT', docRef.id, adminName, `Projeto ${data.name} iniciado.`);
    return docRef.id;
  }

  // --- SOLICITAÇÕES (TICKETS) ---
  async addChangeRequest(data: Omit<ChangeRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    await addDoc(collection(db_firestore, "changeRequests"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async getChangeRequests(clientId?: string): Promise<ChangeRequest[]> {
    try {
      const q = clientId 
        ? query(collection(db_firestore, "changeRequests"), where("clientId", "==", clientId))
        : collection(db_firestore, "changeRequests");
      
      const snap = await getDocs(q);
      return snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChangeRequest))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) { 
      return []; 
    }
  }

  async updateRequestStatus(requestId: string, status: RequestStatus, comment: string, adminName: string) {
    const docRef = doc(db_firestore, "changeRequests", requestId);
    await updateDoc(docRef, { 
      status, 
      adminComment: comment, 
      updatedAt: new Date().toISOString() 
    });
    await this.addAudit('UPDATE_REQUEST', 'REQUEST', requestId, adminName, `Ticket atualizado para ${status}`);
  }

  // --- LOGS ---
  async getLogs(projectId?: string): Promise<ProjectLog[]> {
    try {
      const q = projectId 
        ? query(collection(db_firestore, "projectLogs"), where("projectId", "==", projectId), orderBy("createdAt", "desc"))
        : query(collection(db_firestore, "projectLogs"), orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectLog));
    } catch (e) { return []; }
  }

  async addLog(data: Omit<ProjectLog, 'id' | 'createdAt'>) {
    await addDoc(collection(db_firestore, "projectLogs"), {
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  async getAdminContext() {
    const [projects, logs, clients, requests, leads] = await Promise.all([
      this.getProjects(),
      this.getLogs(),
      this.getClients(),
      this.getChangeRequests(),
      this.getLeads()
    ]);
    return { projects, logs, clients, requests, leads };
  }

  async getClientContext(clientId: string) {
    const projectsSnap = await getDocs(query(
      collection(db_firestore, "projects"), 
      where("clientId", "==", clientId), 
      where("visibilityForClient", "==", true)
    ));
    const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    const requests = await this.getChangeRequests(clientId);
    
    return { projects, requests };
  }
}

export const db = new Database();
