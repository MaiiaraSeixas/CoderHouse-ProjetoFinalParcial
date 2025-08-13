import { Router } from 'express';
import passport from 'passport';
import { getAllUsers, getUserById, deleteUser, uploadDocuments, changeUserRole } from '../controllers/users.controller.js';
import handlePolicies from '../middlewares/handlePolicies.js';
import uploader from '../utils/multer.js';

const router = Router();

// Rota para obter todos os usuários (apenas Admin)
router.get('/',
    passport.authenticate('jwt', { session: false }),
    handlePolicies(['ADMIN']),
    getAllUsers
);

// Rota para obter um usuário por ID (apenas Admin)
router.get('/:uid',
    passport.authenticate('jwt', { session: false }),
    handlePolicies(['ADMIN']),
    getUserById
);

// Rota para deletar um usuário (apenas Admin)
router.delete('/:uid',
    passport.authenticate('jwt', { session: false }),
    handlePolicies(['ADMIN']),
    deleteUser
);

// Rota para upload de documentos (qualquer usuário logado)
// O nome do campo no formulário deve ser 'document'
router.post('/:uid/documents',
    passport.authenticate('jwt', { session: false }),
    uploader.array('document', 5), // Permite até 5 arquivos com o fieldname 'document'
    uploadDocuments
);

// Rota para alterar o role de um usuário para premium e vice-versa
router.put('/premium/:uid',
    passport.authenticate('jwt', { session: false }),
    handlePolicies(['ADMIN']), // Protegido para que apenas admins possam alterar roles
    changeUserRole
);

export default router;