import { expect } from 'chai';
import supertest from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import UserModel from '../models/user.model.js';
import path from 'path';
import fs from 'fs';
import { createHash } from '../utils/cryptography.js';
import { generateToken } from '../utils/jwt.js';

const requester = supertest(app);

describe('Users API Integration Tests', function() {
    this.timeout(10000);

    let testUser;
    let adminUser;
    let authToken;
    let adminToken;

    before(async () => {
        await mongoose.connection.collection('users').deleteMany({});

        testUser = await UserModel.create({
            first_name: 'Test', last_name: 'User', email: 'testuser.premium@example.com',
            password: createHash('password123'), role: 'user'
        });

        adminUser = await UserModel.create({
            first_name: 'Admin', last_name: 'User', email: 'admin.premium@example.com',
            password: createHash('adminpassword'), role: 'admin'
        });

        authToken = generateToken({ user: { _id: testUser._id.toString(), email: testUser.email, role: testUser.role } });
        adminToken = generateToken({ user: { _id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role } });

        const testFilesDir = path.resolve('./uploads/documents');
        if (!fs.existsSync(testFilesDir)) {
            fs.mkdirSync(testFilesDir, { recursive: true });
        }
    });


    describe('User Document Upload', () => {
        it('POST /api/users/:uid/documents should upload a document successfully', async () => {
            const filePath = path.resolve('./uploads/documents/test-doc.pdf');
            fs.writeFileSync(filePath, 'This is a test document.');

            const res = await requester
                .post(`/api/users/${testUser._id}/documents`)
                .set('Cookie', `jwtCookieToken=${authToken}`)
                .attach('document', filePath, 'test-doc.pdf');

            expect(res.status).to.equal(200);
            expect(res.body.payload.message).to.equal('Documentos enviados com sucesso!');

            const user = await UserModel.findById(testUser._id).lean();
            expect(user.documents).to.be.an('array').with.lengthOf(1);
            expect(user.documents[0].name).to.equal('test-doc.pdf');

            fs.unlinkSync(filePath);
        });
    });

    describe('Premium Role Management', () => {
        beforeEach(async () => {
            await UserModel.findByIdAndUpdate(testUser._id, { $set: { role: 'user', documents: [] } });
        });

        it('PUT /api/users/premium/:uid should FAIL to upgrade if Identification is not uploaded', async () => {
            const res = await requester
                .put(`/api/users/premium/${testUser._id}`)
                .set('Cookie', `jwtCookieToken=${adminToken}`);

            expect(res.status).to.equal(400);
            expect(res.body.error).to.include('Identification');
        });

        it('PUT /api/users/premium/:uid should SUCCEED after Identification is uploaded', async () => {
            const idFilePath = path.resolve('./uploads/documents/Identification.pdf');
            fs.writeFileSync(idFilePath, 'dummy identification content');

            await requester
                .post(`/api/users/${testUser._id}/documents`)
                .set('Cookie', `jwtCookieToken=${authToken}`)
                .attach('document', idFilePath, 'Identification.pdf');

            const res = await requester
                .put(`/api/users/premium/${testUser._id}`)
                .set('Cookie', `jwtCookieToken=${adminToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.payload.user.role).to.equal('premium');

            fs.unlinkSync(idFilePath);
        });
    });

    describe('User Login', () => {
        it('POST /api/sessions/login should update last_connection', async () => {
            const userBeforeLogin = await UserModel.findById(testUser._id).lean();
            const initialConnection = userBeforeLogin.last_connection;

            const loginRes = await requester.post('/api/sessions/login').send({
                email: testUser.email,
                password: 'password123'
            });

            expect(loginRes.status).to.equal(200);

            const userAfterLogin = await UserModel.findById(testUser._id).lean();
            expect(userAfterLogin.last_connection).to.be.a('date');
            if (initialConnection) {
                expect(userAfterLogin.last_connection.getTime()).to.be.greaterThan(initialConnection.getTime());
            }
        });
    });
});
