
import { GoogleGenAI } from "@google/genai";
import { User, UserRole } from "./types";
import { db } from "./db";

export class GeminiService {
  // Always create a new GoogleGenAI instance right before making an API call
  // to ensure it uses the most up-to-date API key.

  async askAdminAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.ADMIN) throw new Error("Não autorizado.");

    // Initialize with process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getAdminContext();
    const systemInstruction = `
      Você é o Engenheiro de Inteligência de Projetos do Hub de Controle.
      
      CONTEXTO DO SISTEMA (FIRESTORE):
      - Projetos: ${JSON.stringify(context.projects)}
      - Logs: ${JSON.stringify(context.logs)}
      - Clientes: ${JSON.stringify(context.clients)}
      
      REGRAS:
      1. Responda APENAS com base nos dados reais do banco.
      2. Use Português do Brasil (PT-BR).
      3. Seja analítico e aponte riscos operacionais.
    `;

    try {
      // Use gemini-3-pro-preview for advanced reasoning and analytics tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction, temperature: 0.1 },
      });
      return response.text || "Sem resposta do motor de IA.";
    } catch (error) {
      console.error("Gemini Admin AI Error:", error);
      return "Erro na comunicação com a IA.";
    }
  }

  async askClientAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.CLIENT || !user.clientId) throw new Error("Não autorizado.");

    // Initialize with process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getClientContext(user.clientId);
    const systemInstruction = `
      Você é o Intérprete de Status do Cliente do Hub.
      
      CONTEXTO EXCLUSIVO (FIRESTORE):
      - Projetos do Cliente: ${JSON.stringify(context.projects)}
      - Atualizações Visíveis: ${JSON.stringify(context.updates)}
      
      REGRAS:
      1. Não use termos técnicos pesados.
      2. Foque no progresso da parceria.
      3. Use Português do Brasil (PT-BR).
    `;

    try {
      // Use gemini-3-flash-preview for general text and Q&A tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction, temperature: 0.3 },
      });
      return response.text || "Desculpe, não consegui processar sua dúvida agora.";
    } catch (error) {
      console.error("Gemini Client AI Error:", error);
      return "Houve um erro ao consultar o status.";
    }
  }
}

export const geminiService = new GeminiService();
