import User from "./user.model.js";

const UserRepository = {
  /**
   * Find user by email. Password excluded by default (select:false on schema).
   * Pass selectPassword=true when you need to verify credentials.
   */
  findByEmail: (email, selectPassword = false) => {
    const q = User.findOne({ email: email.toLowerCase().trim() });
    if (selectPassword) q.select("+password");
    return q.exec();
  },

  findById: (id, selectSensitive = false) => {
    const q = User.findById(id);
    if (selectSensitive) q.select("+password +refreshTokenHash");
    return q.exec();
  },

  findByGoogleId: (googleId) =>
    User.findOne({ googleId }).exec(),

  create: (data) =>
    User.create(data),

  updateById: (id, update) =>
    User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec(),

  /**
   * Store a hashed refresh token on the user document.
   * Pass null to clear it (logout / rotation).
   */
  setRefreshToken: (id, hash) =>
    User.findByIdAndUpdate(id, { refreshTokenHash: hash }).exec(),

  /** Find user and include refreshTokenHash for token rotation checks */
  findByIdWithRefreshToken: (id) =>
    User.findById(id).select("+refreshTokenHash").exec(),

  setPasswordResetToken: (id, token, expires) =>
    User.findByIdAndUpdate(id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    }).exec(),

  findByResetToken: (token) =>
    User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    })
      .select("+passwordResetToken +passwordResetExpires")
      .exec(),

  clearPasswordReset: (id, newPasswordHash) =>
    User.findByIdAndUpdate(id, {
      password: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    }).exec(),

  existsByEmail: async (email) => {
    const count = await User.countDocuments({ email: email.toLowerCase().trim() });
    return count > 0;
  },
};

export default UserRepository;
