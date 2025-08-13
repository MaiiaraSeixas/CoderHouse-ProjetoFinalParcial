// Importa a biblioteca Mongoose para modelagem de dados
import mongoose from 'mongoose';

// Define o schema (estrutura) do usuário com validações e configurações
const userSchema = new mongoose.Schema({
  first_name: {
    type: String // Nome do usuário
  },
  last_name: {
    type: String // Sobrenome (não obrigatório)
  },
  email: {
    type: String,
    unique: true,   // Garante unicidade
    sparse: true    // Permite múltiplos documentos sem o campo email
  },
  password: {
    type: String    // Senha (deve ser hasheada antes de armazenar)
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'premium'], // Valores permitidos
    default: 'user'          // Valor padrão se não especificado
  },
  documents: [{
    name: { type: String },
    reference: { type: String }
  }],
  last_connection: {
    type: Date
  },
  githubId: {
    type: String    // ID único do GitHub para autenticação social
  },
  avatar: {
    type: String    // URL da imagem do avatar/perfil
  },
  createdAt: {
    type: Date,
    default: Date.now // Data de criação do usuário, padrão é a data atual
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId, // Referência ao carrinho de compras do usuário
    ref: 'Cart' // Nome do modelo referenciado
  },
});

// Cria o modelo User baseado no schema
const UserModel = mongoose.model('User', userSchema);

// Exporta o modelo para uso em outras partes da aplicação
export default UserModel;