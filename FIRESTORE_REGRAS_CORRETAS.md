# 🔐 REGRAS FIRESTORE - VERSÃO CORRIGIDA

## ❌ Problema Anterior

As regras estavam bloqueando admin de criar categorias e lojas.

## ✅ Solução

Copie e cole ESTAS REGRAS no Firebase Console → Firestore → Rules

---

## 📋 REGRAS CORRETAS

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

    // Categorias: leitura pública, escrita apenas por admins
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Lojas: leitura pública, escrita apenas por admins
    match /stores/{storeId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Admins: leitura restrita, escrita bloqueada
    match /admins/{adminId} {
      allow read: if request.auth != null 
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      allow write: if false;
    }

    // Bloqueia resto do banco
    match /{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 🔑 Mudanças Principais

**ANTES:**
```firestore
match /categories/{categoryId} {
  allow read: if true;
  allow write: if false;  ❌ Bloqueava admin!
}

match /stores/{storeId} {
  allow read: if true;
  allow write: if false;  ❌ Bloqueava admin!
}
```

**DEPOIS:**
```firestore
match /categories/{categoryId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));  ✅ Permite admin
}

match /stores/{storeId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));  ✅ Permite admin
}
```

---

## 🚀 Como Aplicar

1. **Abra Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Vá para Firestore → Rules**
   ```
   Selecione "seleto-commerce"
   → Firestore Database
   → Rules (aba no topo)
   ```

3. **Delete as regras atuais**
   - Selecione tudo (Ctrl+A)
   - Delete

4. **Cole as regras novas**
   - Copie as regras acima
   - Cole no editor

5. **Clique Publish**
   - Botão azul "Publish" no canto inferior

---

## ✅ Resultado Esperado

Após aplicar as regras:

1. **Admin consegue criar categorias**
   ```
   ✅ Categorias padrão criadas no Firestore
   ```

2. **Admin consegue criar lojas**
   ```
   ✅ Lojas padrão criadas no Firestore
   ```

3. **Admin consegue salvar produtos**
   ```
   ✅ Produto criado no Firestore: doc123
   ```

---

## 🔍 Como Testar

1. **Recarregue o app** (F5)
2. **Abra Console** (F12)
3. **Faça login** com Google
4. **Clique "Painel"**
5. **Verifique console:**
   - Deve ver `✅ Categorias padrão criadas`
   - Deve ver `✅ Lojas padrão criadas`
6. **Tente adicionar produto**
   - Deve salvar sem erro

---

## ⚠️ IMPORTANTE

As regras garantem que:
- ✅ Só admin consegue escrever
- ✅ Qualquer pessoa consegue ler
- ✅ Banco protegido

**Não deixe as regras em modo público (allow write: if true)**

---

## 🐛 Se ainda der erro

Abra o Console (F12) e procure por:
```
❌ Erro ao criar categorias: {
  code: "permission-denied",
  message: "...",
  adminUid: "seu-uid",
  isAdmin: true
}
```

Se `isAdmin: false`, significa que o admin document não existe ou não está correto.

**Solução:** Verifique se tem documento em:
```
Firestore Console
  → Collections
  → admins
  → seu-uid (documento com role: "admin")
```

Se não tiver, crie manualmente:
1. Copie seu UID do console
2. Crie documento em `admins` com ID = seu UID
3. Campo: `role` = `"admin"`

---

**Após aplicar as regras, tudo deve funcionar!** ✅
