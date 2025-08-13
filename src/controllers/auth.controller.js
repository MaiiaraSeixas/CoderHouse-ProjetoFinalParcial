// controllers/auth.controller.js

import UserModel from '../models/user.model.js';
import { createHash, isValidPassword } from '../utils/cryptography.js';
import { generateToken } from '../utils/jwt.js';
import { cookieExtractor } from '../utils/cookieExtractor.js';
import CartModel from '../models/cart.model.js';

// ✅ REGISTRO DE USUÁRIO
export const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, age } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.sendError('Usuário já existe', 400);

    const hashedPassword = createHash(password);

    // Cria um novo carrinho para o usuário
    const newCart = await CartModel.create({ user: email, products: [] });

    const newUser = await UserModel.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      age,
      role: 'user',
      cartId: newCart._id
    });

    res.sendCreated({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.sendError('Erro ao registrar usuário', 500);
  }
};

// ✅ LOGIN DE USUÁRIO COM ENVIO DO COOKIE JWT
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user || !isValidPassword(password, user.password)) {
      return res.sendError('Credenciais inválidas', 401);
    }

    // ✅ Garante que o cartId está presente antes de gerar o token
    const cart = await CartModel.findOne({ user: user._id })
      || await CartModel.create({ user: user._id, products: [] });
    user.cartId = cart._id;

    const token = generateToken({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        cartId: user.cartId
      }
    });

    res
      .cookie('jwtCookieToken', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'strict'
      });

    req.session.user = {
      _id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };

    res.sendSuccess({ message: 'Login bem-sucedido' });
  } catch (error) {
    console.error('Erro no login:', error);
    res.sendError('Erro no login', 500);
  }
};

// ✅ DADOS DO USUÁRIO LOGADO
export const getCurrentUser = (req, res) => {
  if (!req.user) return res.sendError('Não autenticado', 401);

  const { _id, first_name, last_name, email, role } = req.user;
  res.sendSuccess({ user: { _id, first_name, last_name, email, role } });
};
