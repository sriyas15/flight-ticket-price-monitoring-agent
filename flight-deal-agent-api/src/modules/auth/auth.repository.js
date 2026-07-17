/**
 * Auth repository delegates to UserRepository.
 * Keeping it as a separate layer means auth logic never reaches
 * into the users module's internals directly — and we can add
 * auth-specific models (e.g. token blocklist) here later.
 */
import UserRepository from "../users/user.repository.js";

const AuthRepository = {
  findByEmail: (email) =>
    UserRepository.findByEmail(email, true), // always fetch password for auth

  findById: (id) =>
    UserRepository.findById(id),

  findByIdWithRefreshToken: (id) =>
    UserRepository.findByIdWithRefreshToken(id),

  createUser: (data) =>
    UserRepository.create(data),

  existsByEmail: (email) =>
    UserRepository.existsByEmail(email),

  setRefreshToken: (id, hash) =>
    UserRepository.setRefreshToken(id, hash),

  setPasswordResetToken: (id, token, expires) =>
    UserRepository.setPasswordResetToken(id, token, expires),

  findByResetToken: (token) =>
    UserRepository.findByResetToken(token),

  clearPasswordReset: (id, newPasswordHash) =>
    UserRepository.clearPasswordReset(id, newPasswordHash),
};

export default AuthRepository;
