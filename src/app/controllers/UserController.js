import User from '../models/User';
class UserController {
  async store(req, res) {
    const UsuarioExiste = await User.findOne({
      where: { email: req.body.email },
    });

    if (UsuarioExiste) {
      return res.status(400).json({ error: 'Usuario já existente.' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
  async update(req, res) {
    res.json({ ok: true });
  }
}

export default new UserController();
