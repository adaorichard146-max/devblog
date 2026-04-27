/**
 * DEVBLOG — Motor de Dados v5
 * localStorage como base de dados completa
 *
 * Correcções implementadas:
 * 1. Session guarda só o ID → dados sempre frescos dos USERS (avatares persistem)
 * 2. Promoções bidirecionais via sistema de notificações
 * 3. Notificações de aprovação/rejeição com conteúdo claro
 * 4. Newsletter dispara notificações internas aos subscritores
 * 5. Sistema de notificações com badge de não lidas
 * 6. Navbar com flexbox correcto (logo ← links → acções)
 * 7. Tema do admin com 5 opções persistidas
 * 8. Posts recentes = todos ordenados por data; destaque = separado
 */

/* ─────────────────────────────────────────
   CONSTANTES E HELPERS DE STORAGE
───────────────────────────────────────── */
const STORAGE_KEYS = {
  USERS:      'db_users',
  POSTS:      'db_posts',
  COMMENTS:   'db_comments',
  REACTIONS:  'db_reactions',
  CATS:       'db_categories',
  SESSION:    'db_session',      // guarda apenas { id }
  PROMOTIONS: 'db_promotions',
  NOTIFS:     'db_notifications',
  SUBSCRIBERS:'db_subscribers',
  ADMIN_THEME:'db_admin_theme',
  SEEDED:     'db_seeded_v5',
};

function storageGet(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('[DevBlog] Erro ao guardar:', key, err);
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function nowISO() {
  return new Date().toISOString();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora mesmo';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `há ${d}d`;
  return formatDate(iso);
}

function wordCount(html) {
  return (html || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
}

function readTime(html) {
  return Math.max(1, Math.ceil(wordCount(html) / 200)) + ' min';
}

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .slice(0, 60);
}

function textToHtml(text) {
  if (!text) return '';
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  if (hasHtml) return text;
  return text.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => `<p>${l}</p>`)
    .join('');
}

