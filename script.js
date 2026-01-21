// =====================================================
// FIREBASE CONFIGURATION (MODULAR SDK)
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, setDoc,
    query, where, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtvST8PPrvWpFazafqU1L9q8Vgg-sEH5M",
  authDomain: "seleto-commerce.firebaseapp.com",
  projectId: "seleto-commerce",
  storageBucket: "seleto-commerce.firebasestorage.app",
  messagingSenderId: "195667393422",
  appId: "1:195667393422:web:f64e41552c3791c04702df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// =====================================================
// APP STATE & CONFIG
// =====================================================
const appState = {
    currentPage: 'home',
    products: [],
    categories: [],
    stores: [],
    featuredProducts: [],
    filters: {
        category: '',
        minPrice: 0,
        maxPrice: 10000,
        store: '',
        rating: 0,
        badge: ''
    },
    searchQuery: '',
    currentProduct: null,
    isAdmin: false,
    adminUser: null,
    carouselIndex: 0,
    carouselInterval: null,
    mobileMenuOpen: false,
    filterSidebarOpen: false,
    adminSection: 'dashboard',
    darkMode: localStorage.getItem('darkMode') === 'true',
    carouselIndex: 0, // ADICIONE ESTA LINHA
    carouselInterval: null // ADICIONE ESTA LINHA
};

// Config de contato
const siteConfig = {
    siteName: 'Seleto',
    contactEmail: 'contato@seletocommerce.com',
    contactPhone: '(11) 99999-9999'
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleTheme() {
    appState.darkMode = !appState.darkMode;
    localStorage.setItem('darkMode', appState.darkMode);
    applyTheme();
    showToast(`Modo ${appState.darkMode ? 'escuro' : 'claro'} ativado`, 'info');
}

function applyTheme() {
    const html = document.documentElement;
    if (appState.darkMode) {
        html.classList.add('dark');
        document.body.style.background = '#1A1A2E';
        document.body.style.color = '#F8F9FA';
    } else {
        html.classList.remove('dark');
        document.body.style.background = '#F8F9FA';
        document.body.style.color = '#2D3436';
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function generateSlug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function getStoreColor(store) {
    const colors = {
        'Shopee': 'store-shopee',
        'Amazon': 'store-amazon',
        'TikTok Shop': 'store-tiktok',
        'Magalu': 'store-magalu'
    };
    return colors[store] || 'bg-gray-600';
}

function getBadgeHtml(badge) {
    const badges = {
        'em_alta': { label: '🔥 Em Alta', class: 'badge-hot' },
        'mais_vendido': { label: '⭐ Mais Vendido', class: 'badge-best' },
        'custo_beneficio': { label: '💰 Custo-Benefício', class: 'badge-value' }
    };
    const b = badges[badge];
    return b ? `<span class="${b.class} text-white text-xs font-semibold px-2 py-1 rounded-full">${b.label}</span>` : '';
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        } else if (i === fullStars && hasHalf) {
            html += '<svg class="w-4 h-4 text-yellow-400" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#D1D5DB"/></defs><path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        } else {
            html += '<svg class="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
    }
    return html;
}

// =====================================================
// DATA FUNCTIONS
// =====================================================
async function loadProducts() {
    try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const snapshot = await getDocs(q);
        appState.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appState.featuredProducts = appState.products.filter(p => 
            p.badges && (p.badges.includes('em_alta') || p.badges.includes('mais_vendido'))
        ).slice(0, 6);
        console.log('✅ Produtos carregados do Firestore:', appState.products.length);
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', {
            code: error.code,
            message: error.message,
            fullError: error
        });
        loadSampleData(); // Fallback
    }
}

