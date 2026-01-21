# 🚨 AÇÃO NECESSÁRIA - Regras do Firestore

## ❌ Problema Descoberto

As **regras do Firestore** estão bloqueando admin de criar categorias e lojas.

## ✅ Solução em 3 Passos

### 1️⃣ Abra Firebase Console
```
https://console.firebase.google.com/
→ Selecione "seleto-commerce"
→ Firestore Database
→ Rules (aba no topo)
```

### 2️⃣ Copie as Regras Corretas

Abra: **FIRESTORE_REGRAS_CORRETAS.md** (neste projeto)

Copie TODO O CÓDIGO entre as linhas:
```
```firestore
rules_version = '2';
...
}
```
```

### 3️⃣ Cole no Firebase Console

1. No editor de Rules do Firebase:
   - Selecione tudo (Ctrl+A)
   - Delete
   - Cole o código novo
   - Clique **Publish** (botão azul)

---

## ⏱️ Demora 2 Minutos!

1. Copiar regras: 30 segundos
2. Colar no Firebase: 30 segundos
3. Publicar: 30 segundos
4. Pronto!

---

## 🎯 O Que Vai Mudar

**ANTES (Bloqueado):**
```
❌ Erro ao criar categorias: FirebaseError: Missing or insufficient permissions
❌ Erro ao criar lojas: FirebaseError: Missing or insufficient permissions
❌ Erro ao salvar produto: FirebaseError: Missing or insufficient permissions
```

**DEPOIS (Funcionando):**
```
✅ Categorias padrão criadas no Firestore
✅ Lojas padrão criadas no Firestore
✅ Produto criado no Firestore: doc123
```

---

## 🔍 Principais Mudanças nas Regras

**Agora admin consegue ESCREVER em:**
- ✅ `products` (criar, editar, deletar)
- ✅ `categories` (criar, editar, deletar) ← NOVO
- ✅ `stores` (criar, editar, deletar) ← NOVO

**Leitura continua PÚBLICA para:**
- ✅ Todos conseguem ler produtos
- ✅ Todos conseguem ler categorias
- ✅ Todos conseguem ler lojas

---

## 📖 Detalhes Técnicos

Mudança principal:
```firestore
// ANTES (bloqueava)
match /categories/{categoryId} {
  allow read: if true;
  allow write: if false;  ❌
}

// DEPOIS (permite admin)
match /categories/{categoryId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));  ✅
}
```

Mesmo padrão para `stores`.

---

## ⚠️ IMPORTANTE

**Não deixe as regras em modo público!**

❌ NUNCA faça isto:
```firestore
match /products/{productId} {
  allow read, write: if true;  // INSEGURO!
}
```

✅ Sempre use:
```firestore
match /products/{productId} {
  allow read: if true;
  allow write: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

---

## 🚀 Após Aplicar as Regras

1. **Recarregue o app** (F5)
2. **Abra Console** (F12)
3. **Faça login** com Google
4. **Verifique:**
   - Console deve mostrar `✅ Categorias criadas`
   - Console deve mostrar `✅ Lojas criadas`
5. **Tente criar produto**
   - Deve salvar no Firestore ✅

---

## 📞 Checklist

- [ ] Abriu Firebase Console
- [ ] Abriu página de Rules
- [ ] Copiou regras de FIRESTORE_REGRAS_CORRETAS.md
- [ ] Deletou regras antigas
- [ ] Colou regras novas
- [ ] Clicou Publish
- [ ] Recarregou o app (F5)
- [ ] Console mostra ✅ sem erros
- [ ] Conseguiu criar produto

---

**Após fazer isto, tudo funcionará!** ✅

Se ainda der erro, abra Console (F12) e envie a mensagem de erro.
