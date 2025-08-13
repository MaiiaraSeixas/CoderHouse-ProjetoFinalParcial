import { Router } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt.js';
import CartModel from '../models/cart.model.js';
import UserModel from '../models/user.model.js'; // Import UserModel
import UserDTO from '../dtos/UserDTO.js';

const router = Router();

// Helper para configurar cookie JWT
function setAuthCookie(res, token) {
  res.cookie('jwtCookieToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 1000, // 1h
  });
}

// Wrapper genérico de login (HTML ou API)
function handleLogin(req, res, next, isApi = false) {
  passport.authenticate('login', { session: false }, async (err, user, info) => {
    if (err) {
      console.error('[LOGIN ERROR]', err);
      return isApi
        ? res.status(500).json({ status: 'error', error: 'Erro interno no servidor' })
        : res.redirect('/login?error=1');
    }

    if (!user) {
      const msg = info?.message || 'Credenciais inválidas';
      console.warn('[LOGIN FAIL]', msg);
      return isApi
        ? res.status(401).json({ status: 'error', error: msg })
        : res.redirect('/login?error=1');
    }

    try {
      // Atualiza a última conexão do usuário
      user.last_connection = new Date();
      await user.save();

      const tokenPayload = {
        _id: user._id,
        email: user.email,
        role: user.role,
        cartId: user.cartId?.toString(),
      };

      const token = generateToken(tokenPayload);
      if (!token) {
        console.error('[DEBUG] Falha ao gerar token. Payload:', tokenPayload);
        return isApi
          ? res.status(500).json({ status: 'error', error: 'Erro ao gerar token' })
          : res.redirect('/login?error=2');
      }

      setAuthCookie(res, token);

      if (!isApi) {
        req.session.user = {
          _id: user._id,
          first_name: user.first_name,
          email: user.email,
          role: user.role,
        };

        const cart = await CartModel.findOne({ user: user._id })
          || await CartModel.create({ user: user._id, products: [] });

        req.session.cartId = cart._id;

        return res.redirect('/products');
      }

      return res.sendSuccess('Login bem-sucedido');
    } catch (tokenErr) {
      console.error('[TOKEN ERROR]', tokenErr);
      return isApi
        ? res.status(500).json({ status: 'error', error: 'Erro ao gerar token' })
        : res.redirect('/login?error=2');
    }
  })(req, res, next);
}

// ... (o resto do arquivo permanece o mesmo) ...

// ----------------------
// Registro via Formulário
// ----------------------
router.post(
  '/register/form',
  passport.authenticate('register', {
    failureRedirect: '/register?error=1',
    session: false,
  }),
  (req, res) => res.redirect('/login')
);

// ----------------------
// Login via Formulário
// ----------------------
router.post('/login/form', (req, res, next) => {
  handleLogin(req, res, next, false);
});

// ----------------------
// Registro via API (SPA/Postman)
// ----------------------
router.post(
  '/register',
  passport.authenticate('register', { session: false }),
  (req, res) => {
    try {
      // CORREÇÃO: Usar res.sendCreated com um único objeto de payload
      res.sendCreated({
        message: 'Usuário registrado com sucesso',
        user: new UserDTO(req.user)
      });
    } catch (e) {
      console.error('[REGISTER API ERROR]', e);
      res.status(500).json({ status: 'error', error: 'Erro interno no servidor' });
    }
  }
);

// ----------------------
// Login via API (SPA/Postman)
// ----------------------
router.post('/login', (req, res, next) => {
  handleLogin(req, res, next, true);
});

// ----------------------
// Rota /current
// ----------------------
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    try {
      const safeUser = new UserDTO(req.user);
      res.sendSuccess({ message: 'Usuário autenticado', user: safeUser });
    } catch (e) {
      console.error('[CURRENT USER ERROR]', e);
      res.status(500).json({ status: 'error', error: 'Erro ao recuperar dados do usuário' });
    }
  }
);

// ----------------------
// Logout
// ----------------------
router.get('/logout', (req, res) => {
  try {
    res.clearCookie('jwtCookieToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    if (req.accepts('html')) {
      req.logout(() => res.redirect('/login'));
    } else {
      res.sendSuccess('Logout realizado com sucesso');
    }
  } catch (e) {
    console.error('[LOGOUT ERROR]', e);
    res.status(500).json({ status: 'error', error: 'Erro durante logout' });
  }
});

// --- ROTAS DE AUTENTICAÇÃO COM GITHUB (CORRIGIDAS) ---

// 1. Inicia o fluxo de autenticação, redirecionando para o GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

// 2. Rota de callback que o GitHub chama após a autorização do usuário
router.get(
  '/githubcallback',
  // O passport.authenticate('github') chama a estratégia. Se for bem-sucedida, o objeto 'user' é colocado em req.user.
  passport.authenticate('github', { failureRedirect: '/login', session: false }),

  // 3. Este handler é executado após a autenticação bem-sucedida.
  (req, res) => {
    // --- CORREÇÃO PRINCIPAL ---
    // Criamos um objeto de payload limpo e explícito para garantir que o cartId está incluído.
    const userPayload = {
      _id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      age: req.user.age,
      cartId: req.user.cartId, // Este é o campo mais importante
      role: req.user.role
    };

    // Geramos o token com este payload limpo.
    const token = generateToken(userPayload);

    // Definimos o cookie no navegador.
    res.cookie('jwtCookieToken', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hora
      sameSite: 'Lax' // Necessário para redirecionamentos
    });

    // Finalmente, redirecionamos para a página de produtos.
    res.redirect('/products');
  }
);

export default router;
