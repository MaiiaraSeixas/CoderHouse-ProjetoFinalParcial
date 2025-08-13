// controllers/users.controller.js

import userService from '../services/user.service.js';

// Controlador para obter todos os usuários
export const getAllUsers = async (req, res) => {
  try {
    // Chama o serviço para buscar todos os usuários cadastrados
    const users = await userService.getAllUsers();
    
    // Retorna a lista de usuários
    res.sendSuccess({ users });
  } catch (error) {
    // Log do erro e resposta de erro genérico
    req.logger.error(error);
    res.sendError('Erro ao buscar usuários', 500);
  }
};

// Controlador para obter um usuário específico por ID
export const getUserById = async (req, res) => {
  try {
    // Extrai o ID do usuário dos parâmetros da URL
    const { id } = req.params;
    
    // Busca o usuário pelo ID usando o serviço
    const user = await userService.getUserById(id);
    
    // Verifica se o usuário foi encontrado
    if (!user) return res.sendError('Usuário não encontrado', 404);
    
    // Retorna os dados do usuário
    res.sendSuccess({ user });
  } catch (error) {
    // Log do erro e resposta de erro
    req.logger.error(error);
    res.sendError('Erro ao buscar usuário', 500);
  }
};

// Controlador para excluir um usuário
export const deleteUser = async (req, res) => {
  try {
    // Extrai o ID do usuário dos parâmetros da URL
    const { id } = req.params;
    
    // Chama o serviço para excluir o usuário
    const deleted = await userService.deleteUser(id);
    
    // Verifica se o usuário foi encontrado e excluído
    if (!deleted) return res.sendError('Usuário não encontrado', 404);
    
    // Retorna mensagem de sucesso
    res.sendSuccess({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    // Log do erro e resposta de erro
    req.logger.error(error);
    res.sendError('Erro ao deletar usuário', 500);
  }
};

export const uploadDocuments = async (req, res) => {
  try {
    const { uid } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.sendError('Nenhum arquivo foi enviado', 400);
    }

    const updatedUser = await userService.updateUserDocuments(uid, files);

    res.sendSuccess({
      message: 'Documentos enviados com sucesso!',
      user: updatedUser
    });

  } catch (error) {
    req.logger.error(`Erro ao fazer upload de documentos: ${error.message}`);
    res.sendError('Erro ao fazer upload de documentos', 500);
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await userService.changeRole(uid);
    res.sendSuccess({
      message: `User role successfully updated to ${user.role}.`,
      user
    });
  } catch (error) {
    req.logger.error(`Failed to change user role for UID ${req.params.uid}: ${error.message}`);

    if (error.message.includes('document')) {
      return res.sendError(error.message, 400); // Bad request if docs are missing
    }
    if (error.message.includes('not found')) {
      return res.sendError(error.message, 404); // Not found
    }

    res.sendError('An internal error occurred while changing the user role.', 500);
  }
};