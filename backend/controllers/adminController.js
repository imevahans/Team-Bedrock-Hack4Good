exports.manageUser = async (req, res) => {
    const { action, email } = req.body;
  
    try {
      const session = driver.session();
  
      if (action === 'add') {
        const hashedPassword = await bcrypt.hash('defaultPassword', 10);
        await session.run(
          'CREATE (u:User {email: $email, password: $password, role: "resident"})',
          { email, password: hashedPassword }
        );
        return res.status(201).json({ message: 'User added successfully' });
      }
  
      if (action === 'suspend') {
        await session.run('MATCH (u:User {email: $email}) SET u.suspended = true', { email });
        return res.status(200).json({ message: 'User suspended successfully' });
      }
  
      if (action === 'reset') {
        const hashedPassword = await bcrypt.hash('defaultPassword', 10);
        await session.run(
          'MATCH (u:User {email: $email}) SET u.password = $password',
          { email, password: hashedPassword }
        );
        return res.status(200).json({ message: 'Password reset successfully' });
      }
  
      res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  