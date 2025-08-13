// services/user.service.js
import UserModel from '../models/user.model.js';
import CartModel from '../models/cart.model.js';

class UserService {
  async getUserByEmail(email) {
    return await UserModel.findOne({ email }).lean();
  }

  async getUserById(id) {
    return await UserModel.findById(id).lean();
  }

  // --- MÉTODO CREATEUSER CORRIGIDO E ROBUSTO ---
  // Garante que todo novo usuário tenha um carrinho desde o momento da criação.
  async createUser(userData) {
    // 1. Cria o usuário no banco de dados
    const newUser = await UserModel.create(userData);

    // 2. Cria um carrinho vazio para este novo usuário
    const newCart = await CartModel.create({ user: newUser._id, products: [] });

    // 3. Atualiza o documento do usuário para associar o ID do novo carrinho
    // O { new: true } garante que a operação retorna o documento do usuário já atualizado.
    const userWithCart = await UserModel.findByIdAndUpdate(
      newUser._id,
      { $set: { cartId: newCart._id } },
      { new: true }
    ).lean();

    // 4. Retorna o usuário completo com o cartId associado
    return userWithCart;
  }

  async getAllUsers() {
    return await UserModel.find({}).lean();
  }

  async deleteUser(id) {
    const result = await UserModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  async changeRole(uid) {
    const user = await UserModel.findById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      return user; // Admins cannot change their own role
    }

    // Logic to upgrade to premium
    if (user.role === 'user') {
      // The user only specified "Identificacion" as the required document.
      const hasIdentification = user.documents.some(doc => doc.name.toLowerCase().includes('identificacao'));

      if (!hasIdentification) {
        throw new Error('User has not uploaded the required "Identification" document to become premium.');
      }
      user.role = 'premium';
    } else if (user.role === 'premium') {
      user.role = 'user'; // Optional: allow downgrading
    }

    await user.save();
    return user;
  }

  async updateUserDocuments(uid, files) {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload.');
    }

    const user = await UserModel.findById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const newDocuments = files.map(file => ({
      name: file.originalname,
      reference: file.path
    }));

    user.documents.push(...newDocuments);
    await user.save();
    return user;
  }

  // Função auxiliar para garantir que um usuário existente tenha um carrinho
  async ensureCartForUser(userId) {
    const cart = await CartModel.create({ user: userId, products: [] });
    await UserModel.findByIdAndUpdate(userId, { cartId: cart._id });
    return cart._id;
  }
}

export default new UserService();







// // services/user.service.js

// import UserModel from '../models/user.model.js';
// import CartModel from '../models/cart.model.js'; 

// class UserService {
//   // Busca usuário por e-mail (retorna objeto puro para melhor performance)
//   async getUserByEmail(email) {
//     return await UserModel.findOne({ email }).lean();
//   }

//   // Busca usuário por ID
//   async getUserById(id) {
//     return await UserModel.findById(id).lean();
//   }

//   // Cria um novo usuário
//   async createUser(userData) {
//     return await UserModel.create(userData);
//   }

//   // Lista todos os usuários
//   async getAllUsers() {
//     return await UserModel.find({}).lean();
//   }

//   // Remove usuário por ID
//   async deleteUser(id) {
//     const result = await UserModel.findByIdAndDelete(id);
//     return Boolean(result);
//   }

//   // Alterna entre roles "user" e "premium"
//   async changeRole(uid) {
//     const user = await UserModel.findById(uid);
//     if (!user) return null;
//     user.role = user.role === 'user' ? 'premium' : 'user';
//     await user.save();
//     return user;
//   }
//   // Novo método para garantir que o usuário tenha um carrinho
//   async createEmptyCartForUser(userId) {
//     const newCart = await CartModel.create({ user: userId, products: [] });
//     await UserModel.findByIdAndUpdate(userId, { cartId: newCart._id });
//     return newCart;
//   }
// }

// export default new UserService();
