# 🧪 GUIA DE TESTE - O QUE ESPERAR

## ✅ Checklist Pré-Teste

- [ ] Recarregou a página (F5 ou Ctrl+R)
- [ ] Abriu o Console do navegador (F12)
- [ ] Está vendo a home com ofertas
- [ ] Firebase Console aberto (opcional)

---

## 🚀 Teste 1: Verificar Carregamento

### Ação
1. Abra o Console (F12)
2. Recarregue a página (F5)

### Esperado
```
Iniciando Seleto Commerce...
✅ Produtos carregados do Firestore: 0
⚠️ Nenhuma categoria no Firestore. Criando...
✅ Categorias padrão criadas no Firestore
⚠️ Nenhuma loja no Firestore. Criando...
✅ Lojas padrão criadas no Firestore
🔐 Autenticação detectada: [null]  (se não logado)
```

### Problema ❌
Se ver erros de `via.placeholder.com`:
- ❌ `GET https://via.placeholder.com/... net::ERR_NAME_NOT_RESOLVED`

**Solução:** Atualizou o arquivo? Abra em aba anônima (Ctrl+Shift+P)

---

## 🔐 Teste 2: Login com Google

### Ação
1. Clique no botão **"Login"** (canto superior direito)
2. Selecione sua conta Google
3. Aguarde

### Esperado
```
🔐 Iniciando login com Google...
✅ Login bem-sucedido! {
  uid: "abc123...",
  email: "seu@email.com",
  displayName: "Seu Nome"
}
Creating admin for: abc123...
Admin created: abc123...
🟢 Botão atualizado: "Painel" (usuário autenticado)
```

### Problema ❌
- Se nunca sai do popup: Verificar conexão internet
- Se fecha popup mas não vê logs: Bloqueio de cookies/3ª parte

---

## 📦 Teste 3: Verificar Dados Criados

### No Firestore Console
1. Abra [Firestore](https://console.firebase.google.com/u/0/project/seleto-commerce/firestore)
2. Procure pelas collections:
   - [ ] `categories` - deve ter 5 documentos
   - [ ] `stores` - deve ter 3 documentos
   - [ ] `admins` - deve ter 1 documento com seu UID

### Esperado
```
categories/
  ├─ Eletrônicos
  ├─ Casa
  ├─ Moda
  ├─ Esportes
  └─ Livros

stores/
  ├─ Amazon
  ├─ Shopee
  └─ Magalu

admins/
  └─ {seu-uid}/
     ├─ uid: "..."
     ├─ email: "seu@email.com"
     ├─ role: "admin"
     └─ active: true
```

---

## 🎛️ Teste 4: Acessar Admin Panel

### Ação
1. Estando logado, clique em **"Painel"** (canto superior direito)
2. Verifique se:
   - Header está visível
   - Sidebar cinzento no lado
   - Botão "Produtos" destacado
   - Botão "Sair" funciona

### Esperado
- ✅ Header intacto (logo, theme button, etc)
- ✅ Sidebar left com "⚙️ Painel Admin"
- ✅ Área principal branca
- ✅ Sem erros no console

### Problema ❌
- Header desaparece → Bug corrigido? Recarregue
- Sidebar quebrada → Cache? Limpe (Ctrl+Shift+Del)

---

## ➕ Teste 5: Criar Produto de Teste

### Ação
1. No Admin, clique em **"🧪 Produto de Teste"**
2. Aguarde 2 segundos
3. Veja o Console

### Esperado
```
📤 Tentando salvar produto de teste no Firestore...
{userUid: "abc123...", isAdmin: true}
✅ Produto de teste criado no Firestore: doc123abc
✅ Produto de teste salvo no Firestore!
```

### E No App
- ✅ Produto aparece na tabela de Admin
- ✅ Mensagem de sucesso no topo
- ✅ Sem erros

### Problema ❌
- `❌ Erro ao salvar produto de teste: {code: "permission-denied"...}`
  - Verifique se documento admin foi criado no Firestore
  - Verifique se uid bate com o UID do Firebase

- `❌ Erro ao salvar produto de teste: {code: "unauthenticated"...}`
  - Refaça login (Sair → Login)

---

## 🖼️ Teste 6: Criar Produto Manual

### Ação
1. No Admin, clique em **"Novo Produto"**
2. Preencha os campos:
   - Nome: "iPhone 15"
   - Link Afiliado: "https://www.amazon.com.br/s?k=iphone15"
   - Link Imagem: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"
   - Categoria: Eletrônicos
   - Loja: Amazon
   - Preço: 3499
   - Rating: 4.5
3. Clique em **"✅ Criar Produto"**

### Esperado
```
✅ Produto criado no Firestore: xyz789...
```

E na tabela Admin:
- Produto aparece
- Pode editar/deletar

---

## 🎨 Teste 7: Modo Escuro

### Ação
1. Volte para Home (clique "Ver Site")
2. Clique no botão tema (☀️ ou 🌙)
3. Verifique se tudo fica escuro
4. Vá para Admin
5. Verifique se Admin também está escuro

### Esperado
- ✅ Home muda para escuro
- ✅ Admin muda para escuro
- ✅ Tema persiste ao recarregar

---

## 📊 Teste 8: Verificar Home

### Ação
1. Clique "Ver Site" ou logo
2. Verifique:
   - [ ] Header visível
   - [ ] Ofertas em carrossel
   - [ ] Categorias na esquerda
   - [ ] Produtos abaixo
   - [ ] Footer com lojas

### Esperado
- ✅ Tudo carrega
- ✅ Sem erros de placeholder
- ✅ Imagens com background cinzento se não carregarem

### Problema ❌
- Se ver erros `via.placeholder.com`: Limpe cache

---

## 🎯 Resultado Final

Se passou em TODOS os testes:
```
✅ App funciona 100%
✅ Firebase integrado
✅ Admin operacional
✅ Dados persistem
✅ Sem erros críticos
```

Próximos passos:
1. Customizar categorias
2. Adicionar seus produtos
3. Configurar imagens properly
4. Deploy em produção

---

## 🆘 Se Algo Não Funcionar

1. **Copie a mensagem de erro do console**
2. **Verifique:**
   - [ ] Firebase Console - rules publicadas?
   - [ ] Firestore - admins/{seu-uid} existe?
   - [ ] Browser console - qual é o código do erro?

3. **Erros comuns:**
   - `permission-denied` → Admin doc não existe
   - `unauthenticated` → Não logado
   - `net::ERR_NAME_NOT_RESOLVED` → Sem internet ou DNS

---

**Data de Atualização:** 21/01/2026
**Versão:** 2.0
**Status:** ✅ Pronto para Teste
