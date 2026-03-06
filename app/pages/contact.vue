<template>
     <ion-page class="h-full relative">
      <div>
        
      </div>
    <div class="absolute -bottom-[340px] right-50 w-[600px] h-[600px] bg-[#45BEFF] rounded-full blur-[50px] -z-[10] animate-blob-float"></div>

    <div v-if="isInitialLoading" class="flex flex-col items-center justify-center h-full bg-white">
      <img src="/logo.png" alt="Logo" class="w-32 h-32 animate-pulse" />
    </div>

    <div v-else class="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <header class="flex justify-between items-center p-4 z-10">
        <ion-button fill="clear" color="dark"><ion-icon name="chevron-back-outline"></ion-icon></ion-button>
        <span class="font-semibold text-gray-700">Repla <span class="text-green-500 text-xs">● Active</span></span>
        <ion-button fill="clear" color="dark" @click="isSettingsModalOpen = true">
          <Icon name="mdi:gear" class="scale-150 text-[#45BEFF]" />
        </ion-button>
      </header>

      <ion-content class="ion-padding" ref="contentRef">
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full space-y-6">
          <img src="/logo.png" alt="Mascot" class="w-40 h-40" />
          <p class="text-center text-gray-600 px-6">I'm Repla, ready to listen whenever you need to talk.</p>
          <div class="flex flex-wrap justify-center gap-2 mt-4">
            <button v-for="suggestion in suggestions" :key="suggestion" 
                    @click="newMessage = suggestion; sendMessage()"
                    class="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-full text-sm shadow-sm hover:bg-blue-50 transition">
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col space-y-4 py-4">
          <div v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id"
               :class="['p-3 rounded-2xl max-w-[80%] shadow-sm whitespace-pre-wrap', msg.role === 'user' ? 'bg-[#45BEFF] text-white self-end' : 'bg-white border text-gray-800 self-start']">
            {{ msg.content }}
          </div>
          <div v-if="isAiLoading" class="text-gray-400 self-start text-sm italic animate-pulse">Repla is thinking...</div>
        </div>
      </ion-content>

      <footer class="p-4 bg-transparent">
        <div class="flex items-end gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg ring-1 ring-black/5">
          <textarea
            v-model="newMessage"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isAiLoading"
            rows="1"
            class="flex-1 bg-transparent focus:outline-none px-2 py-1 text-gray-700 placeholder-gray-400 resize-none overflow-y-auto max-h-32"
            placeholder="Message"
          ></textarea>
          <button @click="sendMessage" :disabled="isAiLoading || !newMessage.trim()" class="transition-opacity disabled:opacity-50 pb-1">
            <Icon name="material-symbols:send-rounded" class="text-[#45BEFF] text-2xl" />
          </button>
        </div>
      </footer>
    </div>

    <ion-modal :is-open="isSettingsModalOpen" @did-dismiss="isSettingsModalOpen = false" class="h-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">Settings</h2>
          <button @click="isSettingsModalOpen = false">
            <Icon name="hugeicons:multiplication-sign" class="scale-150 text-[#45BEFF]" />
          </button>
        </div>

        <div class="flex flex-col items-center mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <img src="/logo.png" alt="Profile" class="w-20 h-20 rounded-full border-4 border-white shadow-md mb-4" />
          <h1 class="text-xl font-bold text-gray-800">{{ user?.user_metadata?.display_name || 'Repliance' }}</h1>
          <h1 class="text-xl font-bold text-gray-800">{{ user?.user_metadata?.email || 'Repliance' }}</h1>
        </div>
        
        <div class="flex gap-2 mb-4">
          <input v-model="searchQuery" placeholder="Search conversations..." class="flex-1 p-3 bg-gray-100 rounded-xl text-sm focus:ring-2 ring-[#45BEFF] outline-none transition" />
          <button @click="performSearch" class="bg-[#45BEFF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-400 transition">
            Search
          </button>
        </div>

        <div class="max-h-[300px] overflow-y-auto mb-6">
          <div v-if="isSearching" class="text-center py-4 text-sm text-gray-400">Searching...</div>
          
          <div v-else-if="searchResults.length > 0">
              <button v-for="msg in searchResults" :key="msg.id" 
                      @click="switchChat(msg.chat_id, msg.id)" 
                      class="w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition">
                
                <div class="mb-1">
                  <span :class="['text-[10px] uppercase font-bold px-1.5 py-0.5 rounded', 
                                msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700']">
                    {{ msg.role === 'user' ? 'You' : 'Repla' }}
                   <span class="text-[10px] text-gray-500 font-medium">
                      {{ new Date(msg.created_at).toLocaleTimeString([], {year:"numeric",month:"2-digit",day:"2-digit", hour: '2-digit', minute: '2-digit' }) }}
                    </span>
                  </span>
                </div>

                <p class="font-bold text-gray-800 text-sm truncate">{{ msg.content }}</p>
                <p class="text-xs text-gray-400">Jump to conversation</p>
              </button>
            </div>
          
          <div v-else-if="searchQuery.trim().length > 0" class="text-center py-4 text-sm text-gray-500">No results found.</div>
          
          <div v-else>
            <button v-for="chat in conversations" :key="chat.id" @click="switchChat(chat.id)" class="w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition">
              <p class="font-medium text-gray-800 text-sm">Chat {{ chat.id.slice(0,8) }}</p>
            </button>
          </div>
        </div>

        <div>
          <button @click="handleLogout" class="w-full flex items-center justify-center gap-3 bg-[#45BEFF] text-white p-4 rounded-xl font-semibold shadow-md shadow-blue-100 hover:bg-blue-400 transition-all">
            <Icon name="mdi:logout" class="text-white scale-125" />
            Log Out
          </button>
        </div>
      </div>
    </ion-modal>
  </ion-page>

 
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { alertController } from '@ionic/vue';
import { useSupabaseClient, useRuntimeConfig, navigateTo } from '#imports';

