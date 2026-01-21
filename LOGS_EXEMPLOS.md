# 📊 Exemplos de Logs Console

Quando você usar o app, verá mensagens como essas no console (F12):

---

## ✅ Fluxo Correto (Tudo Funcionando)

### Login Bem-Sucedido
```
🔐 Iniciando login com Google...
✅ Login bem-sucedido! {uid: "UBo1q2x3A4B5C6D7E8F9G0H1", email: "seu@gmail.com", displayName: "Seu Nome"}
🔐 Autenticação detectada: {uid: "UBo1q2x3A4B5C6D7E8F9G0H1", email: "seu@gmail.com", displayName: "Seu Nome"}
🟢 Botão atualizado: "Painel" (usuário autenticado)
```

### Carregar Produtos (Sucesso)
```
✅ Produtos carregados do Firestore: 5
```

### Adicionar Produto de Teste
```
📤 Tentando salvar produto de teste no Firestore... {userUid: "UBo1q2x3...", isAdmin: true}
✅ Produto de teste criado no Firestore: a1B2c3D4e5F6g7H8i9J0k1l2
```

### Logout
```
✅ Logout realizado.
🔴 Botão atualizado: "Login" (usuário não autenticado)
```

---

## ❌ Fluxo com Erros

### Erro: Não está autenticado
```
Tentativa de adicionar produto...
❌ Você deve estar autenticado para salvar produtos.
Tentativa de salvar sem autenticação
```

### Erro: Permission Denied (Não é Admin)
```
📤 Tentando salvar produto de teste no Firestore... {userUid: "UBo1q2x3...", isAdmin: false}

❌ Erro ao salvar produto de teste: {
  code: "permission-denied",
  message: "Missing or insufficient permissions",
  userUid: "UBo1q2x3A4B5C6D7E8F9G0H1",
  isAdmin: false,
  fullError: {...}
}

❌ Falha ao salvar — adicionado localmente.
```
**💡 Solução:** Criar documento `admins/{seu-uid}` com `role: "admin"`

### Erro: Unauthenticated (Não está logado)
```
❌ Erro ao salvar produto de teste: {
  code: "unauthenticated",
  message: "The caller is not authenticated",
  userUid: null,
  isAdmin: false,
  fullError: {...}
}
```
**💡 Solução:** Fazer login antes

### Erro: Invalid Argument
```
❌ Erro ao carregar produtos: {
  code: "invalid-argument",
  message: "Invalid collection reference",
  fullError: {...}
}
```
**💡 Solução:** Verificar se coleções `products`, `categories`, `stores` existem no Firestore

---

## 🔍 Como Ler um Erro

Formato padrão:
```
❌ [Função] [Descrição]: {
  code: "erro_code",         ← Código único do erro
  message: "erro message",   ← Mensagem legível
  userUid: "abc123...",     ← Seu ID de usuário
  isAdmin: false/true,       ← Se é admin
  fullError: {...}           ← Detalhes completos
}
```

### Decodificador Rápido

| Code | Significado | Solução |
|------|-------------|---------|
| `permission-denied` | Não tem permissão de escrita | Criar `admins/{uid}` |
| `unauthenticated` | Não está logado | Fazer login |
| `invalid-argument` | Parâmetro errado | Verificar dados |
| `not-found` | Documento/coleção não existe | Criar em Firestore |
| `network-error` | Sem internet | Verificar conexão |

---

## 🎯 Logs Por Situação

### Situação 1: Acabou de Abrir o App
```
✅ Produtos carregados do Firestore: 0
```
(Esperado se nenhum produto foi criado ainda)

### Situação 2: Login com Google
```
🔐 Iniciando login com Google...
[Popup abre]
✅ Login bem-sucedido! {uid: "...", email: "..."}
```

### Situação 3: Clicou em "Novo Produto" (sem estar admin)
```
📤 Tentando salvar produto de teste no Firestore... {userUid: "...", isAdmin: false}
❌ Erro ao salvar produto de teste: {code: "permission-denied", ...}
```

### Situação 4: Criou documento admin e tenta novamente
```
📤 Tentando salvar produto de teste no Firestore... {userUid: "...", isAdmin: true}
✅ Produto de teste criado no Firestore: docID123
```

---

## 📝 O Que Anotar Para Me Contar

Se der erro, copie:
1. **A mensagem exata** do console
2. **O código do erro** (ex: `permission-denied`)
3. **O seu UID** (aparece em qualquer log logado)
4. **Qual ação você estava fazendo** (login? adicionar produto?)
5. **Se já criou o documento admin** (sim/não)

---

Exemplo completo:
```
Erro ao tentar adicionar produto:

Code: permission-denied
Message: Missing or insufficient permissions
UID: UBo1q2x3A4B5C6D7E8F9G0H1
Ação: Clicou em "Novo Produto"
Documento admin: Não criei ainda
```

Isso me ajuda muito! 🚀
