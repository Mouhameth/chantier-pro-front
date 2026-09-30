# 🔧 Backend Collaboration - Correctif Requis

## ❌ Problème Actuel

Le serveur Socket.io envoie un **nombre** (count) au lieu d'un **tableau** (array) de participants, ce qui empêche l'affichage des participants dans l'interface.

### Réponse Actuelle (Incorrecte)
```json
{
  "sessionId": "session_123",
  "participants": 2
}
```

### Logs Frontend Montrant le Problème
```
🎉 [useCollaborativeSession] Session joined EVENT RECEIVED
🎉 Extracted participants: 2
🎉 Participants type: number isArray: false
🎉 Setting participants array with length: 0
👥 ⚠️ NO PARTICIPANTS IN STATE!
```

---

## ✅ Solution Requise

Le serveur doit envoyer un **tableau d'objets participants** avec toutes les informations nécessaires.

### Réponse Attendue (Correcte)
```json
{
  "sessionId": "session_123",
  "participants": [
    {
      "userId": 17,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "isOnline": true,
      "joinedAt": "2024-01-15T10:30:00Z"
    },
    {
      "userId": 18,
      "firstname": "Jane",
      "lastname": "Smith",
      "email": "jane@example.com",
      "role": "EDITOR",
      "isOnline": true,
      "joinedAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

## 📋 Événements Socket.io à Modifier

### 1. `session:joined` (Quand un utilisateur rejoint une session)

**Émis vers**: L'utilisateur qui vient de rejoindre
**Quand**: Après `join:session` du client

```typescript
// ❌ INCORRECT (envoie juste le count)
socket.emit('session:joined', {
  sessionId: session.id,
  participants: session.participants.length  // ❌ NE PAS FAIRE
});

// ✅ CORRECT (envoie le tableau complet)
socket.emit('session:joined', {
  sessionId: session.id,
  participants: session.participants.map(p => ({
    userId: p.userId,
    firstname: p.firstname,
    lastname: p.lastname,
    email: p.email,
    role: p.role,
    isOnline: p.isOnline,
    joinedAt: p.joinedAt
  }))
});
```

### 2. `user:joined` (Quand un utilisateur rejoint - broadcast aux autres)

**Émis vers**: Tous les autres participants de la session
**Quand**: Après qu'un utilisateur rejoigne

```typescript
// ❌ INCORRECT (broadcast juste l'userId)
socket.to(sessionId).emit('user:joined', {
  userId: newUser.id,
  participantCount: session.participants.length  // ❌ NE PAS FAIRE
});

// ✅ CORRECT (broadcast les infos complètes + liste mise à jour)
socket.to(sessionId).emit('user:joined', {
  userId: newUser.id,
  firstname: newUser.firstname,
  lastname: newUser.lastname,
  email: newUser.email,
  role: newUser.role,
  isOnline: true,
  joinedAt: newUser.joinedAt,
  // IMPORTANT: Inclure la liste complète mise à jour
  allParticipants: session.participants.map(p => ({
    userId: p.userId,
    firstname: p.firstname,
    lastname: p.lastname,
    email: p.email,
    role: p.role,
    isOnline: p.isOnline,
    joinedAt: p.joinedAt
  }))
});
```

### 3. `user:left` (Quand un utilisateur quitte)

**Émis vers**: Tous les autres participants de la session
**Quand**: Après qu'un utilisateur quitte ou se déconnecte

```typescript
// ✅ Cet événement est probablement déjà correct
socket.to(sessionId).emit('user:left', {
  userId: departingUser.id,
  // Optionnel mais recommandé:
  allParticipants: session.participants.map(p => ({
    userId: p.userId,
    firstname: p.firstname,
    lastname: p.lastname,
    email: p.email,
    role: p.role,
    isOnline: p.isOnline,
    joinedAt: p.joinedAt
  }))
});
```

---

## 🔍 Structure TypeScript des Données

### Interface Participant (Backend)
```typescript
interface Participant {
  userId: number;
  firstname: string;
  lastname: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  isOnline: boolean;
  joinedAt: string; // ISO 8601 format
}
```

### Événements Socket.io
```typescript
// Event: session:joined
interface SessionJoinedPayload {
  sessionId: string | number;
  participants: Participant[]; // ⚠️ ARRAY, pas number!
}

// Event: user:joined
interface UserJoinedPayload {
  userId: number;
  firstname: string;
  lastname: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  isOnline: boolean;
  joinedAt: string;
  allParticipants: Participant[]; // Liste complète mise à jour
}

// Event: user:left
interface UserLeftPayload {
  userId: number;
  allParticipants?: Participant[]; // Optionnel mais recommandé
}

// Event: user:status (changement de statut en ligne/hors ligne)
interface UserStatusPayload {
  userId: number;
  isOnline: boolean;
  allParticipants?: Participant[]; // Optionnel mais recommandé
}

