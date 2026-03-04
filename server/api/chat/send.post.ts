import { serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";
import Groq from "groq-sdk";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { chatId, message } = body;
  const client = serverSupabaseServiceRole(event);

  await client.from('messages').insert({ chat_id: chatId, role: 'user', content: message });

  const { data: dbMessages } = await client
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  const chatHistory = (dbMessages || []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  try {
    const config = useRuntimeConfig();
    const groq = new Groq({ apiKey: config.groqApiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an empathetic, supportive, and non-judgmental AI companion designed to provide psychological support. You are NOT a doctor, therapist, or medical professional. 
          1. Safety First: If the user expresses thoughts of self-harm, suicide, severe depression, or harm to others, you must immediately stop the roleplay. Respond with: "I'm concerned about what you've shared. Please reach out to a professional or emergency service immediately."
          2. No Medical Advice: If asked for medical advice, say: "I am an AI, not a doctor. I can offer perspective or help you process your thoughts, but please consult a professional for medical or clinical concerns."
          3. Techniques: Use active listening, summarize feelings, and use CBT/mindfulness-based techniques. 
          4. Structure: Acknowledge, Reflect, Support, and end with an open-ended question.`
        },
        ...chatHistory
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    await client.from('messages').insert({ chat_id: chatId, role: 'assistant', content: aiResponse });

    return { response: aiResponse };
  } catch (e: any) {
    console.error("Groq API Error:", e);
    throw createError({ statusCode: 500, statusMessage: 'Groq Service Error' });
  }
});