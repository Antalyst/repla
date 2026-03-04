<template>
  <ion-page>
    <ion-content class="ion-padding" style="--background: #F3F4F6;">
      <div class="flex h-full w-full justify-center">
        <main class="w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div v-for="msg in messages" :key="msg.id" 
                 :class="['max-w-[80%] p-3 rounded-2xl', msg.role === 'user' ? 'bg-[#45BEFF] text-white self-end' : 'bg-gray-200 text-gray-800 self-start']">
              {{ msg.content }}
            </div>
            <div v-if="isAiLoading" class="text-gray-400 self-start text-sm italic">AI is thinking...</div>
          </div>

          <div class="p-4 border-t flex gap-2">
            <input v-model="newMessage" 
                   @keyup.enter="sendMessage"
                   :disabled="isAiLoading"
                   class="flex-1 p-2 border rounded-full outline-none focus:border-[#45BEFF]" 
                   placeholder="Type a message...">
            <button @click="sendMessage" 
                    :disabled="isAiLoading || !newMessage.trim()" 
                    class="bg-[#45BEFF] text-white px-6 rounded-full disabled:bg-gray-300">
              Send
            </button>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { alertController } from '@ionic/vue';

const API_BASE_URL = 'https://repla-theta.vercel.app';

const showErrorAlert = async (message: string) => {
  const alert = await alertController.create({
    header: 'Connection Error',
    message: message,
    buttons: ['OK'],
  });
  await alert.present();
};

const messages = ref<any[]>([]);
const activeChatId = ref<any>(null);
const newMessage = ref('');
const isAiLoading = ref(false);

onMounted(async () => {
  console.log('DEBUG: Contact page mounted')
  
  try {
    const { post, get } = useApi();
    console.log('DEBUG: About to call get-or-create API')
    
    const chat = await post('/api/chat/get-or-create');
    console.log('DEBUG: Chat created/retrieved:', chat)
    
    activeChatId.value = chat.id;
    await loadMessages();
  } catch (error) {
    console.error('DEBUG: Failed to initialize chat:', error);
    console.error('DEBUG: Error details:', {
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      message: error?.message
    });
    
    if (error?.statusCode === 401) {
      showErrorAlert('Authentication expired. Please log in again.');
      // Redirect to login after a short delay
      setTimeout(() => navigateTo('/'), 2000);
    } else {
      showErrorAlert('Failed to load chat. Please try logging in again.');
    }
  }
});

const loadMessages = async () => {
  try {
    const { get } = useApi();
    const data = await get('/api/chat/messages', {
      query: { chatId: activeChatId.value }
    });
    messages.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    showErrorAlert('Failed to load messages.');
  }
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || !activeChatId.value) return;

  messages.value.push({ id: Date.now(), role: 'user', content: text });
  newMessage.value = '';
  isAiLoading.value = true;

  try {
    const { post } = useApi();
    const res = await post('/api/chat/send', {
      chatId: activeChatId.value,
      message: text
    });

    messages.value.push({ id: Date.now() + 1, role: 'assistant', content: res.response });
  } catch (e: any) {
    console.error("Failed to send:", e);
    messages.value.pop();
    
    if (e.statusCode === 401) {
      showErrorAlert('Authentication failed. Please log in again.');
    } else {
      showErrorAlert("The app couldn't reach the server. Ensure you have internet and try again.");
    }
  } finally {
    isAiLoading.value = false;
  }
};
</script>