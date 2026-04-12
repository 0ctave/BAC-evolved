<template>
  <div class="comments-manager">
    <div class="header">
      <div class="title-group">
        <h2>Modération des Commentaires</h2>
        <span class="subtitle">Validez, gérez et répondez aux messages de vos visiteurs</span>
      </div>

      <div class="header-actions">
        <div class="filter-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value" 
            class="filter-btn" 
            :class="{ active: currentTab === tab.value }"
            @click="currentTab = tab.value"
          >
            {{ tab.label }}
            <span v-if="tab.count !== null" class="count-badge">{{ tab.count }}</span>
          </button>
        </div>
        <button class="refresh-btn" @click="fetchData" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
        </button>
      </div>
    </div>

    <div v-if="loading && comments.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des commentaires...</p>
    </div>

    <div v-else-if="filteredComments.length === 0" class="empty-state">
      <svg class="icon-huge" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <h3>Aucun commentaire</h3>
      <p v-if="currentTab === 'en_attente'">Tous les nouveaux commentaires ont été traités !</p>
      <p v-else>Il n'y a aucun commentaire dans cette catégorie.</p>
    </div>

    <div v-else class="comments-list">
      <div v-for="comment in filteredComments" :key="comment.id" class="comment-item" :class="comment.status">
        <div class="comment-sidebar">
          <div class="avatar">
            {{ getInitials(comment) }}
          </div>
          <div v-if="comment.status === 'en_attente'" class="status-indicator warning" title="En attente de relecture"></div>
          <div v-else-if="comment.status === 'published'" class="status-indicator success" title="Publié"></div>
        </div>

        <div class="comment-main">
          <div class="comment-header">
            <div class="author-info">
              <span class="author-name">{{ getAuthorName(comment) }}</span>
              <span class="comment-date">{{ formatDate(comment.date_created) }}</span>
            </div>
            <div class="comment-meta">
              <span v-if="comment.wp_comment_id" class="wp-badge">Importé de WordPress</span>
              <span v-if="comment.is_admin_reply" class="admin-badge">Réponse Admin</span>
            </div>
          </div>

          <div class="comment-content">
            <p>{{ comment.contenu }}</p>
          </div>

          <!-- Section Réponses existantes -->
          <div v-if="getReplies(comment.id).length > 0" class="replies-section">
            <div v-for="reply in getReplies(comment.id)" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <strong>{{ getAuthorName(reply) }}</strong>
                <span>{{ formatDate(reply.date_created) }}</span>
              </div>
              <p>{{ reply.contenu }}</p>
            </div>
          </div>

          <div class="comment-actions">
            <div class="main-actions">
              <button v-if="comment.status === 'en_attente'" class="btn-approve" @click="updateStatus(comment, 'published')" :disabled="processing === comment.id">
                Approuver
              </button>
              <button class="btn-reply" @click="toggleReply(comment.id)">
                {{ activeReplyId === comment.id ? 'Annuler' : 'Répondre' }}
              </button>
            </div>
            <div class="secondary-actions">
              <button v-if="comment.status !== 'archived'" class="btn-archive" @click="updateStatus(comment, 'archived')" :disabled="processing === comment.id">
                Archiver
              </button>
              <button v-if="comment.status === 'archived'" class="btn-restore" @click="updateStatus(comment, 'en_attente')" :disabled="processing === comment.id">
                Restaurer
              </button>
              <button class="btn-delete" @click="deleteComment(comment)" :disabled="processing === comment.id">
                Supprimer
              </button>
            </div>
          </div>

          <!-- Formulaire de réponse -->
          <transition name="fade">
            <div v-if="activeReplyId === comment.id" class="reply-form">
              <textarea 
                v-model="replyContent" 
                placeholder="Votre réponse officielle..." 
                class="reply-textarea"
                rows="3"
              ></textarea>
              <div class="reply-form-actions">
                <button class="btn-submit-reply" @click="submitReply(comment)" :disabled="!replyContent.trim() || submitting">
                  {{ submitting ? 'Envoi...' : 'Envoyer la réponse' }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Notification Overlay -->
    <transition name="slide-up">
      <div v-if="notification" class="notification-toast" :class="notification.type">
        {{ notification.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { config } from '../config';

const api = useApi();
const loading = ref(false);
const submitting = ref(false);
const processing = ref<number | null>(null);
const comments = ref<any[]>([]);
const currentTab = ref('en_attente');
const activeReplyId = ref<number | null>(null);
const replyContent = ref('');
const notification = ref<{ message: string; type: string } | null>(null);

const tabs = [
  { label: 'À relire', value: 'en_attente', count: computed(() => comments.value.filter(c => c.status === 'en_attente' && !c.parent).length) },
  { label: 'Publiés', value: 'published', count: null },
  { label: 'Archivés', value: 'archived', count: null },
  { label: 'Tous', value: 'all', count: null }
];

async function fetchData() {
  loading.value = true;
  try {
    const response = await api.get(`/items/${config.commentsCollection}`, {
      params: {
        fields: ['*', 'client.*'],
        sort: ['-date_created'],
        limit: -1
      }
    });
    comments.value = response.data.data;
  } catch (err) {
    console.error("Erreur lors du chargement des commentaires:", err);
    showNotification("Erreur de chargement", "error");
  } finally {
    loading.value = false;
  }
}

const filteredComments = computed(() => {
  // On ne montre que les commentaires "racines" dans la liste principale
  let base = comments.value.filter(c => !c.parent);
  
  if (currentTab.value === 'all') return base;
  return base.filter(c => c.status === currentTab.value);
});

function getReplies(commentId: number) {
  return comments.value.filter(c => {
    const pId = typeof c.parent === 'object' ? c.parent?.id : c.parent;
    return pId === commentId;
  }).sort((a, b) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
}

async function updateStatus(comment: any, newStatus: string) {
  processing.value = comment.id;
  try {
    await api.patch(`/items/${config.commentsCollection}/${comment.id}`, { status: newStatus });
    comment.status = newStatus;
    showNotification(`Commentaire ${newStatus === 'published' ? 'publié' : 'mis à jour'}`);
  } catch (err) {
    console.error(err);
    showNotification("Erreur lors de la mise à jour", "error");
  } finally {
    processing.value = null;
  }
}

async function deleteComment(comment: any) {
  if (!confirm("Voulez-vous vraiment supprimer définitivement ce commentaire ?")) return;
  processing.value = comment.id;
  try {
    // 1. Fetch all descendants from the database to be sure we don't miss anything (professional approach)
    // We fetch recursively by getting all items that have this comment as a root or parent
    const response = await api.get(`/items/${config.commentsCollection}`, {
      params: {
        fields: ['id', 'parent'],
        filter: {
          // This matches the current comment or any of its descendants
          // Directus doesn't have a native recursive delete, so we collect them
          _or: [
            { id: { _eq: comment.id } },
            { parent: { id: { _eq: comment.id } } }
          ],
          limit: -1
        }
      }
    });

    const allRelated = response.data.data;
    const idsToDelete: any[] = [];
    
    // 2. Build a local tree from fetched data to determine deletion order
    const buildDeletionOrder = (id: any) => {
      const children = allRelated.filter((item: any) => {
        const pId = typeof item.parent === 'object' ? item.parent?.id : item.parent;
        return pId != null && String(pId) === String(id);
      });
      
      for (const child of children) {
        buildDeletionOrder(child.id);
      }
      
      if (!idsToDelete.includes(id)) {
        idsToDelete.push(id);
      }
    };
    
    buildDeletionOrder(comment.id);

    // 3. Sequential deletion: leaf to root
    for (const id of idsToDelete) {
      await api.delete(`/items/${config.commentsCollection}/${id}`);
    }
    
    // 4. Update UI
    const stringIds = idsToDelete.map(id => String(id));
    comments.value = comments.value.filter(c => !stringIds.includes(String(c.id)));
    
    showNotification("Commentaire et ses réponses supprimés");
  } catch (err) {
    console.error("Erreur lors de la suppression:", err);
    showNotification("Erreur lors de la suppression", "error");
    await fetchData();
  } finally {
    processing.value = null;
  }
}

function toggleReply(id: number) {
  if (activeReplyId.value === id) {
    activeReplyId.value = null;
    replyContent.value = '';
  } else {
    activeReplyId.value = id;
    replyContent.value = '';
  }
}

async function submitReply(parentComment: any) {
  if (!replyContent.value.trim()) return;
  submitting.value = true;
  try {
    const payload = {
      contenu: replyContent.value,
      parent: parentComment.id,
      status: 'published', // Les réponses admin sont publiées directement
      is_admin_reply: true,
      date_created: new Date().toISOString()
    };

    const res = await api.post(`/items/${config.commentsCollection}`, payload);
    
    // Si le parent était en attente, on le publie aussi car on y répond
    if (parentComment.status === 'en_attente') {
      await api.patch(`/items/${config.commentsCollection}/${parentComment.id}`, { status: 'published' });
      parentComment.status = 'published';
    }

    comments.value.unshift(res.data.data);
    activeReplyId.value = null;
    replyContent.value = '';
    showNotification("Réponse envoyée et publiée");
    await fetchData(); // Refresh pour avoir les relations propres
  } catch (err) {
    showNotification("Erreur lors de l'envoi", "error");
  } finally {
    submitting.value = false;
  }
}

function getAuthorName(comment: any) {
  if (comment.is_admin_reply) return "Bordeaux à Coeur (Admin)";
  if (comment.pseudonyme) return comment.pseudonyme;
  const client = comment.client;
  if (typeof client === 'object' && client !== null) {
    return `${client.prenom || ''} ${client.nom || ''}`.trim() || client.email || 'Anonyme';
  }
  return 'Visiteur';
}

function getInitials(comment: any) {
  const name = getAuthorName(comment);
  return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(date: string) {
  if (!date) return '';
  return format(parseISO(date), 'd MMM yyyy à HH:mm', { locale: fr });
}

function showNotification(message: string, type = 'success') {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.comments-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.title-group h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: var(--theme--primary); }
.subtitle { color: var(--theme--foreground-subdued); font-size: 0.9rem; font-weight: 600; }

.header-actions { display: flex; align-items: center; gap: 16px; }

.filter-tabs {
  display: flex;
  background: var(--theme--background-subdued);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--theme--border-color-subdued);
}

.filter-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--theme--foreground-subdued);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.filter-btn.active {
  background: var(--theme--background);
  color: var(--theme--primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.count-badge {
  background: var(--theme--danger);
  color: white;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.refresh-btn {
  background: var(--theme--background-subdued);
  border: 1px solid var(--theme--border-color);
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--theme--foreground);
  transition: all 0.2s;
}
.spinning { animation: spin 1s linear infinite; }

/* Liste des commentaires */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
}

.comment-item {
  display: flex;
  gap: 20px;
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: 16px;
  padding: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.comment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
}

.comment-item.en_attente { border-left: 5px solid var(--warning); }
.comment-item.published { border-left: 5px solid var(--success); }

.comment-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  background: var(--theme--primary-subdued);
  color: var(--theme--primary);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-indicator.warning { background: var(--warning); }
.status-indicator.success { background: var(--success); }

.comment-main { flex: 1; min-width: 0; }

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.author-name { font-weight: 800; font-size: 1.1rem; color: var(--theme--foreground); margin-right: 12px; }
.comment-date { font-size: 0.85rem; color: var(--theme--foreground-subdued); font-weight: 600; }

.comment-meta { display: flex; gap: 8px; }
.wp-badge { font-size: 0.65rem; background: #21759b; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.admin-badge { font-size: 0.65rem; background: var(--theme--primary); color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; }

.comment-content {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--theme--foreground);
  margin-bottom: 20px;
  white-space: pre-wrap;
}

/* Réponses */
.replies-section {
  background: var(--theme--background-subdued);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid var(--theme--border-color-subdued);
}

.reply-item {
  border-bottom: 1px solid var(--theme--border-color);
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.reply-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.reply-header { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
.reply-header strong { color: var(--theme--primary); }
.reply-item p { margin: 4px 0 0 0; font-size: 0.95rem; }

/* Actions */
.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.main-actions, .secondary-actions { display: flex; gap: 8px; }

.btn-approve { background: var(--success); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: filter 0.2s; }
.btn-reply { background: var(--theme--primary-subdued); color: var(--theme--primary); border: 1px solid var(--theme--primary-subdued); padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-archive, .btn-restore { background: var(--theme--background-subdued); border: 1px solid var(--theme--border-color); padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-delete { background: transparent; border: 1px solid transparent; color: var(--theme--danger); padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }

.btn-approve:hover { filter: brightness(1.1); }
.btn-reply:hover { background: var(--theme--primary); color: white; }

/* Formulaire de réponse */
.reply-form {
  margin-top: 20px;
  background: var(--theme--background-subdued);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--theme--primary-subdued);
}

.reply-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme--border-color);
  background: var(--theme--background);
  color: var(--theme--foreground);
  font-family: inherit;
  resize: vertical;
  margin-bottom: 12px;
}

.reply-form-actions { display: flex; justify-content: flex-end; }
.btn-submit-reply { background: var(--theme--primary); color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* Toast Notification */
.notification-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: 700;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.notification-toast.success { background: var(--success); }
.notification-toast.error { background: var(--danger); }

/* Utilitaires */
.empty-state { padding: 64px 20px; text-align: center; color: var(--theme--foreground-subdued); display: flex; flex-direction: column; align-items: center; }
.icon-huge { opacity: 0.3; margin-bottom: 16px; color: var(--theme--primary); }
.loading-state { padding: 64px; text-align: center; color: var(--theme--foreground-subdued); }
.spinner { width: 40px; height: 40px; border: 4px solid var(--theme--border-color-subdued); border-top-color: var(--theme--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Mobile */
@media (max-width: 768px) {
  .comment-item { flex-direction: column; padding: 16px; }
  .comment-sidebar { flex-direction: row; justify-content: space-between; width: 100%; }
  .comment-header { flex-direction: column; gap: 4px; }
  .comment-actions { flex-direction: column; align-items: stretch; }
  .main-actions, .secondary-actions { width: 100%; }
  .main-actions button, .secondary-actions button { flex: 1; }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s, opacity 0.3s; }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 20px); opacity: 0; }
</style>