/* ─────────────────────────────────────────
   SEED — DADOS INICIAIS
───────────────────────────────────────── */
function seedDatabase() {
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) return;

  const t = Date.now();
  const day = 864e5;

  storageSet(STORAGE_KEYS.USERS, [
    {
      id: 'u1', name: 'Admin DevBlog', email: 'admin@devblog.ao',
      password: 'admin123', role: 'admin',
      bio: 'Administrador do DevBlog. Apaixonado por tecnologia e comunidade.',
      avatar: null, subscribedNewsletter: false, createdAt: nowISO(),
    },
    {
      id: 'u2', name: 'Ana Escritora', email: 'escritora@devblog.ao',
      password: 'escritora123', role: 'escritor',
      bio: 'Apaixonada por código, tutoriais e boas práticas de desenvolvimento.',
      avatar: null, subscribedNewsletter: true, createdAt: nowISO(),
    },
    {
      id: 'u3', name: 'Pedro Leitor', email: 'leitor@devblog.ao',
      password: 'leitor123', role: 'leitor',
      bio: 'Leitor assíduo do DevBlog. Sempre a aprender coisas novas.',
      avatar: null, subscribedNewsletter: false, createdAt: nowISO(),
    },
  ]);

  storageSet(STORAGE_KEYS.CATS, [
    { id: 'c1', name: 'Tecnologia', slug: 'tecnologia' },
    { id: 'c2', name: 'Design',     slug: 'design'     },
    { id: 'c3', name: 'Tutoriais',  slug: 'tutoriais'  },
    { id: 'c4', name: 'Node.js',    slug: 'nodejs'     },
    { id: 'c5', name: 'MySQL',      slug: 'mysql'      },
  ]);

  storageSet(STORAGE_KEYS.POSTS, [
    {
      id: 'p1', slug: 'api-rest-nodejs',
      title: 'Como construir uma API REST com Node.js, Express e MySQL',
      catId: 'c1', catSlug: 'tecnologia',
      authorId: 'u1', authorName: 'Admin DevBlog',
      excerpt: 'Neste guia vamos construir do zero uma API REST completa com autenticação JWT, middlewares de segurança e ligação ao MySQL.',
      content: '<p>Neste artigo vamos aprender a construir uma API REST completa. Vamos cobrir a instalação, configuração do Express, ligação ao MySQL e autenticação com JWT.</p><p>Primeiro, precisamos de instalar as dependências com o npm. Depois criamos o servidor Express e definimos as rotas da API.</p><p>O middleware JWT verifica o token em cada request protegida e garante que apenas utilizadores autorizados acedem aos recursos.</p>',
      image: null, status: 'publicado', featured: true, readTime: '12 min',
      createdAt: new Date(t - 5 * day).toISOString(),
      publishedAt: new Date(t - 5 * day).toISOString(),
    },
    {
      id: 'p2', slug: 'bootstrap-5-guia',
      title: 'Bootstrap 5: guia completo de componentes',
      catId: 'c2', catSlug: 'design',
      authorId: 'u2', authorName: 'Ana Escritora',
      excerpt: 'Aprende a usar o Bootstrap 5 de forma eficiente com exemplos práticos e dicas avançadas de layout responsivo.',
      content: '<p>O Bootstrap 5 é o framework CSS mais popular do mundo. Nesta versão foram removidas as dependências do jQuery e melhorada a documentação oficial.</p><p>O sistema de grelha baseia-se em 12 colunas flexíveis. Usa as classes col-* para definir larguras em diferentes breakpoints.</p><p>Os componentes principais incluem cards, modais, navbars e formulários — todos prontos a usar com simples classes CSS.</p>',
      image: null, status: 'publicado', featured: false, readTime: '7 min',
      createdAt: new Date(t - 8 * day).toISOString(),
      publishedAt: new Date(t - 8 * day).toISOString(),
    },
    {
      id: 'p3', slug: 'mysql-do-zero',
      title: 'MySQL do zero: tabelas, joins e índices',
      catId: 'c5', catSlug: 'mysql',
      authorId: 'u1', authorName: 'Admin DevBlog',
      excerpt: 'Tudo o que precisas de saber sobre MySQL para construir bases de dados robustas, rápidas e escaláveis.',
      content: '<p>O MySQL é um dos sistemas de bases de dados relacionais mais usados no mundo.</p><p>Vamos criar tabelas com CREATE TABLE, definindo tipos de dados e chaves primárias.</p><p>Depois exploramos os JOINs para combinar dados de múltiplas tabelas. O INNER JOIN retorna apenas os registos com correspondência nas duas tabelas.</p>',
      image: null, status: 'publicado', featured: false, readTime: '10 min',
      createdAt: new Date(t - 12 * day).toISOString(),
      publishedAt: new Date(t - 12 * day).toISOString(),
    },
  ]);

  storageSet(STORAGE_KEYS.COMMENTS, [
    {
      id: 'cm1', postId: 'p1', userId: 'u3', userName: 'Pedro Leitor', userAvatar: null,
      text: 'Excelente artigo! Aprendi muito sobre autenticação JWT.',
      createdAt: new Date(t - 4 * 36e5).toISOString(),
    },
    {
      id: 'cm2', postId: 'p2', userId: 'u3', userName: 'Pedro Leitor', userAvatar: null,
      text: 'Finalmente percebi o sistema de grelha do Bootstrap. Muito obrigado!',
      createdAt: new Date(t - 2 * day).toISOString(),
    },
  ]);

  storageSet(STORAGE_KEYS.REACTIONS, [
    { id: 'r1', postId: 'p1', userId: 'u2', type: 'like' },
    { id: 'r2', postId: 'p1', userId: 'u3', type: 'like' },
    { id: 'r3', postId: 'p2', userId: 'u3', type: 'like' },
  ]);

  storageSet(STORAGE_KEYS.PROMOTIONS,  []);
  storageSet(STORAGE_KEYS.NOTIFS,      []);
  storageSet(STORAGE_KEYS.SUBSCRIBERS, []);

  localStorage.setItem(STORAGE_KEYS.SEEDED, '1');
}

