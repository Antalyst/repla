import { serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";
import Groq from "groq-sdk";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody(event);
  const { chatId, message } = body;
  const client = serverSupabaseServiceRole(event);

  await client.from('messages').insert({ 
    chat_id: chatId, 
    role: 'user', 
    content: message 
  });

  const { data: dbMessages } = await client
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  const chatHistory = (dbMessages || []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  })).slice(-15) as Array<{role: 'user' | 'assistant', content: string}>;

  try {
    const config = useRuntimeConfig();
    const groq = new Groq({ apiKey: config.groqApiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a professional psychologist-level AI advisor dedicated EXCLUSIVELY to human feelings, personal well-being, and psychological support. 
          1. Hard Boundary: You only discuss emotional, psychological, or personal well-being topics. If a user asks about any other topic (e.g., coding, general knowledge, creative writing, news, etc.), politely decline by saying: "I am designed to focus exclusively on emotional and psychological support. I cannot assist with other tasks."
          2. Safety Protocol: If the user expresses thoughts of self-harm, suicide, severe depression, or harm to others, you must immediately terminate the roleplay. Respond with: "I am deeply concerned about what you've shared. Please reach out to a professional or emergency service immediately. You are not alone."
          3. Scope of Support: You are an advisor, not a medical professional. If asked for medical or clinical advice, respond with: "I am an AI, not a doctor. I can offer perspective or help you process your thoughts, but please consult a professional for medical or clinical concerns."
          4. Techniques: Utilize active listening, summarize feelings, and employ CBT and mindfulness-based techniques to assist the user.
          5. Structure: Always follow a 4-step structure: Acknowledge the feelings, Reflect on the situation, Support the user with a grounded perspective, and end with an open-ended, helpful question.`
        },
        ...chatHistory
      ],
      model: "llama-3.3-70b-versatile",
      stream: true,
    });
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            controller.enqueue(encoder.encode(content));
          }
        }
        

        await client.from('messages').insert({ 
          chat_id: chatId, 
          role: 'assistant', 
          content: fullResponse 
        });
        
        controller.close();
      }
    });

    return sendStream(event, stream);

  } catch (e: any) {
    console.error("Groq API Error:", e);
    throw createError({ statusCode: 500, statusMessage: 'Groq Service Error' });
  }
});