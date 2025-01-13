const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const driver = require('../config/neo4j');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const session = driver.session();
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const session = driver.session();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await session.run(
      'MATCH (u:User {email: $email}) SET u.password = $password RETURN u',
      { email, password: hashedPassword }
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
