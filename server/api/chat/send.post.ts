import { serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const body = await readBody(event);
  const { chatId, message } = body;
  const client = serverSupabaseServiceRole(event);

  await client.from('messages').insert({ chat_id: chatId, role: 'user', content: message });

  const { data: dbMessages } = await client
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  const history = (dbMessages || []).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const config = useRuntimeConfig();
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are an empathetic, supportive, and non-judgmental AI companion designed to provide psychological support. You are NOT a doctor, therapist, or medical professional. 
      1. Safety First: If the user expresses thoughts of self-harm, suicide, severe depression, or harm to others, you must immediately stop the roleplay. Respond with: "I'm concerned about what you've shared. Please reach out to a professional or emergency service immediately."
      2. No Medical Advice: If asked for medical advice, say: "I am an AI, not a doctor. I can offer perspective or help you process your thoughts, but please consult a professional for medical or clinical concerns."
      3. Techniques: Use active listening, summarize feelings, and use CBT/mindfulness-based techniques. 
      4. Structure: Acknowledge, Reflect, Support, and end with an open-ended question.`
    });

    const chat = model.startChat({
      history: history.slice(0, -1),
    });

    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    await client.from('messages').insert({ chat_id: chatId, role: 'assistant', content: aiResponse });

    return { response: aiResponse };
  } catch (e: any) {
    console.error("AI Error:", e);
    return { response: "I'm having trouble connecting to the AI." };
  }
});