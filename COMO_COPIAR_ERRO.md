# 🔍 Como Copiar o Erro do Console

## Passo 1: Abrir o Console

### Windows / Linux
Pressione: `F12` ou `Ctrl + Shift + J`

### Mac
Pressione: `Cmd + Option + J`

---

## Passo 2: Localizar o Erro

Procure por uma linha assim:
```
❌ Erro ao salvar produto de teste: Object
```

---

## Passo 3: Expandir o Objeto

1. Clique no **triângulo** ao lado da mensagem para expandir
2. Você verá algo como:

```javascript
{
  code: "permission-denied",
  message: "Missing or insufficient permissions",
  userUid: "abc123xyz...",
  isAdmin: false,
  fullError: {...}
}
```

---

## Passo 4: Copiar Tudo

1. Clique com botão direito no erro
2. Selecione **"Copy object"** (ou similar)
3. Cole em um editor de texto
4. Envie para mim

---

## 📝 Template para Responder

Quando for reportar um erro, copie e preencha:

```
❌ ERRO ENCONTRADO

Função: _____________________ (ex: addTestProduct)

Código de Erro: _____________________ (ex: permission-denied)

Mensagem: _____________________

UID do Usuário: _____________________ (ex: abc123xyz...)

Está Logado (isAdmin): _____________________ (true/false)

Erro Completo:
[Cole aqui]

Contexto (opcional):
- Acabei de fazer login?
- Criei o documento admin?
- Aplicou as regras?
```

---

## 🎯 Exemplos de Erros Comuns

### ❌ `permission-denied`
```
{
  code: "permission-denied",
  message: "Missing or insufficient permissions",
  userUid: "abc123xyz",
  isAdmin: false  ← Isso significa que não é admin!
}
```
**Causa:** Documento `admins/{abc123xyz}` não existe ou não tem `role: "admin"`

**Solução:** Criar documento `admins/{seu-uid}` com campo `role: "admin"`

### ❌ `unauthenticated`
```
{
  code: "unauthenticated",
  message: "The caller is not authenticated",
  userUid: null  ← Não está autenticado!
}
```
**Causa:** Não está logado

**Solução:** Fazer login antes de tentar salvar

### ❌ `invalid-argument`
```
{
  code: "invalid-argument",
  message: "Invalid collection reference",
  userUid: "abc123xyz"
}
```
**Causa:** Problema com estrutura do Firestore

**Solução:** Verificar se as coleções `products`, `admins` existem

---

## 💡 Dicas

- **Sempre** abra o Console antes de fazer uma ação
- **Não feche** o Console durante o teste
- Se o erro desaparecer rapidamente, use **Pause on exceptions** (ícone de pausa)
- Se o erro tiver `fullError: {...}`, também copie esse objeto detalhado

---

Agora é com você! 🚀
