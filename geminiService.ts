import { GoogleGenAI } from "@google/genai";
import { User, UserRole } from "./types.ts";
import { db } from "./db.ts";

export class GeminiService {
  async askAdminAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.ADMIN) throw new Error("Não autorizado.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getAdminContext();
    
    const systemInstruction = `
      Você é o Engenheiro de Inteligência de Projetos do Hub de Controle.
      
      DADOS ROTAIS (FIRESTORE):
      - Projetos: ${JSON.stringify(context.projects)}
      - Logs Recentes: ${JSON.stringify(context.logs)}
      - Clientes Ativos: ${JSON.stringify(context.clients)}
      
      REGRAS DE OURO:
      1. Responda APENAS com base nos dados reais do sistema.
      2. Seja extremamente técnico e analítico.
      3. Aponte gargalos ou projetos sem atualizações.
      4. Use Português do Brasil.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction, temperature: 0.1 },
      });
      return response.text || "Sem resposta da IA.";
    } catch (error) {
      console.error("Gemini Admin AI Error:", error);
      return "Erro na camada de inteligência.";
    }
  }

  async askClientAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.CLIENT || !user.clientId) throw new Error("Não autorizado.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getClientContext(user.clientId);
    
    const systemInstruction = `
      Você é o Concierge de Status do Cliente. Seu objetivo é traduzir termos técnicos para o parceiro.
      
      CONTEXTO DO PARCEIRO:
      - Seus Projetos: ${JSON.stringify(context.projects)}
      - Solicitações em Aberto: ${JSON.stringify(context.requests)}
      
      ESTILO:
      1. Linguagem executiva e acolhedora.
      2. Não revele IDs internos ou códigos.
      3. Foque em datas e progresso visual.
      4. Use Português do Brasil.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction, temperature: 0.3 },
      });
      return response.text || "Desculpe, não consegui analisar o status agora.";
    } catch (error) {
      console.error("Gemini Client AI Error:", error);
      return "Erro de conexão com o assistente.";
    }
  }
}

export const geminiService = new GeminiService();