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
const messages = ref<any[]>([]);
const activeChatId = ref(null);
const newMessage = ref('');
const isAiLoading = ref(false);

onMounted(async () => {
  const chat = await $fetch('/api/chat/get-or-create', { method: 'POST' });
  activeChatId.value = chat.id;
  await loadMessages();
});

const loadMessages = async () => {
  const data = await $fetch('/api/chat/messages');
  messages.value = Array.isArray(data) ? data : [];
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || !activeChatId.value) return;

  messages.value.push({ id: Date.now(), role: 'user', content: text });
  newMessage.value = '';
  isAiLoading.value = true;

  try {
    const res = await $fetch('/api/chat/send', {
      method: 'POST',
      body: { chatId: activeChatId.value, message: text }
    });

    messages.value.push({ id: Date.now() + 1, role: 'assistant', content: res.response });
  } catch (e) {
    console.error("Failed to send:", e);
    messages.value.pop();
    alert("Error sending message.");
  } finally {
    isAiLoading.value = false;
  }
};
</script>