const contentRef = ref<any>(null);
const user = ref<any>(null);
const config = useRuntimeConfig();
const API_BASE_URL = config.public.apiBase;
const messages = ref<any[]>([]);
const activeChatId = ref<any>(null);
const newMessage = ref('');
const isAiLoading = ref(false);
const isSettingsModalOpen = ref(false);
const isInitialLoading = ref(true);
const searchQuery = ref('');
const conversations = ref<any[]>([]);
const searchResults = ref<any[]>([]);
const isSearching = ref(false);

const suggestions = ["I'm feeling stressed", "Can we talk about my day?", "I need some motivation"];


const getAuthHeaders = async () => {
  const client = useSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return { 
    'Authorization': `Bearer ${session?.access_token || ''}`, 
    'Content-Type': 'application/json' 
  };
};

const scrollToBottom = async () => {
  await nextTick();
  if (contentRef.value?.$el) contentRef.value.$el.scrollToBottom(300);
};

const scrollToMessage = async (messageId: string) => {
  await nextTick();
  const element = document.getElementById(`msg-${messageId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('bg-blue-100');
    setTimeout(() => element.classList.remove('bg-blue-100'), 2000);
  }
};

const fetchUserProfile = async () => {
  const client = useSupabaseClient();
  const { data: { user: authUser } } = await client.auth.getUser();
  user.value = authUser;
};

const handleLogout = async () => {
  const client = useSupabaseClient();
  await client.auth.signOut();
  isSettingsModalOpen.value = false;
  navigateTo('/');
};

const loadChatHistory = async () => {
  conversations.value = await $fetch(`${API_BASE_URL}/api/chat/list`, { headers: await getAuthHeaders() });
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;
  isSearching.value = true;
  try {
    const encodedQuery = encodeURIComponent(searchQuery.value);
    const headers = await getAuthHeaders();
    
    searchResults.value = await $fetch(`${API_BASE_URL}/api/chat/search?q=${encodedQuery}`, {
      method: 'GET',
      headers: headers 
    });
  } catch (e) {
    console.error("Search error:", e);
  } finally {
    isSearching.value = false;
  }
};


const switchChat = async (chatId: string, messageId?: string) => {
  activeChatId.value = chatId;
  isSettingsModalOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
  await loadMessages(messageId === undefined);
  
  if (messageId) {
    await scrollToMessage(messageId);
  }
};

watch(isSettingsModalOpen, (isOpen) => { 
  if (isOpen) {
    loadChatHistory();
    searchQuery.value = '';
    searchResults.value = [];
  }
});

const showErrorAlert = async (message: string) => {
  const alert = await alertController.create({ header: 'Error', message, buttons: ['OK'] });
  await alert.present();
};

onMounted(async () => {
  try {
    const headers = await getAuthHeaders();
    const chat = await $fetch(`${API_BASE_URL}/api/chat/get-or-create`, { method: 'POST', headers });
    activeChatId.value = chat.id;
    await loadMessages();
    await fetchUserProfile();
    isInitialLoading.value = false;
    scrollToBottom();
  } catch {
    showErrorAlert('Failed to load chat.');
  }
});

const loadMessages = async (shouldScrollToBottom = true) => {
  const headers = await getAuthHeaders();
  const data = await $fetch(`${API_BASE_URL}/api/chat/messages`, { 
    method: 'GET', 
    headers: headers, 
    query: { chatId: activeChatId.value } 
  });
  messages.value = Array.isArray(data) ? data : [];
  
  if (shouldScrollToBottom) {
    scrollToBottom();
  }
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || !activeChatId.value) return;

  messages.value.push({ id: Date.now(), role: 'user', content: text });
  newMessage.value = '';
  isAiLoading.value = true;
  
  const aiMsgId = Date.now() + 1;
  messages.value.push({ id: aiMsgId, role: 'assistant', content: '' });
  scrollToBottom();

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ chatId: activeChatId.value, message: text })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const aiMsg = messages.value.find(m => m.id === aiMsgId);
        if (aiMsg) aiMsg.content += chunk;
        scrollToBottom();
      }
    }
  } catch {
    messages.value.pop();
    showErrorAlert("Couldn't reach the server.");
  } finally {
    isAiLoading.value = false;
  }
};
</script>