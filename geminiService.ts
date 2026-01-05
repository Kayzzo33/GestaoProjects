
import { GoogleGenAI } from "@google/genai";
import { User, UserRole, ChangeRequest, Project } from "./types";
import { db } from "./db";

export class GeminiService {
  async askAdminAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.ADMIN) throw new Error("Não autorizado.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getAdminContext();
    const systemInstruction = `
      Você é o Engenheiro de Inteligência de Projetos do Hub de Controle.
      
      CONTEXTO DO SISTEMA (FIRESTORE):
      - Projetos: ${JSON.stringify(context.projects)}
      - Logs: ${JSON.stringify(context.logs)}
      - Clientes: ${JSON.stringify(context.clients)}
      - Solicitações/Tickets: ${JSON.stringify(context.requests)}
      
      REGRAS:
      1. Responda APENAS com base nos dados reais do banco.
      2. Use Português do Brasil (PT-BR).
      3. Seja analítico e aponte riscos operacionais.
    `;

    try {
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

  async suggestTicketResponse(request: ChangeRequest, projectName: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `
      Você é um Senior Tech Support e Gerente de Projetos.
      Seu objetivo é sugerir uma resposta profissional, empática e técnica para o ticket do cliente.
      
      DADOS DO TICKET:
      - Projeto: ${projectName}
      - Título: ${request.title}
      - Descrição: ${request.description}
      - Tipo: ${request.type}
      
      REGRAS:
      1. Se for um BUG, peça desculpas e informe que a equipe de engenharia já está analisando o rastro de logs.
      2. Se for uma MELHORIA ou NOVA FUNCIONALIDADE, agradeça a visão estratégica e informe que será avaliado no próximo roadmap.
      3. Seja conciso e elegante. 
      4. Comece com "Olá! Agradecemos o contato."
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Gere uma sugestão de resposta para este ticket.",
        config: { systemInstruction, temperature: 0.7 },
      });
      return response.text || "Olá! Recebemos sua solicitação e nossa equipe técnica já está analisando os detalhes. Retornaremos em breve.";
    } catch (error) {
      return "Olá! Sua solicitação foi recebida e está em nossa fila de análise prioritária.";
    }
  }

  async askClientAI(user: User, prompt: string): Promise<string> {
    if (user.role !== UserRole.CLIENT || !user.clientId) throw new Error("Não autorizado.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = await db.getClientContext(user.clientId);
    const systemInstruction = `
      Você é o Intérprete de Status do Cliente do Hub.
      
      CONTEXTO EXCLUSIVO (FIRESTORE):
      - Projetos do Cliente: ${JSON.stringify(context.projects)}
      - Atualizações Visíveis: ${JSON.stringify(context.requests)}
      
      REGRAS:
      1. Não use termos técnicos pesados.
      2. Foque no progresso da parceria.
      3. Use Português do Brasil (PT-BR).
    `;

    try {
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
