import UserRepository from "../users/user.repository.js";

const AuthRepository = {
  findByEmail:               (email) => UserRepository.findByEmail(email, true),
  findById:                  (id)    => UserRepository.findById(id),
  findByIdWithRefreshToken:  (id)    => UserRepository.findByIdWithRefreshToken(id),
  createUser:                (data)  => UserRepository.create(data),
  existsByEmail:             (email) => UserRepository.existsByEmail(email),
  setRefreshToken:           (id, hash) => UserRepository.setRefreshToken(id, hash),

  // ── OTP ──────────────────────────────────────────────────────────────────
  setOtp:               (id, hash, expires) => UserRepository.setOtp(id, hash, expires),
  findByIdWithOtp:      (id)               => UserRepository.findByIdWithOtp(id),
  clearOtp:             (id)               => UserRepository.clearOtp(id),

  // ── Password reset ────────────────────────────────────────────────────────
  setPasswordResetToken: (id, token, expires) => UserRepository.setPasswordResetToken(id, token, expires),
  findByResetToken:      (token)              => UserRepository.findByResetToken(token),
  clearPasswordReset:    (id, hash)           => UserRepository.clearPasswordReset(id, hash),
};

export default AuthRepository;