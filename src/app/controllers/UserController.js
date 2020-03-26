import User from '../models/User';
class UserController {
  async store(req, res) {
    const UsuarioExiste = await User.findOne({
      where: { email: req.body.email },
    });

    if (UsuarioExiste) {
      return res.status(400).json({ erro: 'Usuario já existente.' });
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
    const { email, oldPassword } = req.body;
    const user = await User.findByPk(req.userId);
    if (
      email &&
      email !== user.email &&
      (await User.findOne({
        where: { email },
      }))
    ) {
      return res
        .status(400)
        .json({ erro: 'E-mail já utilizado por outro usuário.' });
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ erro: 'Senha não combina' });
    }
    const { id, name, provider } = await user.update(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();