async function loadCategories() {
    try {
        const q = query(collection(db, 'categories'), where('active', '==', true));
        const snapshot = await getDocs(q);
        appState.categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (appState.categories.length === 0) {
            console.warn('⚠️ Nenhuma categoria no Firestore. Criando categorias padrão...');
            await createDefaultCategories();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar categorias:', { code: error.code, message: error.message });
        // Fallback local
        appState.categories = [
            { id: '1', name: 'Eletrônicos', slug: 'eletronicos', active: true },
            { id: '2', name: 'Casa', slug: 'casa', active: true },
            { id: '3', name: 'Moda', slug: 'moda', active: true }
        ];
    }
}

// Função para criar categorias padrão no Firestore
async function createDefaultCategories() {
    const categories = [
        { name: 'Eletrônicos', slug: 'eletronicos', active: true },
        { name: 'Casa', slug: 'casa', active: true },
        { name: 'Moda', slug: 'moda', active: true },
        { name: 'Esportes', slug: 'esportes', active: true },
        { name: 'Livros', slug: 'livros', active: true }
    ];
    
    try {
        for (const cat of categories) {
            await addDoc(collection(db, 'categories'), cat);
        }
        console.log('✅ Categorias padrão criadas no Firestore');
        await loadCategories(); // Recarregar
    } catch (err) {
        console.error('❌ Erro ao criar categorias:', {
            code: err.code,
            message: err.message,
            adminUid: appState.adminUser?.uid,
            isAdmin: appState.isAdmin
        });
    }
}

async function loadStores() {
    try {
        const q = query(collection(db, 'stores'), where('active', '==', true));
        const snapshot = await getDocs(q);
        appState.stores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (appState.stores.length === 0) {
            console.warn('⚠️ Nenhuma loja no Firestore. Criando lojas padrão...');
            await createDefaultStores();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar lojas:', { code: error.code, message: error.message });
        // Fallback local (sem placeholders)
        appState.stores = [
            { id: '1', name: 'Amazon', slug: 'amazon', logo: '', active: true },
            { id: '2', name: 'Shopee', slug: 'shopee', logo: '', active: true },
            { id: '3', name: 'Magalu', slug: 'magalu', logo: '', active: true }
        ];
    }
}

// Função para criar lojas padrão no Firestore
async function createDefaultStores() {
    const stores = [
        { name: 'Amazon', slug: 'amazon', logo: '', active: true },
        { name: 'Shopee', slug: 'shopee', logo: '', active: true },
        { name: 'Magalu', slug: 'magalu', logo: '', active: true }
    ];
    
    try {
        for (const store of stores) {
            await addDoc(collection(db, 'stores'), store);
        }
        console.log('✅ Lojas padrão criadas no Firestore');
        await loadStores(); // Recarregar
    } catch (err) {
        console.error('❌ Erro ao criar lojas:', {
            code: err.code,
            message: err.message,
            adminUid: appState.adminUser?.uid,
            isAdmin: appState.isAdmin
        });
    }
}

function loadSampleData() {
    appState.products = [
        {
            id: '1',
            title: 'Exemplo: iPhone 15 Pro',
            slug: 'iphone-15-pro',
            price: 5499.90,
            store: 'Amazon',
            affiliateUrl: '#',
            images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
            category: 'eletronicos',
            rating: 4.8,
            badges: ['mais_vendido'],
            description: 'Produto de exemplo. Adicione seus produtos no Admin.',
            active: true
        }
    ];
    appState.featuredProducts = appState.products;
}

// =====================================================
// AUTHENTICATION & ADMIN
// =====================================================
const ADMIN_EMAILS = [
    "muriloj212@gmail.com", 
    "seletomarket@gmail.com"
];

async function handleGoogleLogin() {
    try {
        console.log('🔐 Iniciando login com Google...');
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Verifica se o email está na lista permitida
        if (user && ADMIN_EMAILS.includes(user.email)) {
            appState.adminUser = user;
            appState.isAdmin = true;
            
            console.log('✅ Admin logado:', user.email);
            await ensureAdminExists(user.uid, user.email);
            
            showToast(`Bem-vindo, ${user.displayName}!`, 'success');
            updateAdminButton();
            navigateTo('admin-dashboard');
        } else {
            // Usuário logou, mas não é admin
            console.warn('⛔ Acesso negado para:', user.email);
            showToast('Acesso restrito a administradores.', 'error');
            await signOut(auth); // Desloga o intruso imediatamente
        }
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showToast(`Erro no login: ${error.message}`, 'error');
    }
}
async function ensureAdminExists(uid, email) {
    try {
        const adminRef = doc(db, 'admins', uid);
        const adminDoc = await getDoc(adminRef);
        
        if (!adminDoc.exists()) {
            console.log('Creating admin for:', uid);
            await setDoc(adminRef, {
                uid: uid,
                email: email,
                role: 'admin',
                createdAt: serverTimestamp(),
                active: true
            });
            console.log('Admin created:', uid);
        }
    } catch (err) {
        console.warn('Admin creation failed:', err.message);
    }
}

function handleLogout() {
    signOut(auth).then(() => {
        appState.isAdmin = false;
        appState.adminUser = null;
        console.log('✅ Logout realizado.');
        showToast('Logout realizado.', 'info');
        updateAdminButton();
        navigateTo('home');
    }).catch(err => {
        console.error('❌ Erro no logout:', err);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
        appState.adminUser = user;
        appState.isAdmin = true;
        console.log('🔐 Admin autenticado:', user.email);
        updateAdminButton();
    } else {
        appState.adminUser = null;
        appState.isAdmin = false;
        if (user) {
            // Se tiver usuário logado mas não for admin (caso raro de cache), desloga
            signOut(auth); 
        }
        console.log('🔐 Usuário não autenticado ou sem permissão.');
        updateAdminButton();
    }
});

function updateAdminButton() {
    const btn = document.getElementById('btn-admin-login');
    const txt = document.getElementById('btn-admin-text');
    if (!btn || !txt) return;
    if (appState.isAdmin) {
        txt.textContent = 'Painel';
        console.log('🟢 Botão atualizado: "Painel" (usuário autenticado)');
    } else {
        txt.textContent = 'Login';
        console.log('🔴 Botão atualizado: "Login" (usuário não autenticado)');
    }
}



// =====================================================
// NAVIGATION SYSTEM
// =====================================================
function navigateTo(page, params = {}) {
    appState.currentPage = page;
    if (page !== 'home' && appState.carouselInterval) {
        clearInterval(appState.carouselInterval);
        appState.carouselInterval = null;
    }
    renderPage();
    window.scrollTo(0, 0);
}

function renderPage() {
    const container = document.getElementById('page-container');
    const mainApp = document.getElementById('main-app');
    const adminPanel = document.getElementById('admin-panel');

    // Admin handling
    if (appState.currentPage.startsWith('admin')) {
        // keep main header visible so theme button stays accessible
        mainApp.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        // render admin UI inside the main page container so header/footer remain
        renderAdminPanel();
        return;
    }

    // Standard User Handling
    mainApp.classList.remove('hidden');
    adminPanel.classList.add('hidden');

    switch (appState.currentPage) {
        case 'home': renderHomePage(container); break;
        case 'category': renderCategoryPage(container); break;
        case 'product': renderProductPage(container); break;
        case 'search': renderSearchPage(container); break;
        case 'about': renderAboutPage(container); break;
        case 'terms': renderTermsPage(container); break;
        default: renderHomePage(container);
    }
}

// =====================================================
// PAGE RENDERERS
// =====================================================

// 1. HOME PAGE
// No arquivo script.js -> Dentro de renderHomePage(container)

function renderHomePage(container) {
    // Definimos uma altura fixa para evitar que a imagem fique gigante
    container.innerHTML = `
        <section class="hero-gradient text-white py-10 md:py-14">
          <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
             <div class="fade-in">
                <h1 class="text-3xl md:text-5xl font-bold mb-4 leading-tight">Melhores Ofertas do Dia</h1>
                <p class="text-lg text-gray-300 mb-8">Selecionamos os melhores produtos com preços imbatíveis.</p>
                <div class="flex gap-4">
                  <button onclick="document.getElementById('produtos-destaque').scrollIntoView({behavior: 'smooth'})" class="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-all pulse-btn">Ver Ofertas</button>
                </div>
             </div>
             
             <div class="relative w-full h-[300px] md:h-[380px] rounded-2xl overflow-hidden shadow-2xl group bg-gray-800">
                <div id="featured-carousel" class="flex h-full transition-transform duration-500 ease-out">
                  ${renderCarouselSlides()}
                </div>

                <button onclick="window.moveCarousel(-1)" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button onclick="window.moveCarousel(1)" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-primary p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>

                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    ${appState.featuredProducts.slice(0, 4).map((_, i) => `
                        <div onclick="window.goToSlide(${i})" class="dot-indicator w-2 h-2 rounded-full bg-white/50 cursor-pointer transition-all ${i === appState.carouselIndex ? 'bg-primary w-4' : ''}" id="dot-${i}"></div>
                    `).join('')}
                </div>
             </div>
          </div>
        </section>

        <section id="produtos-destaque" class="py-12 bg-white">
          <div class="max-w-7xl mx-auto px-4">
            <h2 class="text-2xl font-bold mb-6">🔥 Em Alta</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              ${renderProductCards(appState.products.filter(p => p.badges?.includes('em_alta')).slice(0, 4))}
            </div>
          </div>
        </section>
    `;
    startCarousel();
}

function renderCarouselSlides() {
    const slides = appState.featuredProducts.slice(0, 4);
    if (!slides.length) return `<div class="w-full h-full flex items-center justify-center text-white">Carregando ofertas...</div>`;
    
    return slides.map(product => `
        <div class="min-w-full h-full relative cursor-pointer" onclick="viewProduct('${product.slug}')">
          <img src="${product.images?.[0] || ''}" class="w-full h-full object-cover">
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
             <h3 class="text-xl font-bold text-white">${product.title}</h3>
             <p class="text-primary font-bold text-2xl">${formatPrice(product.price)}</p>
          </div>
        </div>
    `).join('');
}
function startCarousel() {
    if (appState.carouselInterval) clearInterval(appState.carouselInterval);
    appState.carouselIndex = 0;
    appState.carouselInterval = setInterval(() => {
        appState.carouselIndex = (appState.carouselIndex + 1) % Math.max(1, appState.featuredProducts.slice(0,4).length);
        const track = document.getElementById('featured-carousel');
        if(track) track.style.transform = `translateX(-${appState.carouselIndex * 100}%)`;
    }, 4000);
}

// LÓGICA DE MOVIMENTAÇÃO
window.moveCarousel = function(step) {
    const track = document.getElementById('featured-carousel');
    const total = Math.min(appState.featuredProducts.slice(0, 4).length, 4);
    if (!track || total === 0) return;

    appState.carouselIndex = (appState.carouselIndex + step + total) % total;
    track.style.transform = `translateX(-${appState.carouselIndex * 100}%)`;
    
    // Atualiza bolinhas
    document.querySelectorAll('.dot-indicator').forEach((dot, i) => {
        dot.classList.toggle('bg-primary', i === appState.carouselIndex);
        dot.classList.toggle('w-4', i === appState.carouselIndex);
        dot.classList.toggle('bg-white/50', i !== appState.carouselIndex);
        dot.classList.toggle('w-2', i !== appState.carouselIndex);
    });
};

window.goToSlide = function(index) {
    const diff = index - appState.carouselIndex;
    window.moveCarousel(diff);
};

function startCarousel() {
    if (appState.carouselInterval) clearInterval(appState.carouselInterval);
    appState.carouselInterval = setInterval(() => {
        window.moveCarousel(1);
    }, 5000);
}

// 2. PRODUCT PAGE
function renderProductPage(container) {
    const product = appState.currentProduct;
    if (!product) return navigateTo('home');

    container.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-8">
            <button onclick="navigateTo('home')" class="mb-4 text-gray-500 hover:text-primary">← Voltar</button>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white rounded-2xl overflow-hidden shadow-lg aspect-square relative">
                    <img src="${product.images?.[0]}" class="w-full h-full object-cover">
                    ${product.badges?.[0] ? `<div class="absolute top-4 left-4">${getBadgeHtml(product.badges[0])}</div>` : ''}
                </div>
                <div>
                    <span class="${getStoreColor(product.store)} text-white px-3 py-1 rounded-full text-sm font-semibold">${product.store}</span>
                    <h1 class="text-3xl font-bold mt-4 mb-2 text-secondary">${product.title}</h1>
                    <div class="flex items-center gap-2 mb-6">
                        ${renderStars(product.rating || 0)} <span class="text-gray-500">(${product.rating})</span>
                    </div>
                    <div class="text-4xl font-bold text-primary mb-6">${formatPrice(product.price)}</div>
                    <p class="text-gray-600 mb-8 leading-relaxed">${product.description || 'Sem descrição.'}</p>
                    
                    <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer" 
                       class="block w-full bg-primary hover:bg-orange-600 text-white text-center py-4 rounded-xl font-bold text-lg transition-all pulse-btn shadow-lg shadow-orange-500/30">
                       Comprar na ${product.store} ↗
                    </a>
                    <p class="text-xs text-center text-gray-400 mt-2">Você será redirecionado para o site seguro da loja.</p>
                </div>
            </div>
        </div>
    `;
}

// 3. SEARCH & CATEGORY PAGE
function renderSearchPage(container) {
    let results = appState.products.filter(p => {
        const matchQuery = !appState.searchQuery || p.title.toLowerCase().includes(appState.searchQuery.toLowerCase());
        const matchCat = !appState.filters.category || p.category === appState.filters.category;
        const matchStore = !appState.filters.store || p.store === appState.filters.store;
        return matchQuery && matchCat && matchStore;
    });

    // Dummy render for category page re-use
    renderCategoryPage(container, results);
}

function renderCategoryPage(container, resultsOverride = null) {
    // Se não foi passado resultado (veio do clique em categoria), filtra aqui
    let results = resultsOverride;
    if (!results) {
         results = appState.products.filter(p => !appState.filters.category || p.category === appState.filters.category);
    }

    container.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-8 fade-in">
            <h1 class="text-2xl font-bold mb-6">
                ${appState.searchQuery ? `Resultados para "${appState.searchQuery}"` : 'Produtos'}
            </h1>
            
            <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
               ${[{ name: 'Todas', value: '' }, ...appState.stores].map(store => `
                   <button onclick="updateFilter('store', '${store.value || ''}')" 
                   class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${appState.filters.store === (store.value || '') ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}">
                   ${store.name || store.value}
                   </button>
               `).join('')}
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in" style="animation-delay: 0.1s">
                ${renderProductCards(results)}
            </div>
        </div>
    `;
}

function renderAboutPage(container) {
    container.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-12 fade-in">
            <div class="mb-12">
                <h1 class="text-4xl font-bold text-primary mb-4">Sobre Seleto</h1>
                <p class="text-gray-600 text-lg leading-relaxed">
                    Seleto é um marketplace afiliado que reúne os melhores produtos selecionados das principais lojas 
                    de comércio eletrônico do Brasil. Nossa missão é simplificar a busca por produtos de qualidade 
                    oferecendo uma experiência de compra inteligente e personalizável.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 mb-12">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-xl font-bold text-secondary mb-3">🎯 Nossa Missão</h3>
                    <p class="text-gray-600">Conectar consumidores aos melhores produtos com as melhores ofertas do mercado.</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-xl font-bold text-secondary mb-3">💡 Nossa Visão</h3>
                    <p class="text-gray-600">Ser o marketplace mais confiável e fácil de usar no Brasil.</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-xl font-bold text-secondary mb-3">🤝 Valores</h3>
                    <p class="text-gray-600">Transparência, qualidade e confiança em cada transação.</p>
                </div>
            </div>

            <div class="bg-primary/10 p-8 rounded-xl mb-12">
                <h2 class="text-2xl font-bold mb-4">Por que Escolher Seleto?</h2>
                <ul class="space-y-3 text-gray-700">
                    <li class="flex items-center gap-3"><span class="text-primary font-bold">✓</span> Produtos curados e selecionados</li>
                    <li class="flex items-center gap-3"><span class="text-primary font-bold">✓</span> Melhores preços do mercado</li>
                    <li class="flex items-center gap-3"><span class="text-primary font-bold">✓</span> Compra segura com as lojas confiáveis</li>
                    <li class="flex items-center gap-3"><span class="text-primary font-bold">✓</span> Sistema de avaliações de usuários</li>
                    <li class="flex items-center gap-3"><span class="text-primary font-bold">✓</span> Interface fácil e intuitiva</li>
                </ul>
            </div>

            <button onclick="navigateTo('home')" class="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all">
                ← Voltar à Home
            </button>
        </div>
    `;
}

function renderTermsPage(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-12 fade-in">
            <h1 class="text-4xl font-bold text-primary mb-8">Termos de Uso</h1>
            
            <div class="prose prose-lg max-w-none space-y-6">
                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">1. Aceitação dos Termos</h2>
                    <p class="text-gray-700">
                        Ao acessar e usar o Seleto Commerce, você concorda em estar vinculado por estes termos e condições. 
                        Se você não concordar com qualquer parte destes termos, você não poderá usar o serviço.
                    </p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">2. Uso do Serviço</h2>
                    <p class="text-gray-700">
                        O Seleto é um marketplace afiliado que funciona como intermediário entre você e as lojas parceiras. 
                        Quando você clica em um produto, você é redirecionado para o site do vendedor afiliado.
                    </p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">3. Comissões de Afiliado</h2>
                    <p class="text-gray-700">
                        O Seleto ganha comissões dos parceiros quando você realiza uma compra através de nossos links. 
                        Isso não afeta o preço final do produto para você.
                    </p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">4. Responsabilidade</h2>
                    <p class="text-gray-700">
                        O Seleto não é responsável por:
                    </p>
                    <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Qualidade dos produtos vendidos</li>
                        <li>Entrega e prazos</li>
                        <li>Devoluções e reembolsos</li>
                        <li>Atendimento ao cliente</li>
                    </ul>
                    <p class="text-gray-700 mt-3">
                        Essas responsabilidades são exclusivas das lojas parceiras.
                    </p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">5. Modificações</h2>
                    <p class="text-gray-700">
                        O Seleto se reserva o direito de modificar estes termos a qualquer momento. 
                        Mudanças significativas serão notificadas aos usuários.
                    </p>
                </section>

                <section>
                    <h2 class="text-2xl font-bold text-secondary mb-3">6. Contato</h2>
                    <p class="text-gray-700">
                        Para dúvidas sobre estes termos, entre em contato conosco em:
                        <br/><strong>${siteConfig.contactEmail}</strong>
                    </p>
                </section>
            </div>

            <button onclick="navigateTo('home')" class="mt-8 bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all">
                ← Voltar à Home
            </button>
        </div>
    `;
}

function updateFilter(key, val) {
    appState.filters[key] = val;
    renderPage();
}

// Tenta obter metadados básicos de preço/avaliacao a partir do link do afiliado (melhor esforço)
async function fetchAffiliateMetadata(url) {
    if (!url || url === '#') return {};
    try {
        const res = await fetch(url, { mode: 'cors' });
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        // tenta pegar meta og:price:amount ou itemprop
        const metaPrice = doc.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
            || doc.querySelector('meta[name="price"]')?.getAttribute('content')
            || doc.querySelector('[itemprop="price"]')?.getAttribute('content');
        const metaRating = doc.querySelector('meta[property="og:rating"]')?.getAttribute('content')
            || doc.querySelector('[itemprop="ratingValue"]')?.getAttribute('content');
        return { price: metaPrice, rating: metaRating };
    } catch (e) {
        // CORS ou bloqueio comum — retornamos vazio
        console.warn('fetchAffiliateMetadata failed:', e);
        return {};
    }
}

function renderProductCards(products) {
    if (!products.length) return `<div class="col-span-full text-center text-gray-500 py-10">Nenhum produto encontrado.</div>`;
    return products.map((p, i) => `
        <div class="card-hover bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-gray-100 fade-in" onclick="viewProduct('${p.slug}')" style="animation-delay: ${i * 0.05}s">
            <div class="relative aspect-square">
                <img src="${p.images?.[0] || ''}" class="w-full h-full object-cover bg-gray-300" loading="lazy" onerror="this.style.background='#ddd'">
                <div class="absolute top-2 right-2">
                    <span class="${getStoreColor(p.store)} text-white text-[10px] font-bold px-2 py-1 rounded-full">${p.store}</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-medium text-secondary line-clamp-2 text-sm h-10 mb-2">${p.title}</h3>
                <div class="flex items-center justify-between">
                    <span class="font-bold text-primary">${formatPrice(p.price)}</span>
                    <div class="flex text-yellow-400 text-xs gap-0.5">★ ${p.rating || 0}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function viewProduct(slug) {
    appState.currentProduct = appState.products.find(p => p.slug === slug);
    navigateTo('product');
}

// =====================================================
// ADMIN PANEL RENDERER
// =====================================================
function renderAdminPanel() {
    const adminPanelEl = document.getElementById('admin-panel');
    const pageContainer = document.getElementById('page-container');
    // Use page container only if header should stay visible
    const panel = pageContainer || adminPanelEl;
    
    // Login Screen
    if (!appState.isAdmin) {
        panel.innerHTML = `
            <div class="h-screen flex items-center justify-center bg-gray-100">
                <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <h2 class="text-2xl font-bold mb-6">Admin Login</h2>
                    <button onclick="handleGoogleLogin()" class="w-full bg-white border-2 border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-semibold text-gray-700">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6"> Entrar com Google
                    </button>
                    <button onclick="navigateTo('home')" class="mt-6 text-gray-400 text-sm hover:text-primary">Voltar ao site</button>
                </div>
            </div>
        `;
        return;
    }

    // Admin Dashboard
    // Garantir seção padrão
    if (appState.adminSection === 'dashboard') appState.adminSection = 'products';
    
    // IMPORTANTE: Se renderizando no page-container (header visível), não limpar tudo
    // Deixar o header intacto
    const adminContent = `
        <div class="flex flex-col md:flex-row gap-0 md:gap-4 bg-gray-50 min-h-screen">
            <aside class="w-full md:w-64 bg-secondary text-white">
                <div class="p-4 md:p-6 font-bold text-lg md:text-xl border-b border-gray-700 flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Painel Admin</span>
                </div>
                <nav class="p-2 md:p-4 space-y-1 md:space-y-2 flex md:flex-col gap-1 md:gap-0 overflow-x-auto md:overflow-visible">
                    <button onclick="appState.adminSection='products'; renderAdminPanel()" class="flex-shrink-0 px-4 py-3 rounded hover:bg-white/10 transition-colors ${appState.adminSection === 'products' ? 'bg-primary text-white' : 'text-gray-300'} text-sm md:text-base">Produtos</button>
                    <button onclick="navigateTo('home')" class="flex-shrink-0 px-4 py-3 rounded hover:bg-white/10 text-gray-400 transition-colors text-sm md:text-base">Ver Site</button>
                    <button onclick="handleLogout()" class="flex-shrink-0 px-4 py-3 rounded hover:bg-red-500/20 text-red-300 transition-colors text-sm md:text-base">Sair</button>
                </nav>
            </aside>
            
            <main class="flex-1 overflow-auto p-4 md:p-8 w-full">
                ${renderAdminContent()}
            </main>
        </div>
        
        <div id="product-modal" class="modal-backdrop"></div>
    `;
    
    panel.innerHTML = adminContent;
}

function renderAdminContent() {
    if (appState.adminSection === 'products') return renderAdminProducts();
    return '';
}

function renderAdminProducts() {
    return `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl md:text-3xl font-bold text-secondary">Gerenciar Produtos</h2>
                    <p class="text-gray-500 text-sm mt-1">${appState.products.length} produto(s) cadastrado(s)</p>
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                    <button onclick="openProductModal()" class="bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2 justify-center">
                        <span>➕</span>
                        <span>Novo Produto</span>
                    </button>
                    <button onclick="addTestProduct()" class="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        🧪 Produto de Teste
                    </button>
                </div>
            </div>
            
            <!-- Tabela de Produtos (Desktop) -->
            <div class="hidden sm:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200">
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produto</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Loja</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Preço</th>
                            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appState.products.map(p => `
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-3">
                                        <img src="${p.images?.[0] || ''}" alt="${p.title}" class="w-10 h-10 rounded object-cover bg-gray-200" onerror="this.style.background='#ddd'">
                                        <div>
                                            <div class="font-medium text-gray-900 text-sm">${p.title}</div>
                                            <div class="text-xs text-gray-500">${p.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-700">${p.store}</span></td>
                                <td class="px-4 py-3 font-bold text-primary">R$ ${p.price.toFixed(2)}</td>
                                <td class="px-4 py-3 text-right space-x-2">
                                    <button onclick="editProduct('${p.id}')" class="text-blue-500 hover:text-blue-700 font-medium text-sm">✏️ Editar</button>
                                    <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700 font-medium text-sm">🗑️ Excluir</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Cards de Produtos (Mobile) -->
            <div class="sm:hidden grid grid-cols-1 gap-4">
                ${appState.products.map(p => `
                    <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <div class="flex gap-3">
                            <img src="${p.images?.[0] || ''}" alt="${p.title}" class="w-16 h-16 rounded object-cover flex-shrink-0 bg-gray-200" onerror="this.style.background='#ddd'">
                            <div class="flex-1">
                                <div class="font-medium text-gray-900 text-sm">${p.title}</div>
                                <div class="text-xs text-gray-500">${p.category}</div>
                                <div class="mt-2 flex gap-2 items-center">
                                    <span class="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-700">${p.store}</span>
                                    <span class="font-bold text-primary">R$ ${p.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 pt-2 border-t border-gray-200">
                            <button onclick="editProduct('${p.id}')" class="flex-1 px-3 py-2 text-blue-500 hover:bg-blue-50 rounded text-sm font-medium">✏️ Editar</button>
                            <button onclick="deleteProduct('${p.id}')" class="flex-1 px-3 py-2 text-red-500 hover:bg-red-50 rounded text-sm font-medium">🗑️ Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Mensagem vazia -->
            ${appState.products.length === 0 ? `
                <div class="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div class="text-4xl mb-2">📦</div>
                    <h3 class="text-lg font-semibold text-gray-700">Nenhum produto cadastrado</h3>
                    <p class="text-gray-500 text-sm mt-2">Clique no botão acima para adicionar seu primeiro produto</p>
                </div>
            ` : ''}
        </div>
    `;
}

// =====================================================
// ADMIN CRUD OPERATIONS
// =====================================================
function openProductModal(productId = null) {
    const product = productId ? appState.products.find(p => p.id === productId) : null;
    const modal = document.getElementById('product-modal');
    
    modal.innerHTML = `
        <div class="modal-content p-4 md:p-8 max-h-screen overflow-y-auto">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-300">
                <h3 class="text-2xl md:text-3xl font-bold text-secondary">
                    ${product ? '✏️ Editar' : '➕ Novo'} Produto
                </h3>
                <button onclick="document.getElementById('product-modal').classList.remove('active')" class="modal-close" aria-label="Fechar">&times;</button>
            </div>

            <form id="admin-product-form" onsubmit="handleProductSubmit(event, '${productId || ''}')" class="space-y-6">
                
                <!-- Seção: Informações Básicas -->
                <fieldset class="space-y-4">
                    <legend class="text-lg font-bold text-secondary flex items-center gap-2 pb-2 border-b border-gray-300">
                        📝 Informações Básicas
                    </legend>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nome do Produto *</label>
                        <input type="text" name="title" value="${product?.title || ''}" placeholder="Ex: Fone Bluetooth Wireless" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Preço (R$) *</label>
                            <input type="number" step="0.01" name="price" value="${product?.price || ''}" placeholder="0.00" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Avaliação (0-5)</label>
                            <input type="number" step="0.1" max="5" name="rating" value="${product?.rating || 4.5}" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                        <textarea name="description" rows="3" placeholder="Descreva o produto..." class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors resize-none">${product?.description || ''}</textarea>
                    </div>
                </fieldset>

                <!-- Seção: Categorias e Loja -->
                <fieldset class="space-y-4">
                    <legend class="text-lg font-bold text-secondary flex items-center gap-2 pb-2 border-b border-gray-300">
                        🏪 Categoria e Loja
                    </legend>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
                            <input type="text" name="category" value="${product?.category || ''}" placeholder="Ex: Eletrônicos, Moda, Casa" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Loja Vendedora *</label>
                            <select name="store" required class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                                <option value="">Selecione uma loja</option>
                                <option value="Amazon" ${product?.store === 'Amazon' ? 'selected' : ''}>Amazon</option>
                                <option value="Shopee" ${product?.store === 'Shopee' ? 'selected' : ''}>Shopee</option>
                                <option value="TikTok Shop" ${product?.store === 'TikTok Shop' ? 'selected' : ''}>TikTok Shop</option>
                                <option value="Magalu" ${product?.store === 'Magalu' ? 'selected' : ''}>Magalu</option>
                            </select>
                        </div>
                    </div>
                </fieldset>

                <!-- Seção: Links -->
                <fieldset class="space-y-4">
                    <legend class="text-lg font-bold text-secondary flex items-center gap-2 pb-2 border-b border-gray-300">
                        🔗 Links
                    </legend>

                    <div>
                        <label class="block text-sm font-semibold text-primary mb-2">Link de Afiliado (URL Completa) *</label>
                        <input type="url" name="affiliateUrl" value="${product?.affiliateUrl || ''}" placeholder="https://exemplo.com/produto?id=123" required class="w-full border-2 border-primary rounded-lg p-3 focus:border-orange-600 focus:outline-none transition-colors">
                        <p class="text-xs text-gray-500 mt-1">⚠️ Este link é fundamental para ganhar comissões de afiliado</p>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">URL da Imagem do Produto</label>
                        <input type="url" name="image" value="${product?.images?.[0] || ''}" placeholder="https://exemplo.com/imagem.jpg" class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors">
                        ${product?.images?.[0] ? `
                            <div class="mt-2 p-2 bg-gray-100 rounded flex items-center gap-3">
                                <img src="${product.images[0] || ''}" alt="Preview" class="w-12 h-12 rounded object-cover bg-gray-200" onerror="this.style.background='#ddd'">
                                <span class="text-sm text-gray-600">Imagem atual</span>
                            </div>
                        ` : ''}
                    </div>
                </fieldset>

                <!-- Seção: Badges -->
                <fieldset class="space-y-3">
                    <legend class="text-lg font-bold text-secondary flex items-center gap-2 pb-2 border-b border-gray-300">
                        🎯 Destaque
                    </legend>

                    <div class="space-y-2">
                        <label class="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" name="badge_em_alta" ${product?.badges?.includes('em_alta') ? 'checked' : ''} class="w-5 h-5 text-primary rounded cursor-pointer">
                            <span class="flex-1">
                                <span class="font-semibold text-gray-700">🔥 Em Alta</span>
                                <p class="text-xs text-gray-500">Destaque no topo da página</p>
                            </span>
                        </label>
                        
                        <label class="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" name="badge_mais_vendido" ${product?.badges?.includes('mais_vendido') ? 'checked' : ''} class="w-5 h-5 text-primary rounded cursor-pointer">
                            <span class="flex-1">
                                <span class="font-semibold text-gray-700">⭐ Mais Vendido</span>
                                <p class="text-xs text-gray-500">Destaca como produto popular</p>
                            </span>
                        </label>

                        <label class="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" name="badge_custo_beneficio" ${product?.badges?.includes('custo_beneficio') ? 'checked' : ''} class="w-5 h-5 text-primary rounded cursor-pointer">
                            <span class="flex-1">
                                <span class="font-semibold text-gray-700">💰 Custo-Benefício</span>
                                <p class="text-xs text-gray-500">Melhor relação preço-qualidade</p>
                            </span>
                        </label>
                    </div>
                </fieldset>

                <!-- Botões de Ação -->
                <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-300">
                    <button type="button" onclick="document.getElementById('product-modal').classList.remove('active')" class="flex-1 py-3 border-2 border-gray-400 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                        ❌ Cancelar
                    </button>
                    <button type="submit" class="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                        ✅ ${product ? 'Atualizar' : 'Criar'} Produto
                    </button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
}

function editProduct(id) {
    openProductModal(id);
}

async function handleProductSubmit(event, id) {
    event.preventDefault();
    
    // Verificar se usuário está autenticado
    if (!appState.adminUser) {
        showToast('❌ Você deve estar autenticado para salvar produtos.', 'error');
        console.warn('Tentativa de salvar sem autenticação');
        return;
    }
    
    const form = event.target;
    
    const badges = [];
    if(form.badge_em_alta.checked) badges.push('em_alta');
    if(form.badge_mais_vendido.checked) badges.push('mais_vendido');

    const productData = {
        title: form.title.value,
        slug: generateSlug(form.title.value),
        price: parseFloat(form.price.value),
        store: form.store.value,
        category: form.category.value,
        rating: parseFloat(form.rating.value),
        affiliateUrl: form.affiliateUrl.value,
        images: [form.image.value],
        description: form.description.value,
        badges: badges,
        active: true,
        createdBy: appState.adminUser.uid,
        updatedAt: serverTimestamp()
    };

    try {
        // NOTA: fetchAffiliateMetadata removido (causa CORS)
        // Preço e rating devem ser preenchidos manualmente pelo admin

        if (id) {
            await updateDoc(doc(db, "products", id), productData);
            console.log('✅ Produto atualizado no Firestore:', id);
            showToast('Produto atualizado!');
        } else {
            productData.createdAt = serverTimestamp();
            const docRef = await addDoc(collection(db, "products"), productData);
            console.log('✅ Produto criado no Firestore:', docRef.id);
            showToast('Produto criado!');
        }
        document.getElementById('product-modal').classList.remove('active');
        await loadProducts(); // Reload from Firestore
        renderAdminPanel();   // Re-render table
    } catch (e) {
        console.error('❌ Erro ao salvar no Firestore:', {
            code: e.code,
            message: e.message,
            userUid: appState.adminUser?.uid,
            fullError: e
        });
        // Fallback local para desenvolvimento
        const fallback = { id: 'local-' + Date.now(), ...productData, createdAt: Date.now(), createdBy: appState.adminUser.uid };
        appState.products.unshift(fallback);
        document.getElementById('product-modal').classList.remove('active');
        showToast('❌ Falha ao salvar no Firestore — produto adicionado localmente.', 'error');
        renderAdminPanel();
    }
}

async function deleteProduct(id) {
    if(!confirm("Tem certeza que deseja excluir?")) return;
    try {
        await deleteDoc(doc(db, "products", id));
        showToast('Produto excluído.');
        await loadProducts();
        renderAdminPanel();
    } catch (e) {
        showToast('Erro ao excluir.', 'error');
    }
}

// Adiciona um produto de teste (útil para validar o fluxo do admin sem preencher o formulário)
async function addTestProduct() {
    if (!appState.adminUser) {
        showToast('❌ Você deve estar autenticado.', 'error');
        console.warn('Tentativa de adicionar produto de teste sem autenticação');
        console.log('Admin user:', appState.adminUser);
        console.log('Is admin:', appState.isAdmin);
        return;
    }
    
    const sample = {
        title: 'Produto de Teste - Inserido Rápido',
        slug: generateSlug('Produto de Teste - Inserido Rápido'),
        price: 99.90,
        store: 'Amazon',
        category: appState.categories?.[0]?.slug || 'outros',
        rating: 4.5,
        affiliateUrl: '#',
        images: [''],  // Sem imagem
        description: 'Produto criado automaticamente para testes via painel admin.',
        badges: [],
        active: true,
        createdBy: appState.adminUser.uid,
        createdAt: serverTimestamp()
    };

    let savedToFirestore = false;
    try {
        console.log('📤 Tentando salvar produto de teste no Firestore...', {
            userUid: appState.adminUser?.uid,
            isAdmin: appState.isAdmin
        });
        
        const docRef = await addDoc(collection(db, 'products'), sample);
        savedToFirestore = true;
        console.log('✅ Produto de teste criado no Firestore:', docRef.id);
        showToast('✅ Produto de teste salvo no Firestore!', 'success');
    } catch (err) {
        console.error('❌ Erro ao salvar produto de teste:', {
            code: err.code,
            message: err.message,
            userUid: appState.adminUser?.uid,
            isAdmin: appState.isAdmin,
            fullError: err
        });
        // fallback local
        sample.id = 'local-' + Date.now();
        sample.createdAt = Date.now();
        appState.products.unshift(sample);
        showToast('❌ Falha ao salvar — adicionado localmente.', 'error');
    }

    if (savedToFirestore) {
        await loadProducts();
    }
    renderAdminPanel();
}

// =====================================================
// GLOBAL BINDINGS (Obrigatório para type="module")
// =====================================================
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.navigateTo = navigateTo;
window.viewProduct = viewProduct;
window.updateFilter = updateFilter;

// Funções do Admin
window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleProductSubmit = handleProductSubmit;
window.addTestProduct = addTestProduct;

// =====================================================
// RENDERIZAÇÃO DE CATEGORIAS
// =====================================================
function renderCategoriesNav() {
    const nav = document.getElementById('categories-nav');
    if(!nav) return;
    
    let html = `
        <button onclick="window.updateFilter('category', ''); window.navigateTo('search')" 
        class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border border-transparent transition-all ${appState.filters.category === '' && appState.currentPage === 'search' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-600'}">
        Todas
        </button>
    `;

    html += appState.categories.map(c => 
        `<button onclick="window.updateFilter('category', '${c.slug}'); window.navigateTo('search')" 
         class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border border-transparent transition-all ${appState.filters.category === c.slug && appState.currentPage === 'search' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-600'}">
         ${c.name}
         </button>`
    ).join('');

    nav.innerHTML = html;
}

function renderFooterStores() {
    const footerStores = document.getElementById('footer-stores');
    if (!footerStores) return;

    let html = appState.stores.map(store => `
        <div class="text-center">
            <div class="bg-white p-3 rounded-lg mb-2 h-16 flex items-center justify-center">
                <img src="${store.logo || ''}" alt="${store.name}" class="max-h-12 max-w-32 object-contain bg-gray-200 p-2 rounded" onerror="this.style.background='#ddd'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.textContent='${store.name}';">
            </div>
            <p class="text-xs text-gray-400">${store.name}</p>
        </div>
    `).join('');

    footerStores.innerHTML = html || '<p class="text-gray-400">Nenhuma loja parceira no momento</p>';
}

// =====================================================
// INITIALIZATION
// =====================================================
(async function init() {
    console.log("Iniciando Seleto Commerce...");

    // Aplicar tema salvo
    applyTheme();

    // 1. Configurar Listeners da Interface
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') {
                appState.searchQuery = e.target.value;
                navigateTo('search');
            }
        });
    }
    
    const mobileSearch = document.getElementById('mobile-search-input');
    if (mobileSearch) {
         mobileSearch.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') {
                appState.searchQuery = e.target.value;
                navigateTo('search');
            }
        });
    }

    document.getElementById('nav-logo')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('home');
    });

    document.getElementById('btn-admin-login')?.addEventListener('click', () => {
        navigateTo('admin-dashboard'); 
    });
    
    // Mobile Menu Button
    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
        showToast('Menu Mobile em desenvolvimento', 'info');
    });

    // Botão de tema (se existir)
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Atualizar botão de admin/login conforme estado
    updateAdminButton();

    // 2. Carregar Dados Iniciais
    await Promise.all([loadProducts(), loadCategories(), loadStores()]);
    
    // 3. Remover Tela de Carregamento
    const loadingScreen = document.getElementById('loading-screen');
    if(loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.classList.add('hidden'), 500);
    }
    
    // 4. Renderizar Estado Inicial
    renderCategoriesNav();
    renderFooterStores();
    renderPage();
    
    console.log("Aplicação carregada com sucesso.");

})();






