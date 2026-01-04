
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
  deleteDoc
} from "firebase/firestore";
import { db_firestore } from "./firebase";
import { User, Client, Project, ProjectLog, UserRole, ProjectStatus } from './types';

class Database {
  // --- MÉTODOS DE USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db_firestore, "users"));
    return querySnapshot.docs.map(doc => ({ ...doc.data() } as User));
  }

  async saveUser(userData: User) {
    const docRef = doc(db_firestore, "users", userData.id);
    await setDoc(docRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async getUserByUid(uid: string): Promise<User | null> {
    const docRef = doc(db_firestore, "users", uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as User;
  }

  // --- MÉTODOS DE CLIENTES ---
  async getClients(): Promise<Client[]> {
    const querySnapshot = await getDocs(collection(db_firestore, "clients"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  async addClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db_firestore, "clients"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  // --- MÉTODOS DE PROJETOS ---
  async getProjects(): Promise<Project[]> {
    const querySnapshot = await getDocs(collection(db_firestore, "projects"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  }

  async addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db_firestore, "projects"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  }

  // --- MÉTODOS DE LOGS ---
  async getLogs(): Promise<ProjectLog[]> {
    const querySnapshot = await getDocs(collection(db_firestore, "logs"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectLog));
  }

  async addLog(data: Omit<ProjectLog, 'id' | 'createdAt'>) {
    await addDoc(collection(db_firestore, "logs"), {
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
    const projectsSnapshot = await getDocs(query(collection(db_firestore, "projects"), where("clientId", "==", clientId), where("visibilityForClient", "==", true)));
    const projects = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    const projectIds = projects.map(p => p.id);
    
    if (projectIds.length === 0) return { projects: [], updates: [] };

    const logsSnapshot = await getDocs(query(collection(db_firestore, "logs"), where("projectId", "in", projectIds), where("visibleToClient", "==", true)));
    const updates = logsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectLog));
    
    return { projects, updates };
  }
}

export const db = new Database();