/* ─────────────────────────────────────────
   MÓDULO: SESSION
   FIX #1 — só guarda o ID, dados sempre frescos
───────────────────────────────────────── */
const Session = {
  get() {
    const s = storageGet(STORAGE_KEYS.SESSION, {});
    if (!s.id) return null;
    const user = Users.find(s.id);
    return user || null;
  },
  set(userId) {
    storageSet(STORAGE_KEYS.SESSION, { id: userId });
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  isLoggedIn() {
    const s = storageGet(STORAGE_KEYS.SESSION, {});
    return !!(s.id && Users.find(s.id));
  },
  currentUser() {
    return Session.get();
  },
  hasRole(...roles) {
    const user = Session.get();
    return user ? roles.includes(user.role) : false;
  },
};

/* ─────────────────────────────────────────
   MÓDULO: USERS
───────────────────────────────────────── */
const Users = {
  all() {
    return storageGet(STORAGE_KEYS.USERS);
  },
  find(id) {
    return Users.all().find(u => u.id === id) || null;
  },
  byEmail(email) {
    return Users.all().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  save(list) {
    storageSet(STORAGE_KEYS.USERS, list);
  },
  count() {
    return Users.all().length;
  },

  register(name, email, password) {
    if (!name || !email || !password) return { ok: false, error: 'Preenche todos os campos.' };
    if (Users.byEmail(email)) return { ok: false, error: 'Este email já está registado.' };
    const user = {
      id: uid(), name, email, password,
      role: 'leitor', bio: '', avatar: null,
      subscribedNewsletter: false, createdAt: nowISO(),
    };
    const list = Users.all();
    list.push(user);
    Users.save(list);
    return { ok: true, user };
  },

  login(email, password) {
    const user = Users.byEmail(email);
    if (!user)                  return { ok: false, error: 'Email não encontrado.' };
    if (user.password !== password) return { ok: false, error: 'Password incorrecta.' };
    Session.set(user.id);
    return { ok: true, user };
  },

  // FIX #1 — update directo na lista, session lê dados frescos
  update(id, data) {
    const list = Users.all().map(u => u.id === id ? { ...u, ...data } : u);
    Users.save(list);
  },

  updateRole(id, role) {
    Users.update(id, { role });
  },

  delete(id) {
    Users.save(Users.all().filter(u => u.id !== id));
  },
};

/* ─────────────────────────────────────────
   MÓDULO: CATEGORIES
───────────────────────────────────────── */
const Cats = {
  all()     { return storageGet(STORAGE_KEYS.CATS); },
  find(id)  { return Cats.all().find(c => c.id === id) || null; },
  bySlug(s) { return Cats.all().find(c => c.slug === s) || null; },
};

/* ─────────────────────────────────────────
   MÓDULO: POSTS
   FIX #8 — featured é uma flag, recentes = ordem por data
───────────────────────────────────────── */
const Posts = {
  all() {
    return storageGet(STORAGE_KEYS.POSTS);
  },
  find(id) {
    return Posts.all().find(p => p.id === id) || null;
  },
  published() {
    // Ordenados por data de publicação (mais recente primeiro)
    return Posts.all()
      .filter(p => p.status === 'publicado')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  },
  // Posts em destaque = published com featured:true
  featured() {
    return Posts.published().filter(p => p.featured);
  },
  // Posts recentes = todos os published, ordenados por data (SEM excluir featured)
  recent(limit = 20) {
    return Posts.published().slice(0, limit);
  },
  save(list) {
    storageSet(STORAGE_KEYS.POSTS, list);
  },
  count()      { return Posts.all().length; },
  pubCount()   { return Posts.published().length; },
  draftCount() { return Posts.all().filter(p => p.status === 'rascunho').length; },

  create(data) {
    const user = Session.currentUser();
    if (!user) return null;
    const content = textToHtml(data.content || '');
    const post = {
      id: uid(),
      slug: slugify(data.title) + '-' + uid().slice(-4),
      title: data.title,
      catId: data.catId,
      catSlug: Cats.find(data.catId)?.slug || '',
      authorId: user.id,
      authorName: user.name,
      excerpt: data.excerpt || content.replace(/<[^>]+>/g, '').slice(0, 160) + '...',
      content,
      image: data.image || null,
      status: data.status || 'rascunho',
      featured: !!data.featured,
      readTime: readTime(content),
      createdAt: nowISO(),
      publishedAt: data.status === 'publicado' ? nowISO() : null,
    };
    const list = Posts.all();
    list.unshift(post);
    Posts.save(list);
    // FIX #4 — notificar subscritores ao publicar
    if (post.status === 'publicado') Notifs.notifyNewPost(post);
    return post;
  },

  update(id, data) {
    let justPublished = null;
    const list = Posts.all().map(p => {
      if (p.id !== id) return p;
      const content = data.content ? textToHtml(data.content) : p.content;
      const updated = {
        ...p, ...data,
        content,
        readTime: readTime(content),
        updatedAt: nowISO(),
      };
      if (data.status === 'publicado' && p.status !== 'publicado') {
        updated.publishedAt = nowISO();
        justPublished = updated;
      }
      if (!data.excerpt && data.content) {
        updated.excerpt = content.replace(/<[^>]+>/g, '').slice(0, 160) + '...';
      }
      return updated;
    });
    Posts.save(list);
    // FIX #4 — notificar subscritores quando post passa a publicado
    if (justPublished) Notifs.notifyNewPost(justPublished);
  },

  delete(id) {
    Posts.save(Posts.all().filter(p => p.id !== id));
    Comments.deleteByPost(id);
    Reactions.deleteByPost(id);
  },
};

/* ─────────────────────────────────────────
   MÓDULO: COMMENTS
───────────────────────────────────────── */
const Comments = {
  all()            { return storageGet(STORAGE_KEYS.COMMENTS); },
  byPost(postId)   { return Comments.all().filter(c => c.postId === postId); },
  save(list)       { storageSet(STORAGE_KEYS.COMMENTS, list); },
  count()          { return Comments.all().length; },
  deleteByPost(id) { Comments.save(Comments.all().filter(c => c.postId !== id)); },

  add(postId, text) {
    const user = Session.currentUser();
    if (!user) return null;
    const full = Users.find(user.id);
    const comment = {
      id: uid(), postId,
      userId: user.id, userName: user.name,
      userAvatar: full?.avatar || null,
      text, createdAt: nowISO(),
    };
    const list = Comments.all();
    list.push(comment);
    Comments.save(list);
    // Notificar o autor do post
    const post = Posts.find(postId);
    if (post && post.authorId !== user.id) {
      Notifs.add(post.authorId, {
        type: 'comment', icon: '💬',
        title: 'Novo comentário no teu post',
        body: `${user.name} comentou em "${post.title.slice(0, 50)}"`,
        link: `post.html?id=${postId}`,
      });
    }
    return comment;
  },

  delete(id) {
    Comments.save(Comments.all().filter(c => c.id !== id));
  },
};

/* ─────────────────────────────────────────
   MÓDULO: REACTIONS
───────────────────────────────────────── */
const Reactions = {
  all()             { return storageGet(STORAGE_KEYS.REACTIONS); },
  save(list)        { storageSet(STORAGE_KEYS.REACTIONS, list); },
  deleteByPost(id)  { Reactions.save(Reactions.all().filter(r => r.postId !== id)); },

  byPost(postId) {
    const all = Reactions.all().filter(r => r.postId === postId);
    return {
      likes:    all.filter(r => r.type === 'like').length,
      dislikes: all.filter(r => r.type === 'dislike').length,
    };
  },

  userReaction(postId) {
    const user = Session.currentUser();
    if (!user) return null;
    return Reactions.all().find(r => r.postId === postId && r.userId === user.id)?.type || null;
  },

  toggle(postId, type) {
    if (!Session.isLoggedIn()) return { ok: false };
    const user = Session.currentUser();
    let list = Reactions.all();
    const existing = list.find(r => r.postId === postId && r.userId === user.id);

    if (existing) {
      if (existing.type === type) {
        list = list.filter(r => !(r.postId === postId && r.userId === user.id));
      } else {
        list = list.map(r =>
          r.postId === postId && r.userId === user.id ? { ...r, type } : r
        );
      }
    } else {
      list.push({ id: uid(), postId, userId: user.id, type });
    }
    Reactions.save(list);
    return { ok: true, counts: Reactions.byPost(postId) };
  },
};

/* ─────────────────────────────────────────
   MÓDULO: NOTIFICATIONS
   FIX #5 — sistema completo com badge
───────────────────────────────────────── */
const Notifs = {
  all()         { return storageGet(STORAGE_KEYS.NOTIFS); },
  save(list)    { storageSet(STORAGE_KEYS.NOTIFS, list); },

  forUser(userId) {
    return Notifs.all()
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  unreadCount(userId) {
    return Notifs.forUser(userId).filter(n => !n.read).length;
  },

  add(userId, data) {
    const notif = { id: uid(), userId, read: false, createdAt: nowISO(), ...data };
    const list = Notifs.all();
    list.unshift(notif);
    // Manter máx. 50 notificações por utilizador
    const trimmed = list.filter((n, i, arr) => {
      const userNotifs = arr.filter(x => x.userId === userId);
      return userNotifs.indexOf(n) < 50;
    });
    Notifs.save(trimmed);
  },

  markRead(id) {
    Notifs.save(Notifs.all().map(n => n.id === id ? { ...n, read: true } : n));
  },

  markAllRead(userId) {
    Notifs.save(Notifs.all().map(n =>
      n.userId === userId ? { ...n, read: true } : n
    ));
  },

  delete(id) {
    Notifs.save(Notifs.all().filter(n => n.id !== id));
  },

  // FIX #4 — notifica subscritores quando novo post é publicado
  notifyNewPost(post) {
    const subscribers = Users.all().filter(u =>
      u.subscribedNewsletter && u.id !== post.authorId
    );
    subscribers.forEach(u => {
      Notifs.add(u.id, {
        type: 'new_post', icon: '📰',
        title: 'Novo artigo publicado!',
        body: `"${post.title.slice(0, 60)}" está disponível no DevBlog.`,
        link: `post.html?id=${post.id}`,
      });
    });
  },
};

/* ─────────────────────────────────────────
   MÓDULO: PROMOTIONS
   FIX #2 e #3 — comunicação bidirecional com notificações claras
───────────────────────────────────────── */
const Promotions = {
  all()     { return storageGet(STORAGE_KEYS.PROMOTIONS); },
  save(list){ storageSet(STORAGE_KEYS.PROMOTIONS, list); },
  pending() { return Promotions.all().filter(p => p.status === 'pendente'); },
  count()   { return Promotions.pending().length; },

  byUser(userId) {
    return Promotions.all().find(p => p.userId === userId && p.status === 'pendente') || null;
  },

  request(motivation) {
    const user = Session.currentUser();
    if (!user || user.role !== 'leitor') return { ok: false, error: 'Apenas leitores podem pedir promoção.' };
    if (Promotions.byUser(user.id)) return { ok: false, error: 'Já tens um pedido pendente.' };

    const req = {
      id: uid(),
      userId: user.id, userName: user.name, userEmail: user.email,
      motivation,
      testRequested: false, testTheme: null, testPost: null,
      status: 'pendente', createdAt: nowISO(),
    };
    const list = Promotions.all();
    list.push(req);
    Promotions.save(list);

    // Notificar todos os admins
    Users.all()
      .filter(u => u.role === 'admin')
      .forEach(admin => {
        Notifs.add(admin.id, {
          type: 'promo_request', icon: '⭐',
          title: 'Novo pedido de promoção',
          body: `${user.name} quer tornar-se escritor no DevBlog.`,
          link: 'admin/index.html',
        });
      });

    return { ok: true };
  },

  // FIX #2 — admin pede post de demonstração → utilizador recebe notificação
  requestTestPost(reqId, theme) {
    const list = Promotions.all().map(p =>
      p.id === reqId ? { ...p, testRequested: true, testTheme: theme || 'Tema livre' } : p
    );
    Promotions.save(list);

    const req = list.find(p => p.id === reqId);
    if (req) {
      Notifs.add(req.userId, {
        type: 'test_requested', icon: '✍️',
        title: 'O admin pediu-te um post de demonstração',
        body: theme
          ? `Tema sugerido: "${theme}". Acede ao teu perfil para submeter o post.`
          : 'Escreve um post de demonstração. Acede ao teu perfil para submeter.',
        link: 'profile.html',
      });
    }
  },

  // Utilizador submete post de teste → admin recebe notificação
  submitTestPost(reqId, title, content, catId) {
    const list = Promotions.all().map(p =>
      p.id === reqId ? { ...p, testPost: { title, content, catId } } : p
    );
    Promotions.save(list);

    const req = list.find(p => p.id === reqId);
    if (req) {
      Users.all()
        .filter(u => u.role === 'admin')
        .forEach(admin => {
          Notifs.add(admin.id, {
            type: 'test_submitted', icon: '📝',
            title: 'Post de demonstração recebido',
            body: `${req.userName} submeteu o post de demonstração para avaliação.`,
            link: 'admin/index.html',
          });
        });
    }
  },

  // FIX #3 — admin decide → utilizador recebe notificação clara
  decide(reqId, approved) {
    const req = Promotions.all().find(p => p.id === reqId);
    if (!req) return;

    if (approved) Users.updateRole(req.userId, 'escritor');

    const list = Promotions.all().map(p =>
      p.id === reqId
        ? { ...p, status: approved ? 'aprovado' : 'rejeitado', decidedAt: nowISO() }
        : p
    );
    Promotions.save(list);

    // Notificação clara para o utilizador
    Notifs.add(req.userId, {
      type: approved ? 'promoted' : 'rejected',
      icon: approved ? '🎉' : '❌',
      title: approved
        ? '🎉 Parabéns! Foste promovido a Escritor!'
        : 'Pedido de promoção não aprovado',
      body: approved
        ? 'A tua promoção a Escritor foi aprovada pelo admin. Já podes criar e publicar artigos no DevBlog!'
        : 'O teu pedido de promoção foi analisado e não foi aprovado desta vez. Podes tentar novamente mais tarde.',
      link: approved ? 'editor.html' : 'profile.html',
    });
  },
};

/* ─────────────────────────────────────────
   MÓDULO: NEWSLETTER
   FIX #4 — subscrição com notificações internas
───────────────────────────────────────── */
const Newsletter = {
  subscribe(email) {
    if (Session.isLoggedIn()) {
      const user = Session.currentUser();
      if (user.subscribedNewsletter) {
        return { ok: false, msg: 'Já estás subscrito à newsletter.' };
      }
      Users.update(user.id, { subscribedNewsletter: true });
      Notifs.add(user.id, {
        type: 'newsletter_confirm', icon: '✉️',
        title: 'Subscrito à newsletter!',
        body: 'Receberás uma notificação sempre que um novo artigo for publicado no DevBlog.',
        link: 'index.html',
      });
      return { ok: true, msg: 'Subscrito! As notificações chegam à tua conta.' };
    }

    // Utilizador não autenticado — guardar email
    const subs = storageGet(STORAGE_KEYS.SUBSCRIBERS);
    const clean = (email || '').toLowerCase().trim();
    if (!clean || !clean.includes('@')) return { ok: false, msg: 'Email inválido.' };
    if (subs.includes(clean)) return { ok: false, msg: 'Este email já está subscrito.' };
    subs.push(clean);
    storageSet(STORAGE_KEYS.SUBSCRIBERS, subs);
    return { ok: true, msg: 'Subscrito! Cria uma conta para receber notificações.' };
  },

  unsubscribe(userId) {
    Users.update(userId, { subscribedNewsletter: false });
  },
};

/* ─────────────────────────────────────────
   MÓDULO: ADMIN THEME
   FIX #7 — 5 temas persistidos no localStorage
───────────────────────────────────────── */
const AdminTheme = {
  THEMES: {
    dark:   { name: 'Escuro clássico',  sidebar: '#18171A', sidebarText: '#ffffff', accent: '#6B9CF6', body: '#F0EFF9' },
    black:  { name: 'Preto profundo',   sidebar: '#0D0D0F', sidebarText: '#ffffff', accent: '#818CF8', body: '#E8E7F0' },
    navy:   { name: 'Azul marinho',     sidebar: '#0F172A', sidebarText: '#ffffff', accent: '#38BDF8', body: '#EFF6FF' },
    forest: { name: 'Verde floresta',   sidebar: '#14532D', sidebarText: '#ffffff', accent: '#86EFAC', body: '#F0FDF4' },
    wine:   { name: 'Vinho tinto',      sidebar: '#4A0E0E', sidebarText: '#ffffff', accent: '#FCA5A5', body: '#FFF1F2' },
  },

  get() {
    return storageGet(STORAGE_KEYS.ADMIN_THEME, { theme: 'dark' }).theme || 'dark';
  },

  set(theme) {
    storageSet(STORAGE_KEYS.ADMIN_THEME, { theme });
  },

  apply(themeKey) {
    const theme = AdminTheme.THEMES[themeKey] || AdminTheme.THEMES.dark;
    const root = document.documentElement;
    root.style.setProperty('--adm-sidebar', theme.sidebar);
    root.style.setProperty('--adm-accent',  theme.accent);
    if (document.body) document.body.style.background = theme.body;
  },
};

/* ─────────────────────────────────────────
   IMAGE COMPRESSION
───────────────────────────────────────── */
const ImgUtil = {
  compress(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file) return reject('Nenhum ficheiro fornecido');
      const reader = new FileReader();
      reader.onerror = () => reject('Erro ao ler ficheiro');
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject('Imagem inválida');
        img.onload = () => {
          const ratio  = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },
  avatar(file) { return ImgUtil.compress(file, 200, 0.85); },
  post(file)   { return ImgUtil.compress(file, 900, 0.80); },
};

/* ─────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────── */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '·'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  // Remover após 3.5 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Alias para compatibilidade
const toast = showToast;

/* ─────────────────────────────────────────
   NOTIFICATION BELL
   FIX #5 — badge com contador, painel dropdown
───────────────────────────────────────── */
function buildNotifBell() {
  const user = Session.currentUser();
  if (!user) return '';

  const unread   = Notifs.unreadCount(user.id);
  const notifList = Notifs.forUser(user.id).slice(0, 15);
  const isAdmin   = window.location.pathname.includes('/admin/');
  const base      = isAdmin ? '../' : '';

  const items = notifList.length === 0
    ? '<div class="notif-empty">Sem notificações de momento.</div>'
    : notifList.map(n => `
        <div class="notif-item ${n.read ? '' : 'notif-unread'}"
             onclick="openNotif('${n.id}', '${base}${n.link || ''}')">
          <span class="notif-emoji">${n.icon || '·'}</span>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-body">${n.body}</div>
            <div class="notif-time">${timeAgo(n.createdAt)}</div>
          </div>
          ${!n.read ? '<span class="notif-dot"></span>' : ''}
        </div>`
      ).join('');

  return `
    <div class="notif-wrapper" id="notifWrapper">
      <button class="notif-bell" onclick="toggleNotifPanel(event)" aria-label="Notificações (${unread} não lidas)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        ${unread > 0 ? `<span class="notif-badge">${unread > 9 ? '9+' : unread}</span>` : ''}
      </button>
      <div class="notif-panel hidden" id="notifPanel">
        <div class="notif-panel-header">
          <span class="notif-panel-title">Notificações</span>
          ${unread > 0
            ? `<button class="notif-mark-all" onclick="markAllNotifsRead(event)">Marcar todas lidas</button>`
            : ''
          }
        </div>
        <div class="notif-list">${items}</div>
      </div>
    </div>`;
}

function toggleNotifPanel(e) {
  e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  const isOpen = !panel.classList.contains('hidden');
  if (isOpen) {
    panel.classList.add('hidden');
  } else {
    panel.classList.remove('hidden');
    // Fechar ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', function closePanel() {
        panel.classList.add('hidden');
        document.removeEventListener('click', closePanel);
      });
    }, 0);
  }
}