// Event: cursor:updated (mouvement du curseur)
interface CursorUpdatedPayload {
  userId: number;
  firstname?: string; // Optionnel - le frontend peut récupérer depuis la liste des participants
  lastname?: string;  // Optionnel - le frontend peut récupérer depuis la liste des participants
  x: number;
  y: number;
}
```

---

## 🌐 Gestion du Statut `isOnline`

Le champ `isOnline` indique si un participant est actuellement connecté au WebSocket.

### Règles de gestion:

1. **Quand un utilisateur se connecte**:
   - Mettre `isOnline: true` pour cet utilisateur
   - Broadcaster `user:joined` avec `isOnline: true`

2. **Quand un utilisateur se déconnecte** (socket disconnect):
   - Mettre `isOnline: false` pour cet utilisateur
   - NE PAS le retirer de la session immédiatement
   - Broadcaster `user:status` avec le nouveau statut

3. **Quand un utilisateur quitte volontairement** (`leave:session`):
   - Retirer complètement l'utilisateur de la session
   - Broadcaster `user:left`

4. **Dans `session:joined`**:
   - Les participants actuellement connectés doivent avoir `isOnline: true`
   - Les participants déconnectés temporairement ont `isOnline: false`

### Événement additionnel recommandé:

```typescript
// Quand le statut d'un participant change (connexion/déconnexion)
socket.to(sessionId).emit('user:status', {
  userId: user.id,
  isOnline: false, // ou true
  allParticipants: session.participants.map(p => ({
    userId: p.userId,
    firstname: p.firstname,
    lastname: p.lastname,
    email: p.email,
    role: p.role,
    isOnline: p.isOnline,
    joinedAt: p.joinedAt
  }))
});
```

---

## 🖱️ Gestion des Curseurs en Temps Réel

Les curseurs permettent de voir la position de la souris des autres utilisateurs en temps réel.

### Événement `cursor:move` (reçu du client)

Quand un utilisateur bouge sa souris, le client envoie:
```typescript
socket.emit('cursor:move', {
  sessionId: number,
  x: number, // Position X dans le viewport
  y: number  // Position Y dans le viewport
});
```

### Événement `cursor:updated` (broadcast aux autres)

Le serveur doit broadcaster la position aux autres participants:

#### Option 1: Version complète (recommandée)
```typescript
// Quand on reçoit cursor:move d'un client
socket.on('cursor:move', ({ sessionId, x, y }) => {
  // Récupérer les infos de l'utilisateur
  const user = getCurrentUser(socket);

  // Broadcaster aux autres participants de la session (pas à l'émetteur)
  socket.to(`session_${sessionId}`).emit('cursor:updated', {
    userId: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    x,
    y
  });
});
```

#### Option 2: Version minimale (acceptable)
```typescript
// Le frontend récupérera firstname/lastname depuis la liste des participants
socket.on('cursor:move', ({ sessionId, x, y }) => {
  const user = getCurrentUser(socket);

  socket.to(`session_${sessionId}`).emit('cursor:updated', {
    userId: user.id,
    x,
    y
  });
});
```

**Important**:
- NE PAS renvoyer l'événement à l'émetteur (utiliser `socket.to()` pas `io.to()`)
- Les coordonnées x/y sont relatives au viewport du navigateur
- Broadcaster immédiatement sans throttle (le throttle est géré côté client)
- Les champs `firstname` et `lastname` sont optionnels (le frontend peut les récupérer depuis la liste des participants)

---

## 🧪 Comment Tester

### 1. Test avec deux utilisateurs

1. **Utilisateur A** ouvre une page blueprint
2. Vérifier dans les logs frontend:
   ```
   🎉 Extracted participants: [...]  // ✅ Doit être un array
   🎉 Participants type: object isArray: true  // ✅ isArray doit être true
   👥 Number of participants: 1  // ✅ Au moins 1 participant
   ```

3. **Utilisateur B** ouvre la même page
4. **Utilisateur A** doit voir dans les logs:
   ```
   [useCollaborativeSession] User joined event: { userId: ..., firstname: "Jane", lastname: "Smith", ... }
   👥 Number of participants: 2  // ✅ Maintenant 2 participants
   ```

### 2. Test de navigation

1. Utilisateur ouvre une page (voit 1 participant)
2. Utilisateur navigue ailleurs
3. Utilisateur revient à la page
4. ✅ Doit toujours voir la liste des participants (pas vide)

---

## 📝 Checklist Backend

- [ ] Modifier l'événement `session:joined` pour envoyer `participants: Participant[]` au lieu de `participants: number`
- [ ] Modifier l'événement `user:joined` pour inclure `allParticipants: Participant[]`
- [ ] (Optionnel) Modifier `user:left` pour inclure `allParticipants: Participant[]`
- [ ] S'assurer que chaque objet Participant contient: `userId`, `firstname`, `lastname`, `email`, `role`, `isOnline`, `joinedAt`
- [ ] Mettre à jour `isOnline` automatiquement quand un utilisateur se connecte/déconnecte
- [ ] Tester avec plusieurs utilisateurs
- [ ] Vérifier que les logs frontend montrent `isArray: true`

---

## 🚀 Impact de la Correction

Une fois corrigé, l'interface affichera automatiquement:
- ✅ Avatars circulaires colorés de tous les participants
- ✅ Badge 🟢 indiquant qu'ils sont en ligne
- ✅ Nom des participants au survol
- ✅ Indicateur "Vous" pour l'utilisateur actuel
- ✅ Mise à jour en temps réel quand des utilisateurs rejoignent/quittent

Le frontend est **déjà prêt** et attend juste les bonnes données du backend!

---

## 📞 Questions?

Le code frontend est dans:
- `hooks/useCollaborativeSession.ts` - Gestion WebSocket et événements
- `components/collaboration/ParticipantsList.tsx` - Affichage des participants
- Interface TypeScript: `Participant` dans `hooks/useCollaborativeSession.ts:6-12`
