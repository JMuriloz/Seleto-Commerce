# 🔧 Guia de Configuração do Firebase

## 1️⃣ Credenciais (já inseridas em `script.js`)

✅ Suas credenciais estão corretas em `script.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCtvST8PPrvWpFazafqU1L9q8Vgg-sEH5M",
  authDomain: "seleto-commerce.firebaseapp.com",
  projectId: "seleto-commerce",
  storageBucket: "seleto-commerce.firebasestorage.app",
  messagingSenderId: "195667393422",
  appId: "1:195667393422:web:f64e41552c3791c04702df"
};
```

---

## 2️⃣ Passo 1: Habilitar Autenticação Google

1. Abra [Firebase Console](https://console.firebase.google.com/)
2. Selecione projeto **`seleto-commerce`**
3. Vá em **Authentication** → **Sign-in method**
4. Clique em **Google** e ative a opção
5. Configure o nome do projeto (ex: "Seleto Commerce")
6. Clique em **Save**

---

## 3️⃣ Passo 2: Fazer Login e Obter o UID

1. Abra seu app no navegador
2. Clique no botão **"Login"** no topo
3. Faça login com sua conta Google
4. **Abra o Console do Navegador** (F12 → Console)
5. Procure a mensagem com 🔐:
   ```
   🔐 Autenticação detectada: {uid: "abc123...", email: "seu@email.com", ...}
   ```
6. **Copie o `uid`** (exemplo: `abc123xyz`)

---

## 4️⃣ Passo 3: Criar Documento Admin no Firestore

1. Vá para [Firestore Console](https://console.firebase.google.com/u/0/project/seleto-commerce/firestore)
2. Clique em **+ Start collection**
3. Nome da coleção: **`admins`** → Next
4. ID do documento: **Cole o `uid` que você copiou** (ex: `abc123xyz`)
5. Adicione um campo:
   - Campo: `role`
   - Tipo: String
   - Valor: `admin`
6. Clique em **Save**

Sua coleção `admins` deve ficar assim:
```
admins/
  ├─ abc123xyz/
  │  └─ role: "admin"
```

---

## 5️⃣ Passo 4: Aplicar Regras de Segurança

1. Vá para **Firestore** → **Rules**
2. **Delete** as regras existentes
3. **Cole as regras abaixo:**

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Produtos: leitura pública, escrita apenas por admins
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Coleção de admins: leitura por autenticados, escrita bloqueada
    match /admins/{adminId} {
      allow read: if request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      allow create, update, delete: if false;
    }

    // Categorias e Lojas: leitura pública
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if false;
    }

    match /stores/{storeId} {
      allow read: if true;
      allow write: if false;
    }

    // Bloqueia resto
    match /{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

4. Clique em **Publish**

---

## 6️⃣ Passo 5: Testar Tudo

### 🟢 Teste 1: Login
1. Abra o app
2. Clique em **"Login"**
3. Faça login com Google
4. Abra o **Console** (F12)
5. Procure a mensagem 🔐:
   ```
   ✅ Login bem-sucedido! {uid: "...", email: "..."}
   ```
6. O botão deve mudar de **"Login"** para **"Painel"**

### 🟢 Teste 2: Adicionar Produto de Teste
1. Clique em **"Painel"** (agora deve estar visível)
2. Clique no botão **"🧪 Produto de Teste"**
3. Abra o Console (F12)
4. Procure as mensagens:
   - Se sucesso: `✅ Produto de teste criado no Firestore: ...`
   - Se erro: `❌ Erro ao salvar produto de teste: {code: "...", message: "..."}`

### 🟡 Se receber erro "permission-denied"
Significa que as regras não estão corretas. Verifique:
1. O documento `admins/{seu-uid}` existe com `role: "admin"`?
2. As regras foram publicadas corretamente?
3. Você está logado (console mostra 🔐)?

---

## 📋 Resumo de Logs Console

Ao usar o app, você verá:

| Log | Significado |
|-----|-------------|
| 🔐 Autenticação detectada | Usuário fez login com sucesso |
| ✅ Login bem-sucedido | Fluxo de login completado |
| ✅ Produto de teste criado | Produto foi salvo no Firestore |
| ❌ Erro ao salvar produto | Permissão negada ou erro de rede |
| 🟢 Botão atualizado: "Painel" | Usuário autenticado |
| 🔴 Botão atualizado: "Login" | Usuário desautenticado |

---

## ⚡ Troubleshooting

### ❓ "Falha ao salvar no Firestore"

**Causa:** Geralmente, regras não permitem escrita.

**Solução:**
1. Verifique se `admins/{seu-uid}` existe no Firestore
2. Verifique se `role: "admin"` está preenchido
3. Verifique se as regras foram **Publicadas** (botão em azul)
4. Tente refazer login (logout + login)

### ❓ "Permission denied"

**Causa:** Firestore rules bloqueando escrita.

**Solução:** Verifique os passos 3 e 4 acima.

### ❓ Botão continua "Login" após fazer login

**Causa:** `onAuthStateChanged` não disparou ou há erro.

**Solução:**
1. Abra o Console (F12)
2. Procure mensagens 🔐
3. Se não ver, tente:
   - Hard refresh (Ctrl+Shift+R)
   - Limpar cache do navegador
   - Fazer logout e login novamente

---

## 🎯 Próximos Passos

Após testar com sucesso:
1. ✅ Criar alguns produtos via painel
2. ✅ Testar edição e exclusão
3. ✅ Verificar se aparecem na lista pública
4. ✅ Testar modo escuro com produtos
5. ⚙️ Ajustar categorias, lojas e badges conforme necessário

Boa sorte! 🚀