function openNotif(id, link) {
  Notifs.markRead(id);
  renderNav();
  if (link && link !== '') window.location.href = link;
}

function markAllNotifsRead(e) {
  e.stopPropagation();
  const user = Session.currentUser();
  if (user) Notifs.markAllRead(user.id);
  renderNav();
}

/* ─────────────────────────────────────────
   NAVBAR RENDER
   FIX #6 — layout flexbox correcto
   [Logo] — [Nav Links centrados] — [Acções à direita]
───────────────────────────────────────── */
function renderNav() {
  const el = document.querySelector('.nav-actions');
  if (!el) return;

  const user  = Session.currentUser();
  const isAdm = window.location.pathname.includes('/admin/');
  const base  = isAdm ? '../' : '';

  if (!user) {
    el.innerHTML = `
      <a href="${base}login.html"    class="btn btn-sm">Entrar</a>
      <a href="${base}register.html" class="btn btn-primary btn-sm">Registar</a>`;
    return;
  }

  const full = Users.find(user.id);
  const avatarHtml = full?.avatar
    ? `<img src="${full.avatar}" class="nav-avatar-img" alt="Avatar">`
    : `<span class="nav-avatar-initials">${(user.name || 'U')[0].toUpperCase()}</span>`;

  el.innerHTML = `
    ${Session.hasRole('admin', 'escritor')
      ? `<a href="${base}editor.html" class="btn btn-primary btn-sm">+ Novo Post</a>`
      : ''
    }
    ${Session.hasRole('admin')
      ? `<a href="${base}admin/index.html" class="btn btn-sm">Admin</a>`
      : ''
    }
    ${buildNotifBell()}
    <a href="${base}profile.html" class="nav-profile-btn">
      <div class="nav-avatar">${avatarHtml}</div>
      <span class="nav-username">${(user.name || '').split(' ')[0]}</span>
    </a>
    <button class="btn btn-sm btn-outline" onclick="logoutUser()">Sair</button>
  `;
}

function logoutUser() {
  Session.clear();
  showToast('Sessão terminada.', 'info');
  const base = window.location.pathname.includes('/admin/') ? '../' : '';
  setTimeout(() => window.location.href = base + 'index.html', 600);
}

// Alias
const logout = logoutUser;
const updateNav = renderNav;

/* ─────────────────────────────────────────
   SCROLL NAVBAR
───────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 10);
});

/* ─────────────────────────────────────────
   INICIALIZAÇÃO
───────────────────────────────────────── */
seedDatabase();

// Exportar para uso global nas páginas
window.DB = {
  Session, Users, Cats, Posts, Comments, Reactions,
  Notifs, Promotions, Newsletter, AdminTheme,
  ImgUtil, uid, nowISO, formatDate, timeAgo, textToHtml,
};
