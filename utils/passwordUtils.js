const bcrypt = require('bcryptjs');

class PasswordUtils {
  async hashPassword(password) {
    console.log('PasswordUtils.hashPassword called');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    console.log('PasswordUtils.hashPassword completed');
    return hashed;
  }

  async comparePassword(password, hashedPassword) {
    console.log('PasswordUtils.comparePassword called');
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('PasswordUtils.comparePassword result:', result);
    return result;
  }
}

module.exports = new PasswordUtils();